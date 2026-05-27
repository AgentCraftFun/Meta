/**
 * Tiny KV abstraction. Uses Upstash Redis REST when both
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, otherwise falls
 * back to a per-process in-memory map. Implemented over fetch so we don't pull
 * in the @upstash/redis client.
 *
 * Resilience contract: cache helpers NEVER throw. Any Upstash error
 * (bad URL, bad token, network blip, malformed response) is logged
 * once per error type and surfaces as a cache miss on read or a
 * silent no-op on write. Callers can stay simple and trust that
 * adding a cache layer can't be the reason their endpoint 500s.
 */

type Entry = { value: string; expiresAt: number };

const memory = new Map<string, Entry>();

/** One-time warnings keyed by error.name so the logs don't drown
 *  in identical lines per request. */
const warnedErrors = new Set<string>();

function upstashConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function upstash<T>(args: (string | number)[]): Promise<T | null> {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  if (!url || !token) return null;

  // Sanity-check the URL once. The most common Upstash misconfig
  // is pasting the `redis://...` connection string instead of the
  // REST URL.
  if (!url.startsWith('https://')) {
    warnOnce(
      'upstash-bad-url',
      `[cache] UPSTASH_REDIS_REST_URL must start with https://. Got: "${url.slice(0, 40)}…". Cache disabled; falling back to in-process memory.`
    );
    return null;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  if (!res.ok) {
    warnOnce(
      `upstash-${res.status}`,
      `[cache] Upstash returned ${res.status} (${res.statusText}). Treating as cache miss.`
    );
    return null;
  }
  const json = (await res.json()) as { result: T };
  return json.result ?? null;
}

function warnOnce(key: string, message: string) {
  if (warnedErrors.has(key)) return;
  warnedErrors.add(key);
  console.warn(message);
}

export async function cacheGet(key: string): Promise<string | null> {
  if (upstashConfigured()) {
    try {
      return await upstash<string>(['GET', key]);
    } catch (err) {
      warnOnce(
        `cacheGet-${(err as Error)?.name ?? 'err'}`,
        `[cache] GET ${key} failed: ${(err as Error)?.message ?? err}. Treating as miss.`
      );
      return null;
    }
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
    try {
      await upstash(['SET', key, value, 'EX', ttlSeconds]);
    } catch (err) {
      warnOnce(
        `cacheSet-${(err as Error)?.name ?? 'err'}`,
        `[cache] SET ${key} failed: ${(err as Error)?.message ?? err}. Cache write skipped.`
      );
    }
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
