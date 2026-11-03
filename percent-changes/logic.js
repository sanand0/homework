// @ts-check
// Pure maths + transfer-question generation for /percent-changes/. No DOM access.
import { pick, rupees, shuffle } from "../assets/lib.js";

/** Round to paise so 0.1 + 0.2-style float noise never reaches the student. */
export const round2 = (x) => Math.round(x * 100) / 100;
/** Apply a signed percentage change: change(100, 20) = 120, change(120, -20) = 96. */
export const change = (x, pct) => round2(x * (1 + pct / 100));
/** Final value after +up% and −down% in the given order. Multiplication commutes, so order never matters. */
export const upDown = (x, up, down, order = "up") =>
  order === "up" ? change(change(x, up), -down) : change(change(x, -down), up);
/** Discount (%) that exactly undoes an increase of p%: p / (100 + p). */
export const undoDiscount = (p) => round2((100 * p) / (100 + p));
const close = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

const PRICES = [40, 50, 60, 80, 100, 120, 150, 200, 250, 400, 500, 800];
const PCTS = [10, 20, 25, 30, 40, 50];
/** Pick (x, p) such that x·(1 + p%)·(1 − p%) is a whole number of rupees. */
const cleanUpDown = () => {
  for (;;) {
    const x = pick(PRICES);
    const p = pick(PCTS);
    if ((x * (10000 - p * p)) % 10000 === 0) return [x, p];
  }
};

const UPDOWN_CONTEXTS = [
  (x, p) => [
    `Onions cost ${rupees(x)} per kg. In July the price <strong>rose</strong> by ${p}%. In August it <strong>fell</strong> by ${p}%. What is the price in August?`,
    "₹",
    "per kg",
  ],
  (x, p) => [
    `A cricket bat costs ${rupees(x)}. The shop <strong>increases</strong> the price by ${p}%, then announces a ${p}% <strong>off</strong> sale. Sale price?`,
    "₹",
    "",
  ],
  (x, p) => [
    `A village has ${x * 10} people. The population <strong>grows</strong> by ${p}% one year and <strong>falls</strong> by ${p}% the next. Population now?`,
    "",
    "people",
    10,
  ],
  (x, p) => [
    `Petrol costs ${rupees(x)} for a full tank. The price goes <strong>down</strong> ${p}%, then <strong>up</strong> ${p}%. Cost of a full tank now?`,
    "₹",
    "",
  ],
];

/**
 * One randomized transfer set. Every item targets a different face of the same idea:
 * "a percentage is always a percentage OF something, and that something changes."
 */
