---
layout: post
title: "Claude Code Preview 후기"
category: reviews
---

1. [소개](#1-소개)
2. [신청과 설치](#2-신청과-설치)
3. [init과 cost 명령어](#3-init과-cost-명령어)
4. [간단한 비교](#4-간단한-비교)
5. [후기](#5-후기)

---

# 1. 소개

<div class="video-container">
  <iframe src="https://youtube.com/embed/AJpK3YTTKZ4" allowfullscreen></iframe>
</div>

- 클로드 [Sonnet 3.7](https://www.anthropic.com/news/claude-3-7-sonnet)이 업데이트 되었습니다.
- 동시에 Claude Code라는 CLI 기반 코딩 에이전트가 추가됐어요.

---


# 2. 신청과 설치

<img src="{{ site.baseurl }}/assets/attachments/2025-02-26/Figure 1.png" style="width: 100%; height: auto;">

2025.02.26 현재 기준 Preview 상태여서, 이메일로 신청 후 승인이 필요합니다.
- 신청 링크: <https://console.anthropic.com/code/welcome>
- 설치는 Claude Code [공식 문서](https://docs.anthropic.com/ko/docs/agents-and-tools/claude-code/overview)를 참고하세요.
- 저는 승인까지 *13시간* 정도 소요됐어요.

---

# 3. init과 cost 명령어

<img src="{{ site.baseurl }}/assets/attachments/2025-02-26/Figure 2.png" style="width: 100%; height: auto;">

공식 문서에 따라 Claude Code를 설치하면, 프로젝트의 디렉토리를 설정할 수 있는데요.

### 3-1. /init
- 처음 Claude Code를 시작할 때 추천되는 부트스트랩 명령어입니다.
- 이 명령어는 프로젝트를 색인하고 CLAUDE.md 파일을 생성합니다.
- 이 md 파일은 일종의 메모리처럼 작동합니다. 기존의 instruction이나 knowledge와 비슷하네요.
- 자주 사용하는 명령어, 코드 스타일, 명명 규칙, 아키텍처 패턴 등을 저장할 수 있다고 합니다.

### 3-2. /cost
- Claude Code는 API를 사용합니다. 이 명령어로 API 사용량을 확인할 수 있어요.
- 저는 3.3MB의 138개 파일이 포함된 제 프로젝트에 시험삼아 적용했는데,
- init에만 0.3148달러(약 451.57원)정도 사용합니다.
```
> /cost 
⎿  Total cost: $0.3148
    Total duration (API): 1m 16.0s
    Total duration (wall): 9m 2.1s
```

---

# 4. 간단한 비교

기존에 제공되던 데스크탑 애플리케이션과 Claude Code를 비교해 봤습니다. 똑같은 프로젝트에서 프롬프트를 던져 봤어요.

<img src="{{ site.baseurl }}/assets/attachments/2025-02-26/Figure 3.png" style="width: 100%; height: auto;">

<img src="{{ site.baseurl }}/assets/attachments/2025-02-26/Figure 4.png" style="width: 100%; height: auto;">

#### 코드 스니펫
- 데스크탑 애플리케이션: package, import문 등 전체 코드를 제공할 때가 많지만,
- Claude Code: 필요한 코드만 제공하고, diff로 색칠해 보여줍니다.

#### 파일 시스템
- 데스크탑 애플리케이션: 별도의 MCP 설정이 필요하고, 파일 시스템 색인이 느리지만
- Claude Code: 프로젝트 색인도 빠르고, bash 명령어로 디렉토리를 지정할 수도 있습니다.

#### 맥락 제공
- 데스크탑 애플리케이션: 전체 맥락에서 코드 스니펫을 제공하지만,
- Claude Code: 현재 수정 내역을 승인해야만 다음 수정 내역을 보여줍니다.

#### 요약 제공
- 데스크탑 애플리케이션: 수정사항의 요약본을 제공하지만,

> 개선된 코드는 다음과 같은 장점이 있습니다:
> 1. 간결한 메소드명
> 2. "Source" 중복 제거
> 3. 책임 분리를 위한 작은 헬퍼 메소드
> 4. 명확한 예외 처리
> 5. 하드코딩된 값을 상수로 추출
> 6. 주석처리된 코드 활성화

- Claude Code: 수정사항의 명세를 제공합니다.

> ⏺ 인터페이스 메소드를 더 간결하게 변경했고, 관련 구현과 호출 코드도 모두 수정했습니다. 개선 사항은 다음과 같습니다:
> 1. ScoreSourceCollector 인터페이스:
> - createOrUpdateTable() → create()
> - collectAndSaveData() → collect()
> - isDataValid() → validate()
> 2. ParkSourceCollector 구현체:
> - 인터페이스 변경에 맞춰 메소드 이름 변경
> - 메소드 순서를 인터페이스와 동일하게 정렬
> - 누락된 @Override 애노테이션 추가
> 3. 호출하는 클래스도 업데이트:
> - ScoreSourceProcessor에서 메소드 호출 변경
> - ScoreSourceWriter에서 메소드 호출 변경
> 메소드명이 더 간결해져서 코드의 가독성이 향상되었습니다.

#### 돈!
- 이 프롬프트 하나에 0.3152달러(약 452.18원)정도 사용했습니다.
- 다음은 init이 포함된, 총 사용 금액이에요.
```
> /cost 
⎿  Total cost: $0.63
    Total duration (API): 2m 24.6s
    Total duration (wall): 23m 10.7s
```

---

# 5. 후기

### 원래는..

Claude 프로젝트에서 knowledge에 코드 파일들을 때려박고 질의하는 식으로 일하곤 했는데요.
- MCP를 쓰면 사용량 제한에 너무 빨리 도달하고,
- 파일 색인 하나 하나에 쿼리를 던져 시간이 은근히 소요되거든요.

Ollama로 deepseek나 codestral같은 모델을 다운받는 건 피곤합니다.
- 낮은 해상도의 로컬 모델은 무언가 손이 더 가요.
- 이해를 잘 못하거나, 퀄리티가 떨어져서 질문을 잘 정제해 물어봐야 해요.

Cursor, Continue같은 서드 파티 툴에 API key를 관리하는 것도 피곤하죠.
- 무슨 AI 툴이든 파운데이션 모델 API에 의존적인 건 마찬가지고,
- 무엇보다 intellij에 들어오면 안 예쁩니다.

### MCP 파일 시스템을 사용하던 유저라도

갈아탈 동기가 충분합니다. 훨씬 빠르거든요!
- 참고로 [MCP](https://docs.anthropic.com/ko/docs/agents-and-tools/mcp)는 Anthrophic에서 만든 프로토콜입니다.
- 그 중에는 로컬 파일 시스템을 참조해 LLM에 넘겨주는 [Filesystem MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)도 있죠.

### 바라는 점이 있다면..

어떻게 수정할지 명세가 먼저 제공됐으면 하는 바람이 있어요.
- 전체 수정 흐름을 먼저 보여주지 않으니, 승인을 망설이게 만듭니다.
- 수정 명세를 먼저 제공하고, 하나씩 승인하도록 바뀌면 좋지 않을까요?
- 프롬프트를 잘 입력하면 가능할 것 같기도 합니다.

--- 

제가 클로드를 사랑하는 이유는 "개떡같이 물어봐도 찰떡같이 알아듣는다"는 믿음이 있어서인 것 같아요. 여러 파운데이션 모델을 사용해 봤지만, 자연어 해석이 가장 자연스럽습니다.

이런 클로드에서 낸 코드 어시스턴트니, 역시 사랑하지 않을 이유가 없네요.

크레딧을 더 구매하러 가야겠어요...

읽어주셔서 감사합니다!