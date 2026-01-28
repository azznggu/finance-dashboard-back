import type { HandlerResponse } from '@netlify/functions';

export function json(statusCode: number, body: unknown, extraHeaders: Record<string, string> = {}): HandlerResponse {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Netlify Functions 기본 CORS (필요 시 도메인 제한 권장)
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,OPTIONS',
      'access-control-allow-headers': 'content-type',
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

export function ok(body: unknown): HandlerResponse {
  return json(200, body);
}

export function badRequest(message: string): HandlerResponse {
  return json(400, { error: message });
}

export function serverError(message: string): HandlerResponse {
  return json(500, { error: message });
}

