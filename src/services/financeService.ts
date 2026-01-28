// 금융 데이터 서비스
import { request } from 'undici';

export interface PriceData {
  timestamp: number;
  value: number;
}

export interface HistoricalData {
  current: number;
  change24h: number;
  history: PriceData[];
}

// 재시도 헬퍼 함수 (429 에러 처리) - undici 버전
async function fetchWithRetry<T = any>(url: string, maxRetries: number = 3, delay: number = 1000): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { statusCode, headers, body } = await request(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FinanceDashboard/1.0)',
          'Accept': 'application/json'
        },
        headersTimeout: 10000,
        bodyTimeout: 10000
      });

      // 429 에러인 경우 재시도
      if (statusCode === 429) {
        if (attempt < maxRetries - 1) {
          const retryAfter = headers['retry-after'] as string;
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay * Math.pow(2, attempt);
          console.warn(`Rate limit 초과. ${waitTime / 1000}초 후 재시도... (${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      if (statusCode !== 200) {
        throw new Error(`HTTP ${statusCode}`);
      }

      const text = await body.text();
      return JSON.parse(text) as T;
    } catch (error: any) {
      console.error(`Fetch 시도 ${attempt + 1} 실패:`, error.message);

      if (attempt === maxRetries - 1) {
        throw error;
      }
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }

  throw new Error('최대 재시도 횟수 초과');
}

// 환율 조회
export async function getExchangeRate(pair: string, period: string = '1day'): Promise<HistoricalData> {
  try {
    const { statusCode, body } = await request('https://open.er-api.com/v6/latest/USD', {
      method: 'GET',
      headersTimeout: 10000,
      bodyTimeout: 10000
    });

    if (statusCode !== 200) {
      throw new Error(`HTTP ${statusCode}`);
    }

    const text = await body.text();
    const data = JSON.parse(text);

    const now = Date.now();
    let current = 0;

    if (pair === 'USD/KRW') {
      current = data.rates.KRW;
    } else if (pair === 'JPY/KRW') {
      const usdToJpy = data.rates.JPY;
      current = data.rates.KRW / usdToJpy;
    }

    // 히스토리 데이터 생성 (실제로는 과거 데이터 API 사용)
    const history = generateHistoricalData(current, period);
    const change24h = calculateChange(history);

    return {
      current,
      change24h,
      history
    };
  } catch (error) {
    console.error('환율 조회 실패:', error);
    throw error;
  }
}

// 금시세 조회 (3.75g 기준) - CoinGecko 사용, 실패 시 fallback
export async function getGoldPrice(period: string = '1day'): Promise<HistoricalData> {
  try {
    // CoinGecko API 시도
    const data = await fetchWithRetry<any>(
      'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=krw&include_24hr_change=true'
    );

    // API 응답 검증
    if (data && data['pax-gold'] && data['pax-gold'].krw) {
      // 1온스 = 31.1035그램, 3.75그램으로 환산
      const gramsToOunce = 3.75 / 31.1035;
      const current = data['pax-gold'].krw * gramsToOunce;
      const change24h = data['pax-gold'].krw_24h_change || 0;

      const history = generateHistoricalData(current, period);

      return {
        current,
        change24h,
        history
      };
    }

    // Fallback: 환율 기반 계산 (CoinGecko 실패 시)
    console.warn('CoinGecko API 실패, 환율 기반 계산으로 전환');
    const { statusCode: exStatusCode, body: exBody } = await request('https://open.er-api.com/v6/latest/USD', {
      method: 'GET',
      headersTimeout: 10000,
      bodyTimeout: 10000
    });
    const exText = await exBody.text();
    const exchangeData = JSON.parse(exText);
    const usdToKrw = exchangeData.rates?.KRW || 1320;

    // 금 가격 (USD/온스 기준, 약 $2,000/온스)
    const goldPricePerOunceUSD = 2000;
    const gramsToOunce = 3.75 / 31.1035;
    const current = goldPricePerOunceUSD * usdToKrw * gramsToOunce;
    const change24h = 0;

    const history = generateHistoricalData(current, period);

    return {
      current,
      change24h,
      history
    };
  } catch (error) {
    console.error('금시세 조회 실패:', error);
    throw error;
  }
}

// 가상화폐 시세 조회 - CoinGecko API 사용
export async function getCryptoPrice(symbol: string, period: string = '1day'): Promise<HistoricalData> {
  try {
    const upper = symbol.toUpperCase();

    const coinGeckoIds: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      XRP: 'ripple'
    };

    const coinId = coinGeckoIds[upper];

    if (!coinId) {
      throw new Error(`지원하지 않는 암호화폐: ${symbol}`);
    }

    // CoinGecko API로 KRW 가격 직접 조회
    const data = await fetchWithRetry<any>(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=krw&include_24hr_change=true`
    );

    // API 응답 검증
    if (!data || !data[coinId] || !data[coinId].krw) {
      throw new Error(`CoinGecko 가격 데이터를 찾을 수 없습니다: ${symbol}`);
    }

    const current = data[coinId].krw;
    const change24h = data[coinId].krw_24h_change || 0;

    const history = generateHistoricalData(current, period);

    return {
      current,
      change24h,
      history
    };
  } catch (error) {
    console.error('암호화폐 조회 실패:', error);
    throw error;
  }
}

// S&P 500 지수 조회
export async function getSP500(period: string = '1day'): Promise<HistoricalData> {
  try {
    const { statusCode, body } = await request(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=1d',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FinanceDashboard/1.0)'
        },
        headersTimeout: 10000,
        bodyTimeout: 10000
      }
    );

    if (statusCode !== 200) {
      throw new Error(`HTTP ${statusCode}`);
    }

    const text = await body.text();
    const data = JSON.parse(text);

    const quote = data.chart.result[0];
    const current = quote.meta.regularMarketPrice;
    const previousClose = quote.meta.chartPreviousClose;
    const change24h = ((current - previousClose) / previousClose) * 100;

    const history = generateHistoricalData(current, period);

    return {
      current,
      change24h,
      history
    };
  } catch (error) {
    console.error('S&P 500 조회 실패:', error);
    // 폴백
    return {
      current: 0,
      change24h: 0,
      history: []
    };
  }
}

// 히스토리 데이터 생성 (실제로는 과거 데이터 API 사용 권장)
function generateHistoricalData(currentPrice: number, period: string): PriceData[] {
  const dataPoints: { [key: string]: number } = {
    '1day': 24,
    '1week': 7 * 4,    // 6시간 간격
    '1month': 30,
    '6month': 180,
    '1year': 365
  };

  const points = dataPoints[period] || 24;
  const now = Date.now();

  // 기간별 interval 설정
  let interval: number;
  if (period === '1day') {
    interval = 60 * 60 * 1000; // 1시간
  } else if (period === '1week') {
    interval = 6 * 60 * 60 * 1000; // 6시간
  } else {
    interval = 24 * 60 * 60 * 1000; // 1일
  }

  // 기간별 트렌드 설정 (시작 가격이 현재보다 낮게)
  const trendFactors: { [key: string]: number } = {
    '1day': 0.98,    // 2% 상승
    '1week': 0.95,   // 5% 상승
    '1month': 0.90,  // 10% 상승
    '6month': 0.85,  // 15% 상승
    '1year': 0.80    // 20% 상승
  };

  const startFactor = trendFactors[period] || 0.95;
  const startPrice = currentPrice * startFactor;

  const history: PriceData[] = [];
  let previousValue = startPrice;

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = now - (i * interval);
    const progress = (points - 1 - i) / (points - 1); // 0 to 1

    // 기준 가격 (시작에서 현재로 선형 증가)
    const baseValue = startPrice + (currentPrice - startPrice) * progress;

    // 변동성 추가 (이전 값 기준으로 작은 변동)
    const volatility = 0.02; // 2% 변동성
    const randomChange = (Math.random() - 0.5) * volatility;
    const value = previousValue + (baseValue - previousValue) * 0.3 + previousValue * randomChange;

    previousValue = value;

    history.push({
      timestamp,
      value: parseFloat(value.toFixed(2))
    });
  }

  // 마지막 값을 현재 가격으로 보정
  if (history.length > 0) {
    history[history.length - 1].value = currentPrice;
  }

  // 타임스탬프 기준으로 정렬 (과거 → 현재)
  history.sort((a, b) => a.timestamp - b.timestamp);

  return history;
}

// 변동률 계산
function calculateChange(history: PriceData[]): number {
  if (history.length < 2) return 0;

  const oldest = history[0].value;
  const newest = history[history.length - 1].value;

  return ((newest - oldest) / oldest) * 100;
}
