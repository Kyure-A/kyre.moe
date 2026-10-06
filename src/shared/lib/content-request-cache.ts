import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 5 * 60 * 1000;

type RequestResult<T> = { value: T; ok: boolean };
type CacheEntry<T> = { version: 1; expiresAt: number; value: T };

// Bump the namespace when a request's stored data or interpretation changes.
// CONTENT_CACHE_REFRESH=1 ignores disk entries, but still coalesces requests.
export const createContentRequestCache = <T>(
  namespace: string,
  validate: (value: unknown) => value is T,
  options: {
    directory?: string;
    now?: () => number;
    refresh?: boolean;
  } = {},
) => {
  const directory =
    options.directory ?? path.join(process.cwd(), ".cache", "content");
  const now = options.now ?? Date.now;
  const refresh = options.refresh ?? process.env.CONTENT_CACHE_REFRESH === "1";
  const entries = new Map<string, CacheEntry<T>>();
  const pending = new Map<string, Promise<T>>();

  const readEntry = (filePath: string): CacheEntry<T> | undefined => {
    if (refresh) return;
    try {
      const entry: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (
        entry &&
        typeof entry === "object" &&
        "version" in entry &&
        entry.version === 1 &&
        "expiresAt" in entry &&
        typeof entry.expiresAt === "number" &&
        Number.isFinite(entry.expiresAt) &&
        entry.expiresAt > now() &&
        "value" in entry &&
        validate(entry.value)
      ) {
        return entry as CacheEntry<T>;
      }
    } catch {
      // Missing or damaged cache data only costs a fresh request.
    }
  };

  const writeEntry = (filePath: string, entry: CacheEntry<T>) => {
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
    try {
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(temporaryPath, JSON.stringify(entry));
      fs.renameSync(temporaryPath, filePath);
    } catch {
      // A read-only or unavailable cache must not fail content generation.
      try {
        fs.rmSync(temporaryPath, { force: true });
      } catch {}
    }
  };

  return (
    key: string,
    request: () => Promise<RequestResult<T>>,
  ): Promise<T> => {
    const cached = entries.get(key);
    if (cached && cached.expiresAt > now())
      return Promise.resolve(cached.value);
    const active = pending.get(key);
    if (active) return active;

    const digest = createHash("sha256")
      .update(JSON.stringify([namespace, key]))
      .digest("hex");
    const filePath = path.join(directory, `${digest}.json`);
    const saved = readEntry(filePath);
    if (saved) {
      entries.set(key, saved);
      return Promise.resolve(saved.value);
    }

    const promise = Promise.resolve()
      .then(request)
      .then(({ value, ok }) => {
        const entry: CacheEntry<T> = {
          version: 1,
          expiresAt: now() + (ok ? SUCCESS_TTL_MS : FAILURE_TTL_MS),
          value,
        };
        entries.set(key, entry);
        writeEntry(filePath, entry);
        return value;
      })
      .finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  };
};
