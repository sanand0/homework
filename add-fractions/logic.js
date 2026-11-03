// @ts-check
// Pure maths + transfer-question generation for /add-fractions/. No DOM access, so it is unit-testable in Node.
import { frac, gcd, lcm, pick, randInt, shuffle } from "../assets/lib.js";

/** a/b == c/d (cross-multiplication, so any equivalent form is accepted). */
export const sameValue = ([a, b], [c, d]) => b !== 0 && d !== 0 && a * d === b * c;

/** a/b + c/d in lowest terms. */
export const addFrac = (a, b, c, d) => {
  const n = a * d + c * b;
  const m = b * d;
  const g = gcd(n, m);
  return [n / g, m / g];
};

/** Name the misconception behind a wrong answer to a/b + c/d. Returns null if the answer is right. */
export function diagnose(a, b, c, d, [n, m]) {
  if (sameValue([n, m], addFrac(a, b, c, d))) return null;
  if (n === a + c && m === b + d)
    return `That's Turbo's trick — adding tops and bottoms. Is your answer even bigger than ${frac(a, b)}?`;
  if (m % b === 0 && m % d === 0 && n === a + c)
    return `Good piece size (${m}ths)! But re-count: ${frac(a, b)} is ${(a * m) / b} pieces of ${frac(1, m)}, not ${a}.`;
  if (m % b === 0 && m % d === 0)
    return `${frac(1, m)} pieces work. Convert each fraction carefully: ${frac(a, b)} = ?/${m} and ${frac(c, d)} = ?/${m}.`;
  if (m === b + d)
    return `Adding the bottoms gives the wrong piece size. You need a size that both ${b}ths and ${d}ths can be cut into.`;
  return `Not quite. Find a piece size both ${frac(1, b)} and ${frac(1, d)} can be cut into exactly, then count the pieces.`;
}

const DENS = [2, 3, 4, 5, 6, 8, 10, 12];

/** Random a/b + c/d with unlike denominators where neither divides the other, LCD ≤ 24, sum ≤ maxSum. */
export function randomPair(maxSum = 2) {
  for (;;) {
    const [b, d] = shuffle(DENS).slice(0, 2);
    if (b % d === 0 || d % b === 0 || lcm(b, d) > 24) continue;
    const a = randInt(1, b - 1);
    const c = randInt(1, d - 1);
    if (gcd(a, b) === 1 && gcd(c, d) === 1 && a * d + c * b <= maxSum * b * d) return [a, b, c, d];
  }
}

const fractionItem = (html, [a, b, c, d]) => {
  const [n, m] = addFrac(a, b, c, d);
  return {
    html,
    type: "fraction",
    answer: [n, m],
    check: (v) => {
      const msg = diagnose(a, b, c, d, v);
      return msg ? { ok: false, msg } : { ok: true, msg: `Yes! ${frac(a, b)} + ${frac(c, d)} = ${frac(n, m)}.` };
    },
    show: `Use ${frac(1, lcm(b, d))} pieces: ${frac(a, b)} = ${frac((a * lcm(b, d)) / b, lcm(b, d))} and ${frac(c, d)} = ${frac(
      (c * lcm(b, d)) / d,
      lcm(b, d),
    )}. Total ${frac((a * lcm(b, d)) / b + (c * lcm(b, d)) / d, lcm(b, d))}${
      lcm(b, d) === m ? "" : ` = ${frac(n, m)}`
    }.`,
  };
};

const CONTEXTS = [
  (p, q) =>
    `Riya ate ${p} of a pizza. Arjun ate ${q} of the same pizza. What fraction of the pizza did they eat together?`,
  (p, q) => `A water tank was ${p} full. Then ${q} of a tank more was added. How full is it now?`,
  (p, q) => `Meena spent ${p} of an hour on maths and ${q} of an hour on science. How many hours in all?`,
  (p, q) => `A ribbon has ${p} of it painted red and ${q} painted blue. What fraction is painted?`,
];

/**
 * One transfer set. The first set uses the teachers' example (3/4 + 1/6); later sets are fully random,
 * so a copied answer from a friend or a chatbot doesn't help on the next attempt.
 */
export function transferItems(first = true) {
  const [a, b, c, d] = first ? [3, 4, 1, 6] : randomPair();
  const p2 = randomPair();
  const p3 = randomPair(1); // real-world contexts (tank, pizza) can't exceed one whole
  const [e, f, g, h] = randomPair();
  const right = addFrac(e, f, g, h);
  const wrongs = [
    [e + g, f + h],
    [e + g, lcm(f, h)],
    [e * g, f * h],
  ].filter((w, i, all) => !sameValue(w, right) && all.findIndex((x) => sameValue(x, w)) === i);
  const options = shuffle([right, ...wrongs]);
  return [
    {
      html: ` Turbo says ${frac(a, b)} + ${frac(c, d)} = ${frac(a + c, b + d)}. Without working it out — is the real answer more or less than ${frac(a, b)}?`,
      type: "choice",
      answer: 0,
      options: [`More than ${frac(a, b)}`, `Less than ${frac(a, b)}`, `Exactly ${frac(a + c, b + d)}, Turbo is right`],
      check: (i) =>
        i === 0
          ? {
              ok: true,
              msg: `Right. You added something, so it must grow. Turbo's ${frac(a + c, b + d)} is smaller than ${frac(a, b)} — wrong!`,
            }
          : {
              ok: false,
              msg: `Adding ${frac(c, d)} (a positive amount) to ${frac(a, b)} — does the total get bigger or smaller?`,
            },
      show: `More. Adding always makes it bigger, but ${frac(a + c, b + d)} < ${frac(a, b)}. So Turbo is wrong.`,
    },
    fractionItem(` Now work it out: ${frac(a, b)} + ${frac(c, d)} = ?`, [a, b, c, d]),
    fractionItem(` ${frac(p2[0], p2[1])} + ${frac(p2[2], p2[3])} = ?`, p2),
    fractionItem(` ${pick(CONTEXTS)(frac(p3[0], p3[1]), frac(p3[2], p3[3]))}`, p3),
    {
      html: ` Which of these equals ${frac(e, f)} + ${frac(g, h)}?`,
      type: "choice",
      answer: options.findIndex((o) => sameValue(o, right)),
      options: options.map(([x, y]) => frac(x, y)),
      check: (i) => {
        const [x, y] = options[i];
        if (sameValue([x, y], right)) return { ok: true, msg: "Yes!" };
        if (x === e + g && y === f + h) return { ok: false, msg: "That's Turbo's add-the-bottoms trick." };
        if (x === e * g) return { ok: false, msg: "That's multiplying, not adding." };
        return { ok: false, msg: "Right piece size, but count the pieces again after converting both fractions." };
      },
      show: `${frac(right[0], right[1])}. Convert both to ${frac(1, lcm(f, h))} pieces and count.`,
    },
  ];
}
