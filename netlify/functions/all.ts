import type { Handler } from '@netlify/functions';
import { getCached } from './_lib/cache.js';
import { ok, serverError } from './_lib/response.js';
import { getExchangeRate, getGoldPrice, getCryptoPrice, getSP500 } from '../../src/services/financeService.ts';

const TTL_MS = 10 * 60 * 1000; // 10분

export const handler: Handler = async (event) => {
  try {
    const exchangePeriod = event.queryStringParameters?.exchangePeriod ?? '1day';
    const goldPeriod = event.queryStringParameters?.goldPeriod ?? '1day';
    const cryptoPeriod = event.queryStringParameters?.cryptoPeriod ?? '1day';
    const sp500Period = event.queryStringParameters?.sp500Period ?? '1day';

    const [usdKrw, jpyKrw, gold, btc, eth, xrp, sp500] = await Promise.all([
      getCached(`exchange-USD/KRW-${exchangePeriod}`, TTL_MS, () => getExchangeRate('USD/KRW', exchangePeriod)),
      getCached(`exchange-JPY/KRW-${exchangePeriod}`, TTL_MS, () => getExchangeRate('JPY/KRW', exchangePeriod)),
      getCached(`gold-${goldPeriod}`, TTL_MS, () => getGoldPrice(goldPeriod)),
      getCached(`crypto-BTC-${cryptoPeriod}`, TTL_MS, () => getCryptoPrice('BTC', cryptoPeriod)),
      getCached(`crypto-ETH-${cryptoPeriod}`, TTL_MS, () => getCryptoPrice('ETH', cryptoPeriod)),
      getCached(`crypto-XRP-${cryptoPeriod}`, TTL_MS, () => getCryptoPrice('XRP', cryptoPeriod)),
      getCached(`sp500-${sp500Period}`, TTL_MS, () => getSP500(sp500Period))
    ]);

    return ok({
      exchangeRates: { usdKrw, jpyKrw },
      gold,
      crypto: { btc, eth, xrp },
      sp500
    });
  } catch (error) {
    console.error('전체 데이터 API 오류:', error);
    return serverError('데이터를 가져올 수 없습니다');
  }
};

