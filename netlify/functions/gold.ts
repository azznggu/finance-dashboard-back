import type { Handler } from '@netlify/functions';
import { getCached } from './_lib/cache.js';
import { ok, serverError } from './_lib/response.js';
import { getGoldPrice } from '../../src/services/financeService.js';

const TTL_MS = 10 * 60 * 1000; // 10분

export const handler: Handler = async (event) => {
  try {
    const period = event.queryStringParameters?.period ?? '1day';
    const cacheKey = `gold-${period}`;
    const data = await getCached(cacheKey, TTL_MS, () => getGoldPrice(period));
    return ok(data);
  } catch (error) {
    console.error('금시세 API 오류:', error);
    return serverError('금시세 정보를 가져올 수 없습니다');
  }
};