export function transferItems() {
  // Q1: equal up/down in a new context.
  const [x, p] = cleanUpDown();
  const [q1, pre1, suf1, mult = 1] = pick(UPDOWN_CONTEXTS)(x, p);
  const a1 = upDown(x, p, p) * mult;

  // Q2: reverse a discount. S = P(1 − d%); students tend to add d% of S back.
  const [P, d] = pick([
    [800, 25],
    [600, 20],
    [500, 40],
    [1200, 25],
    [900, 50],
    [750, 20],
    [400, 25],
    [1000, 40],
  ]);
  const S = change(P, -d);
  const item = pick(["school bag", "pair of shoes", "kurta", "geometry box set", "bicycle helmet"]);

  // Q3: single discount vs two stacked discounts that "add up" to the same number.
  const [b, c] = pick([
    [20, 10],
    [10, 20],
    [30, 20],
    [25, 25],
    [40, 10],
    [20, 20],
  ]);
  const opts3 = ["Shop A is cheaper", "Shop B is cheaper", "Both cost the same"];
  const shopB = round2(change(1000, -b) * (1 - c / 100));

  // Q4: what discount undoes an increase?
  const up = pick([25, 50, 100, 20]);

  // Q5: two equal increases (the mirror misconception: +10% +10% = +20%).
  const [start, g, unit, thing] = pick([
    [50, 10, "cm", "A plant is 50 cm tall. It grows 10% one week and 10% the next week."],
    [200, 50, "₹", "A share price is ₹200. It rises 50% in January and 50% again in February."],
    [400, 25, "followers", "A school's page has 400 followers. They grow 25% in May and another 25% in June."],
  ]);
  const a5 = change(change(start, g), g);

  return [
    {
      html: ` ${q1}`,
      type: "number",
      answer: a1,
      prefix: pre1,
      suffix: suf1 && ` ${suf1}`,
      check: (v) =>
        close(v, a1, 0.5)
          ? { ok: true, msg: `Yes! Equal % up and down always lose ${round2((p * p) / 100)}% of the start here.` }
          : close(v, x * mult, 0.5)
            ? {
                ok: false,
                msg: `Back to the start? That's Dinesh's mistake. The second ${p}% is taken from a <em>different</em> amount.`,
              }
            : {
                ok: false,
                msg: `Do it in two steps. First find the new amount after the first change. Then take ${p}% of <em>that</em>.`,
              },
      show: `${pre1}${x * mult} → ${pre1}${change(x, p) * mult} → ${pre1}${a1}. (Or for the “down first” story: ${pre1}${change(x, -p) * mult} in the middle — same answer.)`,
    },
    {
      html: ` After a ${d}% discount, a ${item} costs ${rupees(S)}. What was the price <strong>before</strong> the discount?`,
      type: "number",
      prefix: "₹",
      answer: P,
      check: (v) =>
        close(v, P)
          ? {
              ok: true,
              msg: `Right. ${d}% of ${rupees(P)} is ${rupees(P - S)}, and ${rupees(P)} − ${rupees(P - S)} = ${rupees(S)}.`,
            }
          : close(v, change(S, d))
            ? {
                ok: false,
                msg: `You added ${d}% of ${rupees(S)}. But the discount was ${d}% of the <em>original</em> (bigger) price. Check: is ${d}% off your answer really ${rupees(S)}?`,
              }
            : {
                ok: false,
                msg: `${rupees(S)} is ${100 - d}% of the original price. If ${100 - d}% is ${rupees(S)}, what is 1%? Then 100%?`,
              },
      show: `${rupees(S)} is ${100 - d}% of the price, so 1% = ${rupees(round2(S / (100 - d)))} and 100% = ${rupees(P)}.`,
    },
    {
      html: ` Shop A gives <strong>${b + c}% off</strong>. Shop B gives <strong>${b}% off</strong>, then <strong>another ${c}% off</strong> at the counter. Same ₹1000 item. Which is cheaper?`,
      type: "choice",
      options: opts3,
      answer: 0,
      check: (i) =>
        i === 0
          ? {
              ok: true,
              msg: `Yes. Shop B: ₹1000 → ${rupees(change(1000, -b))} → ${rupees(shopB)}. Shop A: ${rupees(change(1000, -(b + c)))}.`,
            }
          : i === 2
            ? {
                ok: false,
                msg: `${b}% + ${c}% looks like ${b + c}%… but Shop B's second ${c}% is taken from an already-reduced price.`,
              }
            : {
                ok: false,
                msg: `Work out Shop B in two steps from ₹1000. Is the second discount as big in rupees as the first?`,
              },
      show: `Shop A: ${rupees(change(1000, -(b + c)))}. Shop B: ₹1000 → ${rupees(change(1000, -b))} → ${rupees(shopB)}. A is cheaper.`,
    },
    {
      html: ` A price goes <strong>up ${up}%</strong>. What <strong>% discount</strong> brings it back to exactly the original price? <span class="muted">(Round to 1 decimal if needed.)</span>`,
      type: "number",
      suffix: "%",
      answer: undoDiscount(up),
      check: (v) =>
        close(v, undoDiscount(up), 0.5)
          ? { ok: true, msg: `Yes — ${undoDiscount(up)}%. Try it on ₹100: ₹${100 + up} − ${undoDiscount(up)}% = ₹100.` }
          : close(v, up)
            ? {
                ok: false,
                msg: `${up}% of the <em>new, bigger</em> price is too much — you'd end below the start. You need a smaller %.`,
              }
            : {
                ok: false,
                msg: `Try ₹100. It becomes ₹${100 + up}. You need to remove ₹${up}. What % of ₹${100 + up} is ₹${up}?`,
              },
      show: `₹100 → ₹${100 + up}. Remove ₹${up}: ${up} ÷ ${100 + up} × 100 = ${undoDiscount(up)}%.`,
    },
    {
      html: ` ${thing} What is it now?`,
      type: "number",
      prefix: unit === "₹" ? "₹" : "",
      suffix: unit === "₹" ? "" : ` ${unit}`,
      answer: a5,
      check: (v) =>
        close(v, a5, 0.05)
          ? { ok: true, msg: `Yes — ${a5}. The second ${g}% grew from a bigger amount, so it added more.` }
          : close(v, start * (1 + (2 * g) / 100))
            ? {
                ok: false,
                msg: `That's +${2 * g}% in one go. But the second ${g}% is ${g}% of the <em>new</em> amount (${change(start, g)}), not of ${start}.`,
              }
            : { ok: false, msg: `Step by step: ${start} → +${g}% → ? → +${g}% → ?` },
      show: `${start} → ${change(start, g)} → ${a5}.`,
    },
  ];
}

/** Explain-step claims, shuffled per student so answer patterns can't be copied. */
export const claims = () =>
  shuffle([
    {
      text: "The 20% increase and the 20% discount are taken from the same amount.",
      answer: false,
      why: "The increase is 20% of ₹100 (₹20). The discount is 20% of ₹120 (₹24).",
    },
    {
      text: "The discount takes away more rupees because the price is bigger by then.",
      answer: true,
      why: "Same percentage, bigger base → bigger amount. ₹24 > ₹20.",
    },
    {
      text: "Starting with ₹500 instead of ₹100 changes the % you lose.",
      answer: false,
      why: "×1.2 then ×0.8 is always ×0.96, whatever the start. You always lose 4%.",
    },
    {
      text: "Discount first, then increase, ends at the same price.",
      answer: true,
      why: "₹100 → ₹80 → ₹96. Order doesn't matter: ×0.8 ×1.2 = ×1.2 ×0.8.",
    },
    {
      text: "To undo a 20% increase you need a 20% discount.",
      answer: false,
      why: "You must remove ₹20 from ₹120. That's ⅙ ≈ 16.7%, not 20%.",
    },
  ]);
