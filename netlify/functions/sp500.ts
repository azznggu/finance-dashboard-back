import type { Handler } from '@netlify/functions';
import { getCached } from './_lib/cache.js';
import { ok, serverError } from './_lib/response.js';
import { getSP500 } from '../../src/services/financeService.ts';

const TTL_MS = 10 * 60 * 1000; // 10분

export const handler: Handler = async (event) => {
  try {
    const period = event.queryStringParameters?.period ?? '1day';
    const cacheKey = `sp500-${period}`;
    const data = await getCached(cacheKey, TTL_MS, () => getSP500(period));
    return ok(data);
  } catch (error) {
    console.error('S&P 500 API 오류:', error);
    return serverError('S&P 500 정보를 가져올 수 없습니다');
  }
};

