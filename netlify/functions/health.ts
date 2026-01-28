import type { Handler } from '@netlify/functions';
import { ok } from './_lib/response.js';

export const handler: Handler = async () => {
  return ok({ status: 'ok', timestamp: new Date().toISOString() });
};

