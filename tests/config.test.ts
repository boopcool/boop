import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanEnv } from "../src/lib/config.ts";

/**
 * Regression coverage for a production build failure: an empty
 * NEXT_PUBLIC_SITE_URL reached `new URL("")` in the root layout's
 * `metadataBase` and crashed page-data collection. `??` doesn't fall back on
 * "", only on undefined.
 *
 * `siteUrl()` is re-imported per case because Next inlines the value at build
 * time in app code; here it reads `process.env` live, so the module cache has
 * to be bypassed for each scenario.
 */

const KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
] as const;

const original = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const key of KEYS) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function freshSiteUrl(): Promise<string> {
  // Cache-bust the module so the new environment is read.
  const mod = await import(`../src/lib/config.ts?t=${Math.random()}`);
  return (mod as { siteUrl: () => string }).siteUrl();
}

function setEnv(values: Partial<Record<(typeof KEYS)[number], string>>): void {
  for (const key of KEYS) delete process.env[key];
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
}

/* -------------------------------------------------------------------------- */

test("cleanEnv treats blank and whitespace as absent", () => {
  assert.equal(cleanEnv(""), undefined);
  assert.equal(cleanEnv("   "), undefined);
  assert.equal(cleanEnv(undefined), undefined);
  assert.equal(cleanEnv("  https://boop.cool  "), "https://boop.cool");
});

test("siteUrl falls back when the variable is defined but empty", async () => {
  setEnv({ NEXT_PUBLIC_SITE_URL: "" });
  assert.equal(await freshSiteUrl(), "http://localhost:3000");
});

test("siteUrl falls back when the variable is whitespace", async () => {
  setEnv({ NEXT_PUBLIC_SITE_URL: "   " });
  assert.equal(await freshSiteUrl(), "http://localhost:3000");
});

test("siteUrl always returns something new URL() accepts", async () => {
  for (const value of ["", "   ", "not a url", "://broken", "http://"]) {
    setEnv({ NEXT_PUBLIC_SITE_URL: value });
    const result = await freshSiteUrl();
    assert.doesNotThrow(
      () => new URL(result),
      `siteUrl() returned an unusable value for input ${JSON.stringify(value)}: ${result}`,
    );
  }
});

test("siteUrl accepts a bare hostname and assumes https", async () => {
  setEnv({ NEXT_PUBLIC_SITE_URL: "boop.cool" });
  assert.equal(await freshSiteUrl(), "https://boop.cool");
});

test("siteUrl strips trailing slashes and paths", async () => {
  setEnv({ NEXT_PUBLIC_SITE_URL: "https://boop.cool/" });
  assert.equal(await freshSiteUrl(), "https://boop.cool");

  setEnv({ NEXT_PUBLIC_SITE_URL: "https://boop.cool/app/" });
  assert.equal(await freshSiteUrl(), "https://boop.cool");
});

test("siteUrl prefers the explicit variable over Vercel's", async () => {
  setEnv({
    NEXT_PUBLIC_SITE_URL: "https://boop.cool",
    VERCEL_PROJECT_PRODUCTION_URL: "boop-abc123.vercel.app",
  });
  assert.equal(await freshSiteUrl(), "https://boop.cool");
});

test("siteUrl uses Vercel's host when the explicit variable is blank", async () => {
  setEnv({
    NEXT_PUBLIC_SITE_URL: "",
    VERCEL_PROJECT_PRODUCTION_URL: "boop-abc123.vercel.app",
  });
  assert.equal(await freshSiteUrl(), "https://boop-abc123.vercel.app");
});

test("siteUrl falls through to the preview URL last", async () => {
  setEnv({ VERCEL_URL: "boop-git-main.vercel.app" });
  assert.equal(await freshSiteUrl(), "https://boop-git-main.vercel.app");
});
