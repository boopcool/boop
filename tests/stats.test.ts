import assert from "node:assert/strict";
import { test } from "node:test";
import {
  apportion,
  hasWinner,
  signalLevel,
  wilsonInterval,
} from "../src/lib/stats.ts";

/* -------------------------------------------------------------------------- */
/* Wilson interval                                                             */
/* -------------------------------------------------------------------------- */

test("wilson interval stays inside [0, 1] at the extremes", () => {
  const all = wilsonInterval(10, 10);
  assert.ok(all.low > 0 && all.low < 1);
  assert.ok(all.high > 0.999 && all.high <= 1);

  const none = wilsonInterval(0, 10);
  assert.ok(none.low >= 0 && none.low < 0.001);
  assert.ok(none.high > 0 && none.high < 1);
});

test("wilson interval matches a known value", () => {
  // 55/82 is the worked example used throughout the marketing copy.
  const { low, high } = wilsonInterval(55, 82);
  assert.ok(Math.abs(low - 0.5634) < 0.001, `low was ${low}`);
  assert.ok(Math.abs(high - 0.7628) < 0.001, `high was ${high}`);
});

test("wilson interval narrows as the sample grows", () => {
  const small = wilsonInterval(6, 10);
  const large = wilsonInterval(600, 1000);
  assert.ok(large.high - large.low < small.high - small.low);
});

test("wilson interval handles an empty sample", () => {
  const { low, high } = wilsonInterval(0, 0);
  assert.equal(low, 0);
  assert.equal(high, 1);
});

/* -------------------------------------------------------------------------- */
/* Winner declaration                                                          */
/* -------------------------------------------------------------------------- */

test("no winner is declared on a tiny sample", () => {
  assert.equal(hasWinner(3, 4), false);
  assert.equal(hasWinner(4, 4), false, "n=4 is below the floor even at 100%");
});

test("a lopsided small sample can still clear the bar", () => {
  // 9/10 is extreme enough that the lower bound clears 50%.
  assert.equal(hasWinner(9, 10), true);
});

test("a near-even split never produces a winner", () => {
  assert.equal(hasWinner(52, 100), false);
  assert.equal(hasWinner(55, 100), false);
  assert.equal(hasWinner(62, 100), true);
});

/* -------------------------------------------------------------------------- */
/* Signal labels                                                               */
/* -------------------------------------------------------------------------- */

test("signal levels escalate with sample size", () => {
  assert.equal(signalLevel(2, 3).level, "none");
  assert.equal(signalLevel(7, 10).level, "early");
  assert.equal(signalLevel(18, 25).level, "moderate");
  assert.equal(signalLevel(55, 82).level, "high");
});

test("a coin-flip result stays 'early' no matter how large", () => {
  assert.equal(signalLevel(500, 1000).level, "early");
});

/* -------------------------------------------------------------------------- */
/* Percentage apportionment                                                    */
/* -------------------------------------------------------------------------- */

test("apportioned percentages always sum to 100", () => {
  for (const counts of [
    [1, 1, 1],
    [27, 55],
    [1, 2, 3, 4],
    [10, 10, 10, 10, 10, 10, 10],
    [999, 1],
  ]) {
    const shares = apportion(counts);
    assert.equal(
      shares.reduce((a, b) => a + b, 0),
      100,
      `counts ${counts.join(",")} produced ${shares.join(",")}`,
    );
  }
});

test("apportion returns zeroes for an empty tally", () => {
  assert.deepEqual(apportion([0, 0]), [0, 0]);
});

test("apportion gives the remainder to the largest fraction", () => {
  // 1/3 each: 33.33 -> floors 33,33,33 with 1 left over.
  const shares = apportion([1, 1, 1]);
  assert.equal(shares.filter((s) => s === 34).length, 1);
  assert.equal(shares.filter((s) => s === 33).length, 2);
});
