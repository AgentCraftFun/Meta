/**
 * Tiny KV abstraction. Uses Upstash Redis REST when both
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, otherwise falls
 * back to a per-process in-memory map. Implemented over fetch so we don't pull
 * in the @upstash/redis client.
 */

type Entry = { value: string; expiresAt: number };

const memory = new Map<string, Entry>();

function upstashConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function upstash<T>(args: (string | number)[]): Promise<T | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result: T };
  return json.result ?? null;
}

export async function cacheGet(key: string): Promise<string | null> {
  if (upstashConfigured()) {
    return await upstash<string>(['GET', key]);
  }
  const e = memory.get(key);
  if (!e) return null;
  if (e.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return e.value;
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  if (upstashConfigured()) {
    await upstash(['SET', key, value, 'EX', ttlSeconds]);
    return;
  }
  memory.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function cacheBackend(): 'upstash' | 'memory' {
  return upstashConfigured() ? 'upstash' : 'memory';
}
