---
layout: post
title: "How Neglected Code Slowed an API"
category: tech
series: 속도개선
lang: en
ref: neglected-code-slow-api
last_modified_at: 2026-01-17
---

1. [Summary](#1-summary)
2. [Defining the problem](#2-defining-the-problem)
3. [Analyzing the problem](#3-analyzing-the-problem)
4. [Design and implementation](#4-design-and-implementation)
5. [Limitations](#5-limitations)
6. [Looking back](#6-looking-back)

---

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="/assets/attachments/2026-01-06/charts.js" type="module"></script>


# 1. Summary

**Analyzed and removed intermittent latency in an API service, improving the tail latency (P95 and above) by 94%**
- Intermittent response-time latency caused by synchronized **synchronous logging**,
- improved with **asynchronous logging** over a distributed queue plus Spring Batch.

<canvas id="boxPlotChart" style="max-height: 300px;"></canvas>

| Metric | Before | After | Improvement |
|------|-------|-------|--------|
| P95 | 3,983.20ms | 231ms | **94.2%** |
| P99 | 5,190.01ms | 321.01ms | **93.8%** |
| mean response time | 427.62ms | 166.10ms | **61.1%** |

*(more charts are in the footnotes)*[^1]

---

# 2. Defining the problem

## 2.1. The symptom

My company runs web and API services on Spring Boot, OpenShift, and Oracle.

We noticed that an API service, normally fast, would intermittently take more than 5 seconds. Checking the APM, transactions were being delayed in a line.

The main characteristics:
- When one transaction is slow, the transactions that follow are delayed with it.
- The delayed transactions all finish at once.


## 2.2. The cause

It was an API-log Aspect, implemented as a stopgap and then left alone.
```java
ConcurrentLinkedQueue<LogDto> q = new ConcurrentLinkedQueue<LogDto>();

@Around
public Object ... {
  synchronized(q) {
    while (!q.isEmpty()) {
      var dto = q.poll();
      dao.insertLog(dto); // actually 9 queries
    }
  }
}
```
This code is a clear anti-pattern.
  - Per-request threads can contend inside the synchronized block.
  - Having each JVM manage its pod's requests is not suited to a distributed environment either.

The team knew this code existed, but tolerated it on the grounds that the bottleneck was rarely observed.

*(a detailed analysis of the transaction-bunching phenomenon is in the footnotes)*[^2]

---

# 3. Analyzing the problem

Improvement was needed. But whether it was needed right now was a separate question. So, to make the call, I wanted to check two things first:

a. Is synchronized the culprit?

b. Is fixing synchronized worth it?

## 3.1. Is synchronized the culprit?

The intermittent transaction latency is due to synchronized. But if the cause lay outside, the story changes. Say a service using too many resources was creating load, and that was why the bottleneck happened often. Then fixing synchronized might not be urgent.

So I decided to look at how the external factors had changed. I pulled the transactions with a response time over 5,000ms in the past month and examined the main metrics for those time windows.

### Hypothesis 1: slow queries are the cause

- **Analysis**: run EXPLAIN on the main delayed queries, or run them directly in production
- **Result**: query execution time was consistently short
- **Verdict**: ❌ **rejected**. This hypothesis cannot explain transactions being delayed one after another.

### Hypothesis 2: user load is the cause

- **Analysis**: analyze average and peak TPS per minute in an Excel chart
- **Result**: average TPS 1 to 2, peak TPS 40
- **Verdict**: ❌ **rejected**. The load itself is very low, hard to see as the cause of a bottleneck.

### Hypothesis 3: system resources are the bottleneck

- **Analysis**: analyze the per-minute DB active connection pool, heap memory usage (eden/old), and GC frequency in an Excel chart
- **Result**: no correlation between transaction-delay timing and resource usage
- **Verdict**: ❌ **rejected**. There is no resource-load pattern that changes along with the delay.

<br>

By this point it was taking a lot of time and drifting from the intent of "investigate quickly to make a decision." So I changed approach.

---

## 3.2. Is fixing synchronized worth it?

The earlier analysis ruled out external factors, so now it is synchronized's turn to be suspected.

### Hypothesis

> Remove the synchronized block and split logging out asynchronously, and the "queuing" between transactions disappears and response time improves.

To test this hypothesis, you have to compare with and without synchronized.

But what happens if you only remove synchronized? Several threads try to INSERT into the DB at once, and another contention arises. In the end, removing synchronized alone is not a fundamental fix; you have to **split logging itself out of the API flow**.

So first I built a **version that omits logging entirely** and decided to measure the best-case performance. The real async implementation adds the enqueue time, but the purpose of this experiment was to quickly judge "whether it is worth improving."

### Experiment design

First, model the real environment. Investigating a popular API in production, about **2 to 4% of transactions were delayed over 5 seconds**. Reproduce that rate in the dev environment and you get a reasonably fair experiment.

#### Step 1: reproduce the problem

I added a test Aspect that adds a 5-second delay with 3% probability at the logging stage.
```java
@Around((... insertLog(..)))  // when adding a log,
public Object ... {
  if (ThreadLocalRandom.current().nextInt(100) < 3) { // with 3% probability
    try {
      Thread.sleep(5000); // 5-second delay
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }
}
```

#### Step 2: set up a control and an experiment group

I made a test controller with two endpoints.
```java
@GetMapping("/old")
public String ... {
  // ➊ control
  // calls the existing logic as-is. the 3%-probability delay occurs.
}
@GetMapping("/new")
public String ... {
  // ➋ experiment
  // omits logging to measure the ideal upper bound of async logging.
}
```

After making the dev environment as close as possible to production, I put the same load on each endpoint with JMeter.

#### Step 3: analyze the results

I downloaded the transaction data from the APM as CSV and analyzed it.

The mean improved only slightly, but **P95/P99 were predicted to improve by around 80%**. This means the "most requests are fast, but some get severely slow" phenomenon is resolved.

*(based on 3,000 requests. detailed results are in the footnotes)*[^3]


### Verdict: ✅ adopt

An improvement of this order made it clearly worth implementing async logging.

---

# 4. Design and implementation

## 4.1. Design

The core strategy is to remove synchronized and split the logging work out of the API service.
```
before: Request → API Querying → Logging (DB Insert) → Response
after:  Request → API Querying → Cache offer         → Response
                                    ↓
                              Hazelcast Queue
                                    ↓
                    a separate Consumer (Batch) does the DB Insert
```
The cache used `Hazelcast`, which was already in use. It provides a distributed-queue feature.


## 4.2. Implementation

### Producer (Spring Boot)

The Aspect enqueues logs to the Hazelcast Queue rather than the DB.
```java
@Around
public Object ... {
  cacheOffer();
}
private void cacheOffer() {
  boolean offered = queue.offer(json);
  if (!offered) {
    logger.warn("the queue is full, or a timeout occurred.");
    fallback();
  }
}
```
When the queue is full or times out, it proceeds the old synchronous way.
```java
private void fallback() {
  try {
    insertLog();  // reuse the existing synchronous logging as-is
  } catch (Exception e) {
    logger.error("the fallback failed too.");
  }
}
```

<br>

### Consumer (Spring Batch)

I implemented a tasklet that gathers logs up to the batch size and processes them.
```java
@Override
public RepeatStatus execute(...) {
  List<String> batch = new ArrayList<>();

  while (batch.size() < BATCH_SIZE) {   // injected from the common framework
    String json = queue.poll();
    if (json == null) break;
    batch.add(json);
  }

  if (batch.isEmpty()) {
    return FINISHED;
  }

  for (String json : batch) {
    insertLog(json);  // use the existing logging as-is
  }

  return queue.isEmpty() ? FINISHED : CONTINUABLE;
}
```
Our system uses a separate batch management system, so the run interval, batch size, and so on are controllable by configuration.

*(detailed configuration and the sizing rationale are in the footnotes)*[^4]

## 4.3. Results

The results are the same as the summary.

---

# 5. Limitations

This analysis has the following constraints.

### 5.1. Tested on a limited sample

***In other APIs, in other periods, the latency may occur less or more.***

- Because the data analyzed for the latency is limited. The 3% delay probability was estimated as follows:

  - from a single API,
  - over 6 days of data,
  - sampling only the top transactions by delay time.

- The reason I only investigated a specific sample is that I had to analyze by clicking individual transactions to see the detail. The APM's (Jennifer5) detail search was limited.

### 5.2. Relying on a simplified test design

***A fixed delay of 5 seconds at 3% probability does not represent the real latency pattern of production.***

- The real cause of latency is a mix of DB lock contention, GC, network, and so on. The delay time is also distributed variously, from hundreds of ms to several seconds.

***A JMeter load does not represent the real load of production.***

- The JMeter experiment was done with thread 3, loop count 1000. Because the API had 3 concurrent users in the sampled time window.

- But real TPS varies. At lower or higher loads a different pattern could appear.

### 5.3. Limits of measuring the effect

***The improvement figures in production may differ.***

- Deploying to production requires the client's approval. But given the project schedule, deployment could not be done during January.

- So I measured the improvement figures in a dev environment made as similar as possible.

- In actual production, monitoring is needed for whether there is overhead from cache or batch stability (an insufficient queue size, failure recovery, message loss, and so on).

---

# 6. Looking back

### 6.1. Analyzing several improvement candidates

Looking for candidates to improve, I got to analyze the current system's problems from several angles.

| Candidate | Reason for rejection |
|------|----------|
| logging only page=1 → logging all pages | business value is high, but technical value is lacking |
| offset → keyset pagination | a well-defined problem, improvable any time |
| **synchronized logging → batch draining** | **✅ adopted**. The anti-pattern is clear, but whether it is a real bottleneck needs verification. |

The offset → keyset pagination was a strong candidate in particular, but I excluded it, judging the synchronized improvement would be more valuable.


### 6.2. Analyzing and interpreting the data

I do not know much about mathematics or statistics. But to show the improvement convincingly, I needed metrics and charts that could be interpreted intuitively.

Trying to analyze the transaction data directly with Excel and Python helped the analysis a lot. Setting the histogram's frequency bins and visualizing with scipy and matplotlib was especially useful.

At first I tried to compare the before and after with a KDE (a way to visualize a distribution as a smooth curve). Because you can compare the before and after distributions at a glance. But a KDE needs the whole raw dataset to draw. Since I could not take the full sample out of the air-gapped network, I used a percentile chart instead.

### 6.3. Minimizing deployment with a cache

Doing experiments often, I wanted to change experiment parameters without deploying. Using OpenShift's ConfigMap is the standard way, but that permission belongs to the client, so arbitrary edits were effectively impossible.

So I built a cache-based property directly, using Hazelcast.

- I used a distributed map so all pods could share the same setting value.
- I used a ConcurrentHashMap so the overhead of reading the setting value would not affect the test results.
- I configured it via a Hazelcast event listener so the local cache updates immediately whenever a value changes.

*(the implementation pseudocode is in the footnotes)*[^5]

Through this, I could experiment with various scenarios quickly and flexibly, without code changes or redeployment.


### 6.4. Configuring the cache environment for Spring Batch

Unlike the Spring Boot project, the Spring Batch project was not using a cache. The two projects were managed in different environments, so configuration was needed to use the cache.

Fortunately I could find a cache configuration in use in another team's project. I chose to build it up from a local environment with JUnit, verify a PoC first, and then apply it to the dev environment.

### 6.5. Choosing the right serialization

The Spring Boot (Producer) and Spring Batch (Consumer) are managed as separate projects. I implemented the DTO with Java Serializable, but ran into a classpath mismatch between the two projects.

Of course, using Hazelcast's own serialization could have solved it, but I went with JSON, which is simpler and also readable in a console.

Using ObjectMapper, the Producer (Boot) converts DTO → JSON, and the Consumer (Batch) converts JSON → DTO.


---

Thanks for reading this long one.

---

# References

[^1]: **Response time compared by percentile**

    The occasional slow responses are gone.

    <canvas id="percentileChart" style="max-height: 300px;"></canvas>

    **Histogram of the response-time distribution**

    Responses are more densely packed in the low-time range. That means the performance has become consistent.

    <canvas id="histogramChart" style="max-height: 300px;"></canvas>


[^2]: **A detailed analysis of the transaction-bunching phenomenon**

    In synchronous logging, the synchronized block processes several transactions bunched together. Below is an example of two requests arriving at the same pod at the same time.

    ```mermaid
    sequenceDiagram
        participant A as request A
        participant B as request B
        participant Q as ConcurrentQueue
        participant DB as DB

        Note over A,B: the two requests start almost simultaneously

        A->>A: API Querying
        B->>B: API Querying

        A->>Q: add log to the queue
        A->>Q: acquire lock
        activate Q

        B->>Q: add log to the queue
        B->>Q: wait on lock

        Note over Q,DB: request B waits until<br/>request A empties the queue

        Q->>DB: save A's log
        Q->>DB: save B's log

        Q-->>A: release lock & respond (slow)
        deactivate Q

        B->>Q: acquire lock → queue is empty → release immediately
        Q-->>B: respond (slow)

        Note over A,B: the two requests finish almost simultaneously<br/>(because A processed B's log too)
    ```
    - Request A's response is delayed by processing its own log plus B's log.
    - Request B's response is delayed by waiting in the synchronized block.
    - Another request's logging time is folded into the API response time.
    - In actual production, up to 5 requests were observed bunched together at once.

[^3]: **JMeter simulation results**

    A simulation run for the action plan. The rationale and limits of this experiment are [discussed below](#52-relying-on-a-simplified-test-design).

    Test settings: Number of Threads 3, Ramp-up period 0, loop count 1000

    | Metric | Control (sync, deliberate delay) | Experiment (async) | Improvement |
    |------|------------------------|--------------|--------|
    | mean response time | 586ms | 453ms | **22.7%** |
    | P95 | 3,123ms | 718ms | **77.0%** |
    | P99 | 5,296ms | 1,040ms | **80.4%** |
    | total elapsed | 10 min 01 sec | 7 min 36 sec | - |
    | delays occurred | 103 of 3,000 | 0 (no delay) | - |

    Each experiment was run after redeploying the pod fresh and warming it up by loading a web page several times per pod.

[^4]: **Hazelcast Queue configuration and capacity sizing**

    The Hazelcast Queue configuration used in the batch system is as follows.

    ```java
    QueueConfig queueConfig = new QueueConfig("logQueue");
    queueConfig.setMaxSize(100000);  // 100,000 max
    queueConfig.setBackupCount(1);   // 1 backup node
    ```

    The capacity and safety analysis:

    **Baseline capacity sizing (max-load scenario)**
    - Average JSON string size: about 500 bytes (assuming every field is at its maximum)
    - Max expected logs per day: 100,000 (assuming 50% of the observed max daily calls are API)
    - Expected memory per day: 100,000 × 500 = 50 MB

    **Backpressure safety (at peak time)**
    - Max TPS: 40 (observed max traffic)
    - Enqueued per minute: 2,400 (about 1.2 MB)
    - Conclusion: works even if the max load lasts about 41 minutes
    - **Critical throughput**: up to **1,666 TPS** can be absorbed, given a 1-minute-interval batch drain

[^5]: **The cache-based property implementation**

    It stores the test setting values in the cache and reflects changes via an event listener.
    ```java
    private final Map<String, Object> configMap = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
      configMap.put("test?", false);
      configMap.put("delayProbability", 3);
      configMap.put("delayMillis", 5000);

      map.addEntryListener(event -> {   // change at runtime
          configMap.put(event.getKey(), event.getValue());
      }, true);
    }
    ```

    Used for branching and for changing experiment parameters.
    ```java
    @Around
    public Object ... {
      if (test?) {
        // new async logging
      } else {
        // old sync logging
      }
    }

    @Around
    public Object ... {
      if (random.nextInt(100) < delayProbability) {
        Thread.sleep(delayMillis);
      }
    }
    ```
