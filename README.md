# Naver Stock Tracker (네이버 주식 트래커)

## 📖 개요 (Overview)

이 프로젝트는 네이버 금융 페이지에서 주식 데이터를 주기적으로 스크래핑하여, 사용자가 설정한 특정 조건에 맞는 종목을 찾아 Slack으로 알림을 보내주는 Node.js 스크립트입니다.

This project is a Node.js script that periodically scrapes stock data from Naver Finance, finds stocks that meet user-defined conditions, and sends notifications to a Slack channel.

---

## ✨ 주요 기능 (Features)

- **코스피 & 코스닥 데이터 수집**: 코스피와 코스닥 하락 종목 목록에서 데이터를 수집합니다.
- **사용자 정의 필터링**: 등락률, 거래량 배수 등 원하는 조건에 맞는 종목을 필터링합니다.
- **Slack 알림**: 필터링된 결과를 지정된 Slack 채널로 전송합니다.
- **정교한 스케줄링**: Cron 표현식을 사용하여 "매 10분마다", "매시 정각에" 등 원하는 시간에 정확히 실행되도록 설정할 수 있습니다.
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
    프로젝트의 `.env.example` 파일을 복사하여 `.env` 파일을 생성하고, 자신의 환경에 맞게 값을 수정합니다.

    ```bash
    cp .env.example .env
    ```
    
    `.env` 파일은 개인의 민감한 정보를 담고 있으므로 Git 저장소에 포함되지 않습니다. 로컬 환경에서만 사용하세요.
    
    #### Cron 표현식 예시 (`RUN_CRON_SCHEDULE`)
    
    - `*/10 * * * *`: 매 10분마다 실행 (예: 9:00, 9:10, 9:20...)
    - `0 * * * *`: 매시 정각마다 실행 (예: 9:00, 10:00, 11:00...)
    - `*/30 9-15 * * 1-5`: 월요일부터 금요일까지, 9시부터 15시까지 30분 간격으로 실행

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