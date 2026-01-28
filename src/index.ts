import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import {
  getExchangeRate,
  getGoldPrice,
  getCryptoPrice,
  getSP500
} from './services/financeService.js';

const app = express();
const PORT = 3001;

// 캐시 설정 (10분 - rate limit 방지)
const cache = new NodeCache({ stdTTL: 600 });

// 미들웨어
app.use(cors());
app.use(express.json());

// 캐시 헬퍼
function getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  return fetchFn().then(data => {
    cache.set(key, data);
    return data;
  });
}

// 환율 API
app.get('/api/exchange-rate', async (req, res) => {
  try {
    const { pair, period = '1day' } = req.query;

    if (!pair || typeof pair !== 'string') {
      return res.status(400).json({ error: 'pair 파라미터가 필요합니다' });
    }

    const cacheKey = `exchange-${pair}-${period}`;

    const data = await getCached(cacheKey, () =>
      getExchangeRate(pair, period as string)
    );

    res.json(data);
  } catch (error) {
    console.error('환율 API 오류:', error);
    res.status(500).json({ error: '환율 정보를 가져올 수 없습니다' });
  }
});

// 금시세 API
app.get('/api/gold', async (req, res) => {
  try {
    const { period = '1day' } = req.query;
    const cacheKey = `gold-${period}`;

    const data = await getCached(cacheKey, () =>
      getGoldPrice(period as string)
    );

    res.json(data);
  } catch (error) {
    console.error('금시세 API 오류:', error);
    res.status(500).json({ error: '금시세 정보를 가져올 수 없습니다' });
  }
});

// 가상화폐 API
app.get('/api/crypto/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1day' } = req.query;
    const cacheKey = `crypto-${symbol}-${period}`;

    const data = await getCached(cacheKey, () =>
      getCryptoPrice(symbol, period as string)
    );

    res.json(data);
  } catch (error) {
    console.error('가상화폐 API 오류:', error);
    res.status(500).json({ error: '가상화폐 정보를 가져올 수 없습니다' });
  }
});

// S&P 500 API
app.get('/api/sp500', async (req, res) => {
  try {
    const { period = '1day' } = req.query;
    const cacheKey = `sp500-${period}`;

    const data = await getCached(cacheKey, () =>
      getSP500(period as string)
    );

    res.json(data);
  } catch (error) {
    console.error('S&P 500 API 오류:', error);
    res.status(500).json({ error: 'S&P 500 정보를 가져올 수 없습니다' });
  }
});

// 모든 데이터 한번에 (카테고리별 period 지원)
app.get('/api/all', async (req, res) => {
  try {
    // 카테고리별 period 파라미터 (기본값: 1day)
    const exchangePeriod = (req.query.exchangePeriod as string) || '1day';
    const goldPeriod = (req.query.goldPeriod as string) || '1day';
    const cryptoPeriod = (req.query.cryptoPeriod as string) || '1day';
    const sp500Period = (req.query.sp500Period as string) || '1day';

    const [usdKrw, jpyKrw, gold, btc, eth, xrp, sp500] = await Promise.all([
      getCached(`exchange-USD/KRW-${exchangePeriod}`, () => getExchangeRate('USD/KRW', exchangePeriod)),
      getCached(`exchange-JPY/KRW-${exchangePeriod}`, () => getExchangeRate('JPY/KRW', exchangePeriod)),
      getCached(`gold-${goldPeriod}`, () => getGoldPrice(goldPeriod)),
      getCached(`crypto-BTC-${cryptoPeriod}`, () => getCryptoPrice('BTC', cryptoPeriod)),
      getCached(`crypto-ETH-${cryptoPeriod}`, () => getCryptoPrice('ETH', cryptoPeriod)),
      getCached(`crypto-XRP-${cryptoPeriod}`, () => getCryptoPrice('XRP', cryptoPeriod)),
      getCached(`sp500-${sp500Period}`, () => getSP500(sp500Period))
    ]);

    res.json({
      exchangeRates: {
        usdKrw,
        jpyKrw
      },
      gold,
      crypto: {
        btc,
        eth,
        xrp
      },
      sp500
    });
  } catch (error) {
    console.error('전체 데이터 API 오류:', error);
    res.status(500).json({ error: '데이터를 가져올 수 없습니다' });
  }
});

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 금융 데이터 API 서버가 http://localhost:${PORT} 에서 실행중입니다`);
});
