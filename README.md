# Naver Stock Tracker (네이버 주식 트래커)

## 📖 개요 (Overview)

이 프로젝트는 네이버 금융 페이지에서 주식 데이터를 주기적으로 스크래핑하여, 사용자가 설정한 특정 조건에 맞는 종목을 찾아 Slack으로 알림을 보내주는 Node.js 스크립트입니다.

This project is a Node.js script that periodically scrapes stock data from Naver Finance, finds stocks that meet user-defined conditions, and sends notifications to a Slack channel.

---

## ✨ 주요 기능 (Features)

- **코스피 & 코스닥 데이터 수집**: 코스피와 코스닥 하락 종목 목록에서 데이터를 수집합니다.
- **사용자 정의 필터링**: 등락률, 거래량 배수 등 원하는 조건에 맞는 종목을 필터링합니다.
- **Slack 알림**: 필터링된 결과를 지정된 Slack 채널로 전송합니다.
- **스케줄링 실행**: 지정된 시간(현재 10분) 간격으로 스크립트를 자동 실행합니다.
- **거래 시간 제어**: 한국 시간 기준, 주식 시장이 열리는 평일 및 특정 시간에만 동작하도록 설정할 수 있습니다.
- **키워드 제외**: '스팩', 'ETN' 등 특정 키워드가 포함된 종목을 결과에서 제외할 수 있습니다.

---

## ⚙️ 사전 준비 (Prerequisites)

- [Node.js](https://nodejs.org/) (v14 이상 권장)
- [npm](https://www.npmjs.com/) (Node.js 설치 시 함께 설치됨)
- Slack Bot Token 및 Channel ID
  - [Slack API](https://api.slack.com/apps)에서 봇을 생성하고 필요한 권한(`chat:write`)을 부여해야 합니다.
  - 봇을 알림받을 채널에 미리 초대해야 합니다.

---

## 🚀 설치 및 설정 (Installation & Setup)

1.  **프로젝트 다운로드 또는 복제**

2.  **의존성 라이브러리 설치**
    프로젝트 폴더에서 아래 명령어를 실행하여 필요한 라이브러리를 설치합니다.
    ```bash
    npm install
    ```

3.  **.env 파일 생성 및 설정**
    프로젝트 최상위 경로에 `.env` 파일을 생성하고, 아래 내용을 복사하여 자신의 환경에 맞게 수정합니다.

    ```properties
    # Slack 봇 토큰 (xoxb- 로 시작)
    SLACK_TOKEN=xoxb-xxxx-your-bot-token-here

    # 메시지를 보낼 Slack 채널 ID
    SLACK_CHANNEL_ID=C0XXXXXXXXX

    # --- 필터링 조건 ---
    # 등락률 임계값 (예: -3.0% 이하)
    CHANGE_RATE_THRESHOLD=-3.0
    # 거래량 배수 (예: 전일 대비 2배 이상)
    VOLUME_MULTIPLIER=2
    # 결과에서 제외할 종목 키워드 (쉼표로 구분)
    EXCLUDE_KEYWORDS=스팩,ETN

    # --- 실행 시간 조건 (한국 시간 기준) ---
    # 작업 시작 시간 (시)
    START_HOUR=9
    # 작업 시작 시간 (분)
    START_MINUTE=0
    # 작업 종료 시간 (시)
    END_HOUR=15
    # 작업 종료 시간 (분)
    END_MINUTE=30
    # 허용 요일 (0:일, 1:월, 2:화, 3:수, 4:목, 5:금, 6:토)
    ALLOWED_DAYS=1,2,3,4,5
    ```

---

## 🏃 실행 방법 (How to Run)

아래 명령어를 터미널에 입력하여 스크립트를 실행합니다.

```bash
node index.js
```

스크립트가 시작되면 설정된 시간(10분)마다 자동으로 실행되며, 장 운영 시간이 아닐 경우 작업을 건너뜁니다.
프로그램을 종료하려면 `Ctrl + C`를 누르세요.

---

## 📦 주요 의존성 (Main Dependencies)

- `axios`: HTTP 요청을 보내기 위한 라이브러리
- `axios-cookiejar-support`: `axios`에서 쿠키를 관리하기 위한 라이브러리
- `cheerio`: 서버사이드에서 HTML을 파싱하고 조작하기 위한 라이브러리
- `@slack/web-api`: Slack API와 상호작용하기 위한 공식 라이브러리
- `dotenv`: `.env` 파일의 환경 변수를 로드하기 위한 라이브러리
- `iconv-lite`: EUC-KR 등 다양한 문자 인코딩을 변환하기 위한 라이브러리
- `tough-cookie`: 쿠키 관리를 위한 라이브러리