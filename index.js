const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const fs = require('fs');
const { wrapper } = require('axios-cookiejar-support');
require('dotenv').config(); // .env 파일의 환경 변수를 로드합니다.
const { WebClient } = require('@slack/web-api');
const { CookieJar } = require('tough-cookie');
const cron = require('node-cron');

// 쿠키를 저장하고 관리하기 위한 CookieJar 인스턴스 생성
const jar = new CookieJar();
// axios가 쿠키를 사용할 수 있도록 wrapper로 감싸줍니다.
const client = wrapper(axios.create({ jar }));

async function sendToSlack(stocks, marketName) {
  const token = process.env.SLACK_TOKEN;
  const channelId = process.env.SLACK_CHANNEL_ID;

  if (!token || !channelId) {
    console.log('SLACK_TOKEN 또는 SLACK_CHANNEL_ID가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    return;
  }

  if (stocks.length === 0) {
    console.log('슬랙으로 보낼 종목이 없습니다.');
    return;
  }

  const slackClient = new WebClient(token);

  // 슬랙 메시지 포맷 생성
  const stockMessages = stocks.map(stock => (
    `*<${stock.url}|${stock.name}>* \n` +
    `> 가격: ${stock.price.toLocaleString()}원, 등락률: ${stock.changeRate}%, 거래량: ${stock.todayVolume.toLocaleString()} (전일: ${stock.yesterdayVolume.toLocaleString()})`
  )).join('\n\n');

  const messageText = `📈 ${marketName} 조건 만족 주식 알림 (${stocks.length}건)`;
  const messageBlocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${messageText}*\n\n${stockMessages}`,
      }
    }
  ];

  await slackClient.chat.postMessage({
    channel: channelId,
    text: messageText, // 푸시 알림 등에 사용될 fallback 텍스트
    blocks: messageBlocks
  });
}

async function getStockData(market) {
  const fallUrl = `https://finance.naver.com/sise/sise_fall.naver?sosok=${market.sosok}`;
  const fieldSubmitUrl = `https://finance.naver.com/sise/field_submit.naver?menu=down&returnUrl=http%3A%2F%2Ffinance.naver.com%2Fsise%2Fsise_fall.naver%3Fsosok%3D${market.sosok}&fieldIds=quant&fieldIds=prev_quant`;

  try {
    console.log(`\n--- [${market.name}] 시장 데이터 수집 중 ---`);

    // 1. 먼저 '전일거래량' 항목을 포함하도록 요청하여 쿠키를 설정합니다.
    await client.get(fieldSubmitUrl);

    // 2. 위에서 받은 쿠키를 가지고 실제 데이터 페이지를 요청합니다.
    const { data } = await client.get(fallUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'referer': 'https://finance.naver.com/sise/sise_group.naver?type=upjong'
       },
      responseType: 'arraybuffer', // EUC-KR을 올바르게 처리하기 위해 buffer로 받습니다.
    });

    // EUC-KR로 인코딩된 데이터를 UTF-8로 디코딩합니다.
    const decodedData = iconv.decode(data, 'EUC-KR');

    fs.writeFileSync('output.html', decodedData);
    // console.log('수신된 HTML 데이터를 output.html 파일에 저장했습니다. 파일을 확인해주세요.');

    const $ = cheerio.load(decodedData);
    
    const stocks = [];

    // 컬럼 인덱스를 동적으로 찾기
    const headers = [];
    $('table.type_2 tr:first-child th').each((i, elem) => {
      headers.push($(elem).text().trim());
    });

    const colIdx = {
      stockName: headers.indexOf('종목명'),
      currentPrice: headers.indexOf('현재가'),
      changeRate: headers.indexOf('등락률'),
      todayVolume: headers.indexOf('거래량'),
      yesterdayVolume: headers.indexOf('전일거래량') // 사용자가 '전일거래량'을 추가했을 경우
    };

    // 개발자 도구로 확인한 주식 정보 테이블의 CSS 선택자를 사용합니다.
    // 실제 HTML 구조에는 tbody가 없으므로 제거합니다.
    // 또한, 의미 없는 빈 tr 태그나 헤더를 제외하기 위해 class="no"가 있는 tr만 선택합니다.
    $('table.type_2 tr').each((i, elem) => {
      // 첫 번째 td에 class="no"가 있는지 확인하여 데이터 행만 필터링합니다.
      if ($(elem).find('td.no').length === 0) return;
      
      // 각 행(tr)에서 필요한 데이터(td)를 추출합니다.
      const stockLinkElement = $(elem).find(`td:nth-child(${colIdx.stockName + 1}) a`);
      const stockName = stockLinkElement.text().trim();
      const stockUrl = 'https://finance.naver.com' + stockLinkElement.attr('href');
      const currentPrice = parseFloat($(elem).find(`td:nth-child(${colIdx.currentPrice + 1})`).text().replace(/,/g, ''));
      const changeRate = parseFloat($(elem).find(`td:nth-child(${colIdx.changeRate + 1}) span`).text().trim().replace('%', ''));
      const todayVolume = parseInt($(elem).find(`td:nth-child(${colIdx.todayVolume + 1})`).text().replace(/,/g, ''), 10);
      const yesterdayVolume = colIdx.yesterdayVolume > -1 ? parseInt($(elem).find(`td:nth-child(${colIdx.yesterdayVolume + 1})`).text().replace(/,/g, ''), 10) : 0;

      // 데이터가 유효한 경우에만 객체로 만들어 배열에 추가합니다.
      if (stockName && stockUrl) {
        stocks.push({
          name: stockName,
          url: stockUrl,
          price: currentPrice,
          changeRate: changeRate,
          yesterdayVolume: yesterdayVolume,
          todayVolume: todayVolume
        });
      }
    });

    // 1. .env 파일에서 제외 키워드를 가져와 필터링합니다.
    const excludeKeywordsStr = process.env.EXCLUDE_KEYWORDS || '스팩,ETN';
    const excludeKeywords = excludeKeywordsStr.split(',').map(k => k.trim());
    const stocksWithoutExcludes = stocks.filter(stock => 
      !excludeKeywords.some(keyword => stock.name.includes(keyword))
    );

    // 2. .env 파일에서 재무 조건을 가져와 필터링합니다.
    // .env 파일에서 필터링 조건을 가져옵니다. 없으면 기본값을 사용합니다.
    const changeRateThreshold = parseFloat(process.env.CHANGE_RATE_THRESHOLD) || -3.0;
    const volumeMultiplier = parseInt(process.env.VOLUME_MULTIPLIER, 10) || 2;

    const filteredStocks = stocksWithoutExcludes.filter(stock => {
      return stock.changeRate <= changeRateThreshold && stock.todayVolume >= stock.yesterdayVolume * volumeMultiplier;
    });

    console.log(`[${market.name}] 조건 만족 종목: ${filteredStocks.length}건`);
    console.log(filteredStocks);

    // 슬랙으로 결과 전송
    await sendToSlack(filteredStocks, market.name);
    if (filteredStocks.length > 0) {
      console.log(`[${market.name}] 슬랙으로 메시지를 성공적으로 전송했습니다.`);
    }

  } catch (error) {
    console.error(`[${market.name}] 데이터를 가져오는 중 오류가 발생했습니다:`, error);
  }
}

// 주기적으로 실행할 메인 함수
const runTracker = async () => {
  // --- 시간 및 요일 체크 로직 추가 ---
  const startHour = parseInt(process.env.START_HOUR, 10) || 9;
  const startMinute = parseInt(process.env.START_MINUTE, 10) || 0;
  const endHour = parseInt(process.env.END_HOUR, 10) || 15;
  const endMinute = parseInt(process.env.END_MINUTE, 10) || 30;

  // 한국 시간(KST) 기준으로 현재 날짜 및 시간 정보 가져오기
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
  const kstNow = new Date(now.getTime() + kstOffset);

  const dayOfWeek = kstNow.getUTCDay(); // 0:일요일, 1:월요일, ..., 6:토요일
  const currentHour = kstNow.getUTCHours();
  const currentMinute = kstNow.getUTCMinutes();

  // 2. 장 시간(09:00 ~ 15:30)인지 확인
  const currentTime = currentHour * 60 + currentMinute;
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  if (currentTime < startTime || currentTime > endTime) {
    console.log(`[${new Date().toLocaleString()}] 장 시간이 아니므로 데이터 수집을 건너뜁니다.`);
    return;
  }
  // --- 시간 체크 로직 끝 ---

  console.log(`\n[${new Date().toLocaleString()}] 주식 데이터 수집을 시작합니다.`);

  const markets = [
    { name: 'KOSPI', sosok: '0' },
    { name: 'KOSDAQ', sosok: '1' }
  ];

  // for...of 루프와 await를 사용하여 순차적으로 실행
  for (const market of markets) {
    await getStockData(market);
  }

  console.log(`[${new Date().toLocaleString()}] 모든 시장의 데이터 수집이 완료되었습니다.`);
};

// .env 파일에서 Cron 스케줄을 가져옵니다. 기본값은 10분마다 입니다.
const schedule = process.env.RUN_CRON_SCHEDULE || '*/10 * * * *';

// Cron 스케줄이 유효한지 확인합니다.
if (cron.validate(schedule)) {
  console.log(`\n프로그램이 시작되었습니다. 스케줄(${schedule})에 따라 자동 실행됩니다.`);
  console.log('프로그램을 종료하려면 Ctrl + C 를 누르세요.');

  // 설정된 스케줄에 따라 runTracker 함수를 실행합니다.
  cron.schedule(schedule, runTracker);
} else {
  console.error('오류: .env 파일의 RUN_CRON_SCHEDULE이 유효한 Cron 표현식이 아닙니다.');
}