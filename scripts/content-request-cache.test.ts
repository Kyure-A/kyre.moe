import assert from "node:assert/strict";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { createContentRequestCache } from "../src/shared/lib/content-request-cache.ts";

const isString = (value: unknown): value is string => typeof value === "string";
const URL = "https://example.test/preview";
const DAY = 24 * 60 * 60 * 1000;
const RETRY_DELAY = 5 * 60 * 1000;

const setup = (t: { after: (fn: () => void) => void }) => {
  const directory = fs.mkdtempSync(path.join(tmpdir(), "content-cache-test-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  let clock = 1_000;
  const options = { directory, now: () => clock, refresh: false };
  return {
    directory,
    options,
    cache: () => createContentRequestCache("test-v1", isString, options),
    advance: (ms: number) => {
      clock += ms;
    },
  };
};

test("successful requests are coalesced and persist for 24 hours", async (t) => {
  const fixture = setup(t);
  let calls = 0;
  const fetch = async () => {
    calls += 1;
    return new Response(`preview ${calls}`);
  };
  const request = async () => {
    const response = await fetch();
    return { value: await response.text(), ok: response.ok };
  };
  const cache = fixture.cache();
  assert.deepEqual(
    await Promise.all([cache(URL, request), cache(URL, request)]),
    ["preview 1", "preview 1"],
  );
  assert.equal(calls, 1);

  fixture.advance(DAY - 1);
  assert.equal(await fixture.cache()(URL, request), "preview 1");
  assert.equal(calls, 1);
  fixture.advance(1);
  assert.equal(await cache(URL, request), "preview 2");
  assert.equal(calls, 2);
});

test("failed responses retry after five minutes, then use the success TTL", async (t) => {
  const fixture = setup(t);
  let calls = 0;
  const fetch = async () => {
    calls += 1;
    return new Response(calls === 1 ? "fallback" : "recovered", {
      status: calls === 1 ? 503 : 200,
    });
  };
  const request = async () => {
    const response = await fetch();
    return { value: await response.text(), ok: response.ok };
  };

  assert.equal(await fixture.cache()(URL, request), "fallback");
  fixture.advance(RETRY_DELAY - 1);
  assert.equal(await fixture.cache()(URL, request), "fallback");
  assert.equal(calls, 1);
  fixture.advance(1);
  assert.equal(await fixture.cache()(URL, request), "recovered");
  fixture.advance(RETRY_DELAY);
  assert.equal(await fixture.cache()(URL, request), "recovered");
  assert.equal(calls, 2);
});

test("malformed, outdated, and invalid data are replaced", async (t) => {
  const fixture = setup(t);
  let calls = 0;
  const request = async () => ({ value: `value ${++calls}`, ok: true });
  await fixture.cache()(URL, request);
  const [name] = fs.readdirSync(fixture.directory);
  const filePath = path.join(fixture.directory, name);
  for (const invalid of [
    "{incomplete",
    "null",
    JSON.stringify({ version: 0, expiresAt: DAY, value: "old schema" }),
    JSON.stringify({ version: 1, expiresAt: DAY, value: {} }),
    JSON.stringify({ version: 1, expiresAt: "forever", value: "bad expiry" }),
  ]) {
    fs.writeFileSync(filePath, invalid);
    const before = calls;
    assert.equal(await fixture.cache()(URL, request), `value ${before + 1}`);
    assert.equal(calls, before + 1);
  }
});

test("refresh ignores disk but still reuses requests within the same run", async (t) => {
  const fixture = setup(t);
  let calls = 0;
  const request = async () => ({ value: `value ${++calls}`, ok: true });
  assert.equal(await fixture.cache()(URL, request), "value 1");
  const refreshed = createContentRequestCache("test-v1", isString, {
    ...fixture.options,
    refresh: true,
  });
  assert.equal(await refreshed(URL, request), "value 2");
  assert.equal(await refreshed(URL, request), "value 2");
  assert.equal(await fixture.cache()(URL, request), "value 2");
  assert.equal(calls, 2);
});

test("namespaces isolate schema changes and request failures can retry", async (t) => {
  const fixture = setup(t);
  const request = async () => ({ value: "old schema", ok: true });
  await fixture.cache()(URL, request);
  const next = createContentRequestCache("test-v2", isString, fixture.options);
  await assert.rejects(
    next(URL, async () => {
      throw new Error("fetch failed");
    }),
  );
  assert.equal(
    await next(URL, async () => ({ value: "new schema", ok: true })),
    "new schema",
  );
});
