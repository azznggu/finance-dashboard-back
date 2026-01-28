import type { Handler } from '@netlify/functions';
import { getCached } from './_lib/cache.js';
import { badRequest, ok, serverError } from './_lib/response.js';
import { getExchangeRate } from '../../src/services/financeService.ts';

const TTL_MS = 10 * 60 * 1000; // 10분

export const handler: Handler = async (event) => {
  try {
    const pair = event.queryStringParameters?.pair;
    const period = event.queryStringParameters?.period ?? '1day';

    if (!pair) return badRequest('pair 파라미터가 필요합니다');

    const cacheKey = `exchange-${pair}-${period}`;
    const data = await getCached(cacheKey, TTL_MS, () => getExchangeRate(pair, period));

    return ok(data);
  } catch (error) {
    console.error('환율 API 오류:', error);
    return serverError('환율 정보를 가져올 수 없습니다');
  }
};

