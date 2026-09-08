---
layout: post
title: "Moving Logging Off the Request Path (Final)"
category: tech
series: 속도개선
lang: en
ref: async-logging-final
last_modified_at: 2026-06-22
---

1. [What I fixed](#1-what-i-fixed)
2. [Why a queue, not a thread](#2-why-a-queue-not-a-thread)
3. [The synchronized latency is effectively gone](#3-the-synchronized-latency-is-effectively-gone)
4. [Predicted 94%, actual 48%](#4-predicted-94-actual-48)
5. [The slowest API's traffic nearly tripled and it still got faster](#5-the-slowest-apis-traffic-nearly-tripled-and-it-still-got-faster)
6. [Limits of the measurement](#6-limits-of-the-measurement)
7. [Looking back](#7-looking-back)

---

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="/assets/attachments/2026-05-06/charts.js" type="module"></script>


<span style="color:gray">This follows two earlier posts on the same problem: [the diagnosis](/how-neglected-code-slowed-an-api.html), and an interim deployment report. It is written so you can follow along without them.</span>

### I fixed API requests bunching up and stalling, by moving logging off the request path.

- The 500ms-plus latency in the synchronized contention window is nearly gone. **(1.83% → 0.006%)**
- I expected P95 to improve 94%, but it came to 48%. **(1,079 → 562ms)**
- Exclude one particular API and the improvement rises further. **(P95 improves 69%, P99 improves 87%)**

<canvas id="chart-pct-all-combo"></canvas>

<p align="center"><span style="color:gray"><i>(The ~P20 range has small absolute values, 7 to 20ms, so the cost of enqueuing offsets the improvement.)</i></span></p>

---

# 1. What I fixed

API requests were lining up on a single lock.

```java
// before: every request competes on the same lock
synchronized(q) {
  while (!q.isEmpty()) {
    dao.insertLog(q.poll());  // actually 9 queries
  }
}
```
I improved this with an in-memory database called Hazelcast.

```java
// after: enqueue and return immediately. a batch handles the write
hazelcastQueue.offer(dto);
```

The more concurrently requests arrive, or the slower the requests themselves are, the more requests bunch together, and so the much slower they get. The mechanism is in [the second footnote of the earlier post](/how-neglected-code-slowed-an-api.html#fn:2).

---

# 2. Why a queue, not a thread

Three reasons.

1. `insertLog` is 9 queries. Too heavy to keep inside the response transaction.

2. Spring Batch was already there. It can shoulder the write load.

3. Failure is more explicit. A thread is gone if the JVM or pod dies. An in-memory database has backup replicas, and can leave an exception when it fills up.

The design and implementation details are in ["Design and implementation" in the earlier post](/how-neglected-code-slowed-an-api.html#4-design-and-implementation).

---

# 3. The synchronized latency is effectively gone

I compared 1.74M transactions in the 30 days before deployment (3.1 to 3.30) against 1.92M in the 29 days after (4.1 to 4.30).

The 500ms-plus rate dropped from 1.83% to 0.006%. The synchronized latency is effectively gone.

| Metric | Before | After |  |
|:---:|:---:|:---:|:---:|
| 500ms-plus rate | 1.83% | 0.006% | **▼99.7%** |

That said, this is an indirect metric. That is, it does not identify every synchronized delay. It also excludes one particular API. Why it is an ***"estimate"*** in this way is discussed in [#6](#6-limits-of-the-measurement).

---

# 4. Predicted 94%, actual 48%

In the earlier post I set up a small experiment and predicted a P95 improvement of 94%.
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

The actual improvement after deployment was 48%. There are two reasons.

### Reason 1. The experiment did not model reality closely

The experiment heuristically assumed "a fixed 5-second delay with 3% probability." Reality was not like that.

Production latency was not a fixed 5 seconds but spread widely, from hundreds of ms to several seconds. A model that assumes a single value of 5 seconds overestimates the improvement over this distribution.

The experiment design is in ["Experiment design" in the earlier post](/how-neglected-code-slowed-an-api.html#experiment-design).

### Reason 2. The overall statistics were heavily influenced by one API

As analyzed before, the API had two causes of degradation.

| API / cause | due to synchronized | due to the pagination query |
|:---:|:---:|:---:|
| per-detailed-program expenditure API | ✅ | ✅ |
| every other API | ✅ | ❌ |

This deployment removed only the synchronized latency. The pagination-query latency stays. This API's (per-detailed-program expenditure) slow response degrades the overall P95.

So I took that API out and looked again.

<canvas id="chart-pct-excl-combo"></canvas>

| Metric | all APIs |  | every other API |  |
|:---:|:---:|:---:|:---:|:---:|
| mean | 167.9 → 122.2ms | ▼27% | 76.6 → 27.5ms | **▼64%** |
| median | 56 → 34ms | ▼39% | 41 → 23ms | ▼44% |
| P95 | 1,079 → 562ms | ▼48% | 170 → 53ms | ▼69% |
| P99 | 2,322 → 1,936ms | ▼17% | 997 → 134ms | **▼87%** |

Take this API out and P95 recovers to 69%, P99 to 87%.

---

# 5. The slowest API's traffic nearly tripled and it still got faster

You might wonder: "Isn't it just that the other APIs are barely used, so one API dominates the overall statistics?"

That is not it. The other APIs are called plenty too.

| Endpoint | March calls | April calls |
|:---:|:---:|:---:|
| WCEGCF | 922,383 | 435,147 |
| HCFDA | 398,629 | 424,408 |
| <span style="color:maroon">QWGJK (per-detailed-program expenditure)</span> | <span style="color:maroon">330,917</span> | <span style="color:maroon">910,213</span> |
| others | 90,420 | 154,473 |
| **total** | **1,742,349** | **1,924,241** |

In fact this slowest API's call volume grew about 2.75x after deployment. And it still improved.

<canvas id="chart-pct-qwgjk-combo"></canvas>

| Metric | all APIs |  | every other API |  | per-detailed-program expenditure API |  |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| mean | 167.9 → 122.2ms | ▼27% | 76.6 → 27.5ms | ▼64% | 557.4 → 227.6ms | ▼59% |
| median | 56 → 34ms | ▼39% | 41 → 23ms | ▼44% | 173 → 70ms | ▼60% |
| P95 | 1,079 → 562ms | ▼48% | 170 → 53ms | ▼69% | 2,317 → 1,647ms | ▼29% |
| P99 | 2,322 → 1,936ms | ▼17% | 997 → 134ms | ▼87% | 2,672 → 2,082ms | ▼22% |

The mean and median clearly improved. Only P95 and above improved just slightly, because of the query.

---

# 6. Limits of the measurement

### A full census of synchronized delays is hard

The ideal way to verify would be to find every synchronized-delay transaction and compare the counts. But that was not possible. Three reasons.

1. The APM (Jennifer5) cannot bulk-query the per-transaction query records.
2. Even downloaded as CSV, the query-execution information is missing.
3. Direct JDBC access was not permitted by the tech support team.

Fortunately, every other API's response time is mostly around 300ms. If any other API exceeds 500ms, it is a synchronized delay with very high probability.

What I need is "did the synchronized delay meaningfully disappear." I do not need to know "the total count of synchronized delays." So I ended up comparing the count of 500ms-plus responses in the other APIs.

And fortunately 1.83% → 0.006% was a strong figure, so I adopted it as the core metric for verification.

### The data is not clean

On 4/3, a system problem caused logs to be missing from the APM. On 4/17 there was a one-minute outage, and one API produced 16 responses in the 20,000 to 50,000ms range. I checked these by hand and cut them out.

### It is not a controlled experiment

This verification simply observed and compared before and after deployment. There were other deployments within the measurement window, so it cannot be considered strictly the same environment. And, as the table above shows, the total call volume per API differs.

---

# 7. Looking back

- I fretted that logging would be lost for some reason. The batch's minimum run interval was 10 minutes. So I logged the consuming stage separately. Over about 34 days, 0 failures out of 1.185M processed, and 0 unemptied-queue (drain failure) events across all 3,300-plus scheduled runs. The peak backlog stayed at 20.4% of the queue capacity (100,000), so even at the busiest moment about 80% of the buffer was free. A single run took 4.3 seconds on average, about 3.6 minutes at worst.

- Identifying a defect that only shows up when you click through transactions one by one, then forming and testing a hypothesis to weed it out, was fun.

- Despite the APM's thin feature set, computing statistics and checking data with CSV and Python was fun too.

- Thinking through fallback handling, calculating backpressure, and generally reasoning about data loss left a good lesson.

- The per-detailed-program expenditure API's pagination-query problem is a follow-up. This API's P95 is still 1,647ms. I want to rebuild the index, or change the pagination to a keyset approach.

---

Thanks for reading this long one.
