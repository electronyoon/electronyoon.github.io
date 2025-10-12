---
layout: post
title: "Hazelcast 환경에서 세션 탈취 방지 기능 구현"
category: tech
---

1. [들어가며](#1-들어가며)
2. [상황](#2-상황)
3. [문제와 검증](#3-문제와-검증)
4. [구현](#4-구현)
5. [Workarounds](#5-Workarounds)

---


# 1. 들어가며

Hazelcast를 활용하는 세션 기반 웹사이트에, 세션 탈취 공격을 방어하는 기능을 구현하게 되었습니다.

[Hazelcast](https://hazelcast.com/)는 자바 어플리케이션을 위한 인메모리 데이터 그리드입니다. 어플리케이션에 embedded 형태로 제공돼 환경 설정이 간편하고, 마이크로서비스 사이의 클러스터링을 자동으로 돕는다는 특징이 있습니다.

### 프로젝트 환경

- 프레임워크: Spring Boot 3.4.5
- 뷰 엔진: JSP
- 세션 스토리지: Hazelcast Enterprise 5.1.1
- 인프라: RedHat OpenShift
    - JVM 파드 2개
    - horizontal autoscaling 미적용
- 특이사항: Spring Session, Spring Security 미사용


---


# 2. 상황

### 요구사항

- 세션 탈취가 발생하면, 정상 사용자에게 알림이 제공되어야 한다.

- 공격자는 탈취한 세션으로 로그인이 필요한 페이지에 접근할 수 없어야 한다.

### 히스토리

- 이미 작성된 코드가 있었으며, 공격자의 세션을 빼앗는 과정에서 예기치 못한 문제가 발생한다고 인계받음

- dev-stage 환경에서는 잘 작동하나 prod 환경에서는 간헐적으로 작동하지 않는다고 인계받음

- 기존에 시도된 코드 #1
```java
if (최초 접속 정보와 다를 경우) {
	HttpSession.removeAttribute(userDto);
}
```

- 기존에 시도된 코드 #2
```java
if (최초 접속 정보와 다를 경우) {
	HttpSession.invalidate();
}
```


---


# 3. 문제와 검증

### 문제

1. Hazelcast에서 세션 어트리뷰트를 lazy update하고 있을 수 있음

2. dev/stage에는 pod가 1개지만, prod는 pod가 2개로 구성돼 기능이 다르게 작동할 수 있음

3. HttpSession의 `removeAttribute()`나 `invalidate()`는 모두 세션 ID를 기반으로 작동함. 세션ID만으로는 공격자와 정상 유저를 구분해 처리할 수 없음

### 검증

1. Hazelcast는 다양한 캐싱 전략을 제공하긴 하지만, 현재 프로젝트의 config는 단순하고 별도의 정책을 적용하고 있지 않음

2. 팀장님께서 기술지원팀에 요청하여 dev/stage와 prod의 pod 수가 같게 증설

3. 문제의 핵심 원인으로 파악됨


---


# 4. 구현

Aspect를 활용해 유저가 요청을 보낼 때마다 접속 정보를 계속 비교합니다.

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
➊ 접속 정보가 이전과 달라졌는지 비교합니다. `Context`라는 구현체를 활용합니다.

➋ 정상 사용자에게 공격을 알리기 위한 `flag값`입니다. true일 경우, JSP 페이지에서 alert()가 실행됩니다. 

➌~➍ 사용자와 공격자의 `유즈 케이스를 4가지로 정리`하고, Enum과 Switch로 나누어 처리합니다.


### 1. Context

```java
public class Context {
    private String userId;
    private String userAgent;
    private String ipAddress;

    public boolean isSameContext(Context other) {...}
}
```
이전 요청과 현재 요청의 접속 정보를 비교하려면, 먼저 접속 정보를 가지고 있어야 합니다.
- `Context` 구현체가 그 역할입니다. 개별 요청의 유저 id, User-Agent, IP 주소를 담습니다.


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
접속 정보를 가지고 있더라도, 유저별로 모아 저장해두지 않는다면 접속 정보들을 서로 비교할 수 없습니다.
- `ContextManager` 구현체가 그 역할입니다. ContextManager는 Context의 모음을 담고 있으며, 유저의 세션 어트리뷰트에 저장됩니다. 따라서 유저가 어떤 환경에서 접속했었는지 알 수 있습니다.
- `PrimaryContext`는 최초 접속 정보를 저장합니다. PrimaryContext와 현재 Context를 비교하면, 유저의 접속 정보가 달라졌는지 알아낼 수 있습니다.
- `securityAlertEnabled`는 보안 알림용 flag값을 저장합니다. 기본값은 false입니다.

### 3. SessionSecurityResult
```java
private enum SessionSecurityResult {
    IS_NORMAL_CONTEXT,              // 사용자의 요청
    IS_NORMAL_CONTEXT_ON_ALERT,     // 사용자의 요청, 마지막 요청에 공격 시도 있음
    IS_SUSPICIOUS_CONTEXT,          // 공격자의 요청
    IS_SUSPICIOUS_CONTEXT_ON_ALERT; // 공격자의 요청, 마지막 요청에 공격 시도 있음

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
다음 두 가지 경우의 수를 조합해 4가지 유즈케이스를 정의합니다:
- 이 요청이 사용자의 요청인지, 공격자의 요청인지
- 마지막 요청이 공격으로 의심되는지, 아닌지

### 4. invalidate 대신 쿠키 만료
```java
switch (result) {
    ...
    case IS_SUSPICIOUS_CONTEXT:
        response.addCookie(expiredCookie);
    case IS_SUSPICIOUS_CONTEXT_ON_ALERT:
        response.addCookie(expiredCookie);
}
```
공격자의 세션을 무효화시키기 위해, invalidate()가 아닌 쿠키 만료 방식을 사용합니다.


---


# 5. Workarounds

시도하며 겪었던 여러가지 임시 방편과 뒷이야기들입니다.


### 1. 개발은 하라는데 환경은...

- 우리 프로젝트는 여러 서비스를 동시에 운영중인데, 모든 서비스가 하나의 캐시를 이용하고 있었습니다. 모든 서비스에 영향을 끼칠 수 있었기에, 기술지원팀에 의해 보수적으로 관리되었습니다.

- 그래서 ***캐시에 접근할 방법이 없는 상태로 개발***해야 했습니다. 예를 들면 Hazelcast는 Management Center라는 웹 콘솔을 제공하는데, 기술 지원팀에서만 접근 가능해 매번 자리에 직접 찾아가 간접적으로 물어봐야만 했습니다. 

- ☑️ Hazelcast의 jar 파일에 command line 툴이 포함되어 있다는 사실을 알아냈습니다[^1]. 이 파일을 활용해 powershell로 개발 캐시에 직접 접근할 수 있었습니다.

- ☑️ 배포 이전과 이후에는 직접 기술 지원팀에 방문해 Management Center로 캐시의 사용 이력과 히스토리를 비교했습니다. 세션 관리에 지나치게 많은 대역폭이나 저장공간을 사용하는지 확인하려는 용도였는데, 워낙 자원이 많아 문제는 되지 않았습니다.


### 2. 배포가 귀찮아서 StringBuilder로 로그 찍기

- 사용자와 공격자의 요청이 같은 pod에서 발생했을 때와 다른 pod에서 발생했을 때를 각각 재현해야 했으므로,

- 로컬에서는 테스트가 어렵고 반드시 배포한 뒤 로그를 확인해야 하는 번거로움이 있었습니다.

- ☑️ 개발 단계에서만 사용하는 Stringbuilder 디버거를 만들어 브라우저에서 손쉽게 디버깅할 수 있게 했습니다.
```java
public Object common(...) {
    private StringBuilder debugLog;
    ...
    
    ModelAndView mav;
    mav.addObject("debugLog", debugLog.toString());
}
```

### 3. 반쪽짜리 무효화와 ContextManager

- 세션 탈취를 방지하려면, 공격자와 사용자의 세션을 모두 `HttpSession#invalidate()`로 무효화하고 사용자에게는 새 세션을 발급해 주는 것이 올바른 방법입니다.

- ☑️ 그러나 요구사항 이상으로 구현하지 말자는 팀 내 의견이 있어 공격자의 쿠키를 만료시키는 방식으로 종결지었습니다.

- 또, ContextManager는 PrimaryContext 이외의 Context들을 보관하도록 구현돼 있었습니다. 즉 요청별 선분 이력을 관리하는 것입니다. 중복 로그인을 방지하는 기능이 추가될 예정이었기 때문이었습니다.

- ☑️ 그러나 중복 로그인 방지 기능이 제외되면서, ContextManager는 PrimaryContext, 즉 최초의 요청 Context만 보관하는 방식으로 변경되었습니다.


### 4. Hazelcast의 생소함

- 사용자 풀이 적고 한국어 문서가 많지 않아 학습에 시간이 걸렸습니다. 더욱이 프로젝트에 포함된 의존성이 2016년에 배포된 버전이라서, 최신 API와는 차이가 있을 수 있다는 점을 감안해야 했습니다.

- 또, 통상적인 레거시 Tomcat의 세션 매니저와 어떤 차이점이 있는지도 짚고 넘어가야 했습니다. Tomcat은 단일 JVM을 상정하지만, Hazelcast는 클러스터링을 활용하므로 네트워크 통신이 필연적일 것이기 때문입니다.

- ☑️ 구 버전의 문서를 찾아[^2] 정독하는 시간을 가지고, 필요한 경우 NotebookLM등의 RAG 기반 AGI에 질의하는 형태로 공부했습니다. 덧붙여 Tomcat의 HttpSession 구현체인 `StandardSession`과[^3] Hazelcast의 `HazelcastHttpSession`을[^4] 비교해 분석하며 개발했습니다.

- ☑️ 낮은 추상화 수준의 Hazelcast API로 먼저 동작을 검증한 후, 표준 서블릿 API로 리팩토링하는 접근 방식을 취했습니다. 초기 구현에서는 Hazelcast의 `IMap`과 `SerializationService`를 직접 다루어 세션 데이터를 읽고 쓰는 방식으로 기능을 구현했습니다. 이를 통해 분산 세션 환경에서의 동작을 명확히 이해한 후, HttpSession 인터페이스를 활용하는 형태로 코드를 개선할 수 있었습니다.

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

읽어주셔서 감사합니다.


---

# References

[^1]: "How to run Hazelcast command line console," *StackOverFlow*, <https://stackoverflow.com/questions/55613539/how-to-run-hazelcast-command-line-console>

[^2]: "Hazelcast Documentation Version: 3.6.1," *Hazelcast Documentation*, <https://docs.hazelcast.org/docs/3.6.1/manual/html-single/index.html>

[^3]: "StandardSession.java," *Apache Tomcat*, <https://github.com/apache/tomcat/blob/main/java/org/apache/catalina/session/StandardSession.java>

[^4]: "HazelcastHttpSession.java," *Hazelcast Web Manager*, <https://github.com/hazelcast/hazelcast-wm/blob/master/src/main/java/com/hazelcast/web/HazelcastHttpSession.java>
