type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

// 서버리스 환경 특성상 "best-effort" 메모리 캐시 (인스턴스 재활용 시에만 유지됨)
const cache = new Map<string, CacheEntry<unknown>>();

export async function getCached<T>(
  key: string,
  ttlMs: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) return cached.value;

  const value = await fetchFn();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

