// Unit tests for the pure maths in each experiment. Run: node --test tests/
// Every generated transfer item must accept its own answer and reject the misconception it targets.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as F from "../add-fractions/logic.js";
import * as P from "../percent-changes/logic.js";
import * as B from "../balance-equations/logic.js";

const RUNS = 300;
const choiceOptions = (item) => item.options.map((_, i) => i).filter((i) => item.check(i).ok);

/** Each item: has a show text, accepts its answer; choice items have exactly one right option. */
function checkItems(items) {
  for (const it of items) {
    assert.ok(it.show, "every item can be revealed");
    assert.ok(it.check(it.answer).ok, `answer accepted: ${it.html}`);
    if (it.type === "choice") assert.deepEqual(choiceOptions(it), [it.answer], `one right option: ${it.html}`);
  }
}

test("fractions: arithmetic", () => {
  assert.deepEqual(F.addFrac(1, 2, 1, 3), [5, 6]);
  assert.deepEqual(F.addFrac(3, 4, 1, 6), [11, 12]);
  assert.ok(F.sameValue([22, 24], [11, 12]));
  assert.ok(!F.sameValue([2, 5], [5, 6]));
});

test("fractions: diagnosis names the misconception", () => {
  assert.equal(F.diagnose(3, 4, 1, 6, [11, 12]), null);
  assert.equal(F.diagnose(3, 4, 1, 6, [22, 24]), null, "equivalent forms accepted");
  assert.match(F.diagnose(3, 4, 1, 6, [4, 10]), /Turbo's trick/);
  assert.match(F.diagnose(3, 4, 1, 6, [4, 12]), /re-count/);
});

test("fractions: random pairs are unlike, non-nested, LCD ≤ 24", () => {
  for (let i = 0; i < RUNS; i++) {
    const [a, b, c, d] = F.randomPair(1);
    assert.ok(b !== d && b % d && d % b, `${b},${d}`);
    assert.ok(a < b && c < d);
    assert.ok(a * d + c * b <= b * d, "sum ≤ 1 when capped");
  }
});

test("fractions: transfer sets", () => {
  const first = F.transferItems(true);
  assert.match(first[1].html, /3.*4.*1.*6/s, "first set uses the teachers' 3/4 + 1/6");
  assert.ok(!first[1].check([4, 10]).ok);
  for (let i = 0; i < RUNS; i++) checkItems(F.transferItems(false));
});

test("percent: core maths", () => {
  assert.equal(P.upDown(100, 20, 20), 96);
  assert.equal(P.upDown(100, 20, 20, "down"), 96);
  assert.equal(P.upDown(500, 20, 20), 480);
  assert.equal(P.upDown(100, 25, 20), 100);
  assert.equal(P.upDown(100, 50, 50), 75);
  assert.equal(P.undoDiscount(20), 16.67);
  assert.equal(P.undoDiscount(25), 20);
});

test("percent: transfer sets reject 'percentages cancel'", () => {
  for (let i = 0; i < RUNS; i++) {
    const items = P.transferItems();
    checkItems(items);
    assert.ok(Number.isInteger(items[0].answer), "Q1 answers are whole numbers");
    assert.ok(!items[3].check(+items[3].html.match(/up (\d+)%/)[1]).ok, "same % discount doesn't undo an increase");
  }
});

test("balance: formatting and solving", () => {
  assert.equal(B.fmt({ x: 2, n: 3 }), "2x + 3");
  assert.equal(B.fmt({ x: 1, n: -3 }), "x − 3");
  assert.equal(B.fmt({ x: 0, n: -4 }), "−4");
  assert.equal(B.fmt({ x: 0, n: 0 }), "0");
  assert.ok(B.isSolved({ x: 1, n: 0 }, { x: 0, n: 4 }));
  assert.ok(B.isSolved({ x: 0, n: 4 }, { x: 1, n: 0 }));
  assert.ok(!B.isSolved({ x: 1, n: 1 }, { x: 0, n: 4 }));
});

test("balance: operations keep or break equality as expected", () => {
  const start = [
    { x: 2, n: 3 },
    { x: 0, n: 11 },
  ];
  const fair = B.apply(start, { type: "remove", item: "unit", side: "both" });
  assert.deepEqual(fair.pans, [
    { x: 2, n: 2 },
    { x: 0, n: 10 },
  ]);
  const cheat = B.apply(start, { type: "remove", item: "unit", side: "left" });
  assert.notEqual(B.value(cheat.pans[0], 4), B.value(cheat.pans[1], 4));
  assert.match(B.apply(start, { type: "remove", item: "x", side: "both" }).error, /right pan has no x-bag/);
  assert.match(B.apply(start, { type: "split", k: 2, side: "both" }).error, /can't be shared/);
  // Balloons: x − 3 = 5. Removing a balloon is impossible (right has none); adding a weight pops one on the left.
  const neg = [
    { x: 1, n: -3 },
    { x: 0, n: 5 },
  ];
  assert.equal(B.apply(neg, { type: "remove", item: "balloon", side: "both" }).missing, "balloon");
  const pop = B.apply(neg, { type: "add", item: "unit", side: "both" });
  assert.deepEqual(pop.pans, [
    { x: 1, n: -2 },
    { x: 0, n: 6 },
  ]);
  assert.deepEqual(pop.popped, [true, false]);
});

test("balance: cheat sheets are wrong, fair sheets are right", () => {
  for (let i = 0; i < RUNS; i++) {
    const a = 2 + (i % 4);
    const X = 2 + (i % 8);
    const b = (i % 2 ? 1 : -1) * (1 + (i % 9));
    for (const cheat of ["sign", "oneSide", "partialSplit", null]) {
      const { lines } = B.sheet(a, b, X, cheat);
      const final = +lines[2].split("=")[1];
      if (cheat) assert.notEqual(final, X, `${cheat}: ${lines.join(" | ")}`);
      else assert.equal(final, X);
    }
  }
});

test("balance: transfer sets", () => {
  for (let i = 0; i < RUNS; i++) checkItems(B.transferItems());
});
