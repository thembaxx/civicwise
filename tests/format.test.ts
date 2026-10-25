import assert from "node:assert/strict";
import test from "node:test";
import { daysSince, financialYear, formatPercent, formatRand } from "../lib/format.ts";

test("financial years use the previous year and two-digit ending year", () => {
  assert.equal(financialYear(2026), "2025/26");
});

test("rand amounts preserve sign and differentiate scale", () => {
  assert.equal(formatRand(0), "R0");
  assert.equal(formatRand(-2500), "-R3k");
  assert.equal(formatRand(2_300_000), "R2m");
  assert.equal(formatRand(undefined), "—");
});

test("percent formatting handles unknowns and positive signs", () => {
  assert.equal(formatPercent(5.27, 1), "+5.3%");
  assert.equal(formatPercent(-4), "-4%");
  assert.equal(formatPercent(Number.POSITIVE_INFINITY), "—");
});

test("daysSince clamps future events to zero", () => {
  const now = Date.parse("2026-10-25T00:00:00Z");
  assert.equal(daysSince("2026-10-23T00:00:00Z", now), 2);
  assert.equal(daysSince("2026-10-27T00:00:00Z", now), 0);
});
