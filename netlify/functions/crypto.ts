import type { Handler } from '@netlify/functions';
import { getCached } from './_lib/cache.js';
import { badRequest, ok, serverError } from './_lib/response.js';
import { getCryptoPrice } from '../../src/services/financeService.ts';

const TTL_MS = 10 * 60 * 1000; // 10분

export const handler: Handler = async (event) => {
  try {
    const symbolFromQuery = event.queryStringParameters?.symbol;
    // /api/crypto/BTC -> /.netlify/functions/crypto/BTC 형태로 들어올 수 있음
    const path = event.path || '';
    const symbolFromPath = path.split('/').pop() || undefined;
    const symbol = symbolFromQuery || symbolFromPath;
    const period = event.queryStringParameters?.period ?? '1day';

    if (!symbol) return badRequest('symbol 파라미터가 필요합니다');

    const cacheKey = `crypto-${symbol}-${period}`;
    const data = await getCached(cacheKey, TTL_MS, () => getCryptoPrice(symbol, period));

    return ok(data);
  } catch (error) {
    console.error('가상화폐 API 오류:', error);
    return serverError('가상화폐 정보를 가져올 수 없습니다');
  }
};

