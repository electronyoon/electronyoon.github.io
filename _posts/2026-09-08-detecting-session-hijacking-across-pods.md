---
layout: post
title: "Detecting Session Hijacking across Pods"
category: work
lang: en
ref: session-hijack-prevention
---

1. [Introduction](#1-introduction)
2. [The situation](#2-the-situation)
3. [The problem and how I verified it](#3-the-problem-and-how-i-verified-it)
4. [Implementation](#4-implementation)
5. [Workarounds](#5-workarounds)

---


# 1. Introduction

I was asked to build session-hijacking protection into a session-based website that runs on Hazelcast.

[Hazelcast](https://hazelcast.com/) is an in-memory data grid for Java applications. It ships embedded in the application, so configuration is easy, and it clusters microservices together automatically.

### Project environment

- Framework: Spring Boot 3.4.5
- View engine: JSP
- Session storage: Hazelcast Enterprise 5.1.1
- Infrastructure: RedHat OpenShift
    - 2 JVM pods
    - no horizontal autoscaling
- Notable: no Spring Session, no Spring Security


---


# 2. The situation

### Requirements

- When a session is hijacked, the legitimate user must be notified.

- The attacker must not be able to reach any page that requires a login with the stolen session.

### History

- Code already existed, and I was told it hit an unexpected problem while trying to take the session away from the attacker.

- I was told it worked fine in dev and stage but failed intermittently in production.

- Earlier attempt #1
```java
if (context differs from the first seen) {
	HttpSession.removeAttribute(userDto);
}
```

- Earlier attempt #2
```java
if (context differs from the first seen) {
	HttpSession.invalidate();
}
```


---


# 3. The problem and how I verified it

### The problem

1. Hazelcast might be updating session attributes lazily.

2. dev and stage run 1 pod, but production runs 2, so the feature could behave differently.

3. `removeAttribute()` and `invalidate()` on `HttpSession` both work off the session ID. The session ID alone cannot tell the attacker apart from the legitimate user.

### Verification

1. Hazelcast offers various caching strategies, but this project's config is plain and applies no special policy.

2. The team lead asked tech support to scale dev and stage up so their pod count matched production.

3. This turned out to be the core cause.


---


# 4. Implementation

Using an Aspect, I compare the connection context on every request the user makes.

```java
@Around
public Object common() {
    ➊ boolean isSameContext = newContext.isSameContext(oldContext);
    ➋ boolean isAlertEnabled;

    ➌ SessionSecurityResult result =
        SessionSecurityResult.from(
            isSameContext,
            isAlertEnabled
        );

    ➍ switch (result) {
        case IS_NORMAL_CONTEXT:
        case IS_NORMAL_CONTEXT_ON_ALERT:
        case IS_SUSPICIOUS_CONTEXT:
        case IS_SUSPICIOUS_CONTEXT_ON_ALERT:
    }
}
```
➊ Compare whether the connection context has changed since last time. A class called `Context` does the work.

➋ A flag for warning the legitimate user about an attack. When true, the JSP page runs `alert()`.

➌–➍ I sorted the user's and the attacker's situations into four use cases, and handle them with an enum and a switch.


### 1. Context

```java
public class Context {
    private String userId;
    private String userAgent;
    private String ipAddress;

    public boolean isSameContext(Context other) {...}
}
```
To compare the previous request's context with the current one, you first have to hold onto the context.
- The `Context` class does that. It carries a single request's user id, User-Agent, and IP address.


### 2. ContextManager

```java
public class ContextManager {
    private Map<String, Context> contexts;
    private String primaryContextId;
    private boolean securityAlertEnabled;

    public Context getPrimaryContext() {...}
    public Context addContext() {...}
    private String generateContextId() {...}
}
```
Holding a context is not enough; if you don't collect them per user, you can't compare them against each other.
- The `ContextManager` does that. It holds a collection of `Context` objects and lives in the user's session attributes, so it knows which environments the user has connected from.
- `PrimaryContext` stores the first-seen context. Compare the current `Context` against it and you know whether the user's context has changed.
- `securityAlertEnabled` stores the security-alert flag. It defaults to false.

### 3. SessionSecurityResult
```java
private enum SessionSecurityResult {
    IS_NORMAL_CONTEXT,              // the user's request
    IS_NORMAL_CONTEXT_ON_ALERT,     // the user's request, attack attempted on the last request
    IS_SUSPICIOUS_CONTEXT,          // the attacker's request
    IS_SUSPICIOUS_CONTEXT_ON_ALERT; // the attacker's request, attack attempted on the last request

    public static SessionSecurityResult from(
        boolean isSameContext,
        boolean isAlertEnabled
    ) {
        if (isSameContext && isAlertEnabled) {
            return IS_NORMAL_CONTEXT_ON_ALERT;
        } else if (isSameContext && !isAlertEnabled) {
            return IS_NORMAL_CONTEXT;
        } else if (!isSameContext && isAlertEnabled) {
            return IS_SUSPICIOUS_CONTEXT_ON_ALERT;
        } else {
            return IS_SUSPICIOUS_CONTEXT;
        }
    }
}
```
I combine two yes/no questions into four use cases:
- Is this request from the user, or the attacker?
- Was the last request suspected of being an attack, or not?

### 4. Expiring the cookie instead of invalidate

```java
switch (result) {
    ...
    case IS_SUSPICIOUS_CONTEXT:
        response.addCookie(expiredCookie);
    case IS_SUSPICIOUS_CONTEXT_ON_ALERT:
        response.addCookie(expiredCookie);
}
```
To neutralize the attacker's session, I expire the cookie rather than calling `invalidate()`.


---


# 5. Workarounds

The stopgaps I went through along the way, and some stories behind them.


### 1. They want the feature, but the environment...

- Our project runs several services at once, and all of them shared a single cache. Anything I did could affect every service, so tech support managed it conservatively.

- So I had to develop ***with no way to reach the cache***. Hazelcast has a web console called Management Center, for instance, but only tech support could open it — I had to walk over to their desk and ask them to check things for me.

- ☑️ I found that Hazelcast's jar includes a command-line console[^1]. Using it, I could reach the dev cache directly from PowerShell.

- ☑️ Before and after each deployment, I went to tech support in person and compared the cache's usage history in Management Center — I wanted to check whether session management was eating too much bandwidth or storage. There was so much headroom that it never became an issue.


### 2. Too lazy to deploy, so logging with a StringBuilder

- I had to reproduce the case where the user's and the attacker's requests land on the same pod, and the case where they land on different pods.

- That was hard to test locally; I had to deploy and then read the logs.

- ☑️ I built a StringBuilder debugger, used only during development, so I could debug straight from the browser.
```java
public Object common(...) {
    private StringBuilder debugLog;
    ...

    ModelAndView mav;
    mav.addObject("debugLog", debugLog.toString());
}
```

### 3. Half a fix, and the ContextManager

- To really prevent session hijacking, the right move is to invalidate both the attacker's and the user's sessions with `HttpSession#invalidate()` and issue the user a fresh one.

- ☑️ But there was a view on the team that we shouldn't build beyond the requirement, so we settled on expiring the attacker's cookie.

- Also, the `ContextManager` was written to keep every `Context` besides the `PrimaryContext` — that is, a valid-time history per request. That was because a duplicate-login-prevention feature was planned.

- ☑️ When the duplicate-login feature was dropped, the `ContextManager` changed to keep only the `PrimaryContext` — the very first request's context.


### 4. Hazelcast is unfamiliar territory

- The user base is small and there isn't much Korean documentation, so it took time to learn. On top of that, the dependency pinned in the project was released in 2016, so I had to account for it differing from the current API.

- I also had to work out how it differs from an ordinary legacy Tomcat session manager. Tomcat assumes a single JVM; Hazelcast uses clustering, so network communication is unavoidable.

- ☑️ I tracked down the old version's docs[^2] and read them closely, and when I needed to, I asked a RAG-based tool like NotebookLM. I also worked while comparing Tomcat's `HttpSession` implementation, `StandardSession`[^3], against Hazelcast's `HazelcastHttpSession`[^4].

- ☑️ I took the approach of verifying behavior first with the low-level Hazelcast API, then refactoring to the standard servlet API. The initial implementation read and wrote session data by handling Hazelcast's `IMap` and `SerializationService` directly. Once that made the behavior in a distributed session environment clear, I could rework the code to use the `HttpSession` interface.

```java
public <T extends Serializable> T getSessionAttribute(String attributeName) {
    ...
    Data serialized = sessionData.getAttributes().get(attributeName);
    SerializationService service = ((HazelcastClientProxy) hazelcastInstance).getSerializationService();
    return (T) service.toObject(serialized);
}

public <T extends Serializable> void setSessionAttribute(String attributeName, T deserialized) {
    ...
    IMap<String, SessionState> sessionMap = hazelcastInstance.getMap(mapName);
    sessionMap.put(sessionId, sessionData);
}
```


<br><br><br>

Thanks for reading.


---

# References

[^1]: "How to run Hazelcast command line console," *StackOverflow*, <https://stackoverflow.com/questions/55613539/how-to-run-hazelcast-command-line-console>

[^2]: "Hazelcast Documentation Version: 3.6.1," *Hazelcast Documentation*, <https://docs.hazelcast.org/docs/3.6.1/manual/html-single/index.html>

[^3]: "StandardSession.java," *Apache Tomcat*, <https://github.com/apache/tomcat/blob/main/java/org/apache/catalina/session/StandardSession.java>

[^4]: "HazelcastHttpSession.java," *Hazelcast Web Manager*, <https://github.com/hazelcast/hazelcast-wm/blob/master/src/main/java/com/hazelcast/web/HazelcastHttpSession.java>
