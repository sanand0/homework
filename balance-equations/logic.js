// @ts-check
// Pure model + transfer generation for /balance-equations/. No DOM access.
// A pan is {x, n}: x = number of x-bags (≥ 0), n = net loose units (n > 0 weights, n < 0 helium balloons that lift 1 each).
import { pick, randInt, shuffle } from "../assets/lib.js";

/** "2x + 3", "x − 3", "−4", "0" */
export function fmt({ x, n }) {
  const xs = x === 0 ? "" : x === 1 ? "x" : `${x}x`;
  if (!xs) return n < 0 ? `−${-n}` : String(n);
  return n === 0 ? xs : `${xs} ${n > 0 ? "+" : "−"} ${Math.abs(n)}`;
}
export const value = ({ x, n }, X) => x * X + n;
export const fmtEq = (L, R) => `${fmt(L)} = ${fmt(R)}`;
/** Solved when one pan holds exactly one x-bag and the other holds no x-bags. */
export const isSolved = (L, R) => (L.x === 1 && L.n === 0 && R.x === 0) || (R.x === 1 && R.n === 0 && L.x === 0);

const ITEM = { unit: "weight", balloon: "balloon", x: "x-bag" };
const SIDE = ["left", "right"];
const MAX_ITEMS = 20;

/**
 * Apply an operation. op = {type: "add"|"remove", item: "unit"|"balloon"|"x", side: "both"|"left"|"right"}
 * or {type: "split", k, side}. Returns {pans, popped} or {error}. popped[i] is true when a weight and a
 * balloon cancelled on pan i (the UI animates this "zero pair").
 */
export function apply([L, R], op) {
  const sides = op.side === "both" ? [0, 1] : [SIDE.indexOf(op.side)];
  const pans = [{ ...L }, { ...R }];
  const popped = [false, false];
  for (const s of sides) {
    const p = pans[s];
    if (op.type === "split") {
      if (p.x % op.k || p.n % op.k)
        return { error: `The ${SIDE[s]} pan (${fmt(p)}) can't be shared equally into ${op.k} groups.` };
      pans[s] = { x: p.x / op.k, n: p.n / op.k };
      continue;
    }
    const sign = op.type === "add" ? 1 : -1;
    if (op.type === "remove") {
      const has = op.item === "x" ? p.x >= 1 : op.item === "unit" ? p.n >= 1 : p.n <= -1;
      if (!has) return { error: `The ${SIDE[s]} pan has no ${ITEM[op.item]} to take off.`, missing: op.item, side: s };
    }
    if (op.item === "x") p.x += sign;
    else {
      const d = op.item === "unit" ? sign : -sign;
      popped[s] = op.type === "add" && Math.sign(p.n) === -Math.sign(d) && p.n !== 0;
      p.n += d;
    }
    if (p.x + Math.abs(p.n) > MAX_ITEMS) return { error: `The ${SIDE[s]} pan is full!` };
  }
  return { pans, popped };
}

/** Human description of an operation for the "balance sheet" history. */
export function describe(op) {
  const where = op.side === "both" ? "both pans" : `the ${op.side} pan only`;
  if (op.type === "split") return `shared ${where} into ${op.k} equal groups, kept one`;
  return `${op.type === "add" ? "added" : "took"} a ${ITEM[op.item]} ${op.type === "add" ? "to" : "off"} ${where}`;
}

// ---------- Transfer ----------

const line = (L, R) => fmtEq(L, R);
const num = (v) => (Number.isInteger(v) ? String(v) : `${Math.round(v * 100) / 100}`);

/** A 3-line "balance sheet" for ax + b = c (b may be negative), optionally with one cheat. */
export function sheet(a, b, X, cheat) {
  const c = a * X + b;
  const lines = [line({ x: a, n: b }, { x: 0, n: c })];
  if (cheat === "sign") {
    lines.push(line({ x: a, n: 0 }, { x: 0, n: c + b }), `x = ${num((c + b) / a)}`);
  } else if (cheat === "oneSide") {
    lines.push(line({ x: a, n: 0 }, { x: 0, n: c }), `x = ${num(c / a)}`);
  } else if (cheat === "partialSplit") {
    lines.push(`x ${b > 0 ? "+" : "−"} ${Math.abs(b)} = ${num(c / a)}`, `x = ${num(c / a - b)}`);
  } else {
    lines.push(line({ x: a, n: 0 }, { x: 0, n: c - b }), `x = ${X}`);
  }
  // The first wrong line is always line 2 (index 1) when there is a cheat.
  return { lines, bad: cheat ? 1 : -1 };
}

const CHEAT_WHY = {
  sign: (b) =>
    `Line 2 is the cheat. To get rid of ${b > 0 ? `+${b}` : `−${-b}`}, you must ${b > 0 ? "take" : "add"} ${Math.abs(b)} ${b > 0 ? "from" : "to"} <em>both</em> sides — Gappu changed the sign the wrong way.`,
  oneSide: (b) =>
    `Line 2 is the cheat. Gappu removed ${b > 0 ? b : `the ${-b} balloons`} from the left only. The right side should change too.`,
  partialSplit: () =>
    `Line 2 is the cheat. Gappu divided the x-term and the right side, but not the loose number. Share <em>everything</em> on both sides.`,
};

function sheetItem(negative) {
  const a = randInt(2, 5);
  const X = randInt(2, 9);
  const b = negative ? -randInt(1, 9) : randInt(1, 9);
  const cheat = pick(negative ? ["sign", "oneSide", "sign", null] : ["sign", "oneSide", "partialSplit", null]);
  const { lines, bad } = sheet(a, b, X, cheat);
  return {
    html: ` Gappu's balance sheet:<br><span class="sheet-lines">${lines.map((l, i) => `<span>${i + 1}. ${l}</span>`).join("")}</span>Where is the <strong>first cheat</strong>?`,
    type: "choice",
    options: ["Line 2", "Line 3", "No cheat — every line is fair"],
    answer: bad === 1 ? 0 : 2,
    check: (i) => {
      const right = bad === 1 ? 0 : 2;
      if (i === right)
        return {
          ok: true,
          msg: cheat
            ? CHEAT_WHY[cheat](b)
            : `Right — all fair. Check: ${a} × ${X} ${b > 0 ? "+" : "−"} ${Math.abs(b)} = ${a * X + b}. ✓`,
        };
      if (i === 1 && cheat)
        return { ok: false, msg: "Line 3 follows from line 2 — but is line 2 itself fair? Compare it with line 1." };
      return {
        ok: false,
        msg: "Find x from line 1 yourself (try small numbers), then test each of Gappu's lines with it.",
      };
    },
    show: cheat ? CHEAT_WHY[cheat](b) : `No cheat. x = ${X} makes every line true.`,
  };
}

export function transferItems() {
  // Solve ax − b = c (negatives). Common errors: sign slip → (c − b)/a.
  const a2 = randInt(2, 6);
  const X2 = randInt(2, 9);
  const b2 = randInt(1, 9);
  const c2 = a2 * X2 - b2;
  // x on both sides: px + q = rx + s, p > r.
  const r3 = randInt(1, 3);
  const p3 = r3 + randInt(1, 3);
  const X3 = randInt(2, 8);
  const q3 = randInt(1, 9);
  const s3 = (p3 - r3) * X3 + q3;
  // Which move keeps the balance level?
  const a5 = randInt(2, 5);
  const b5 = randInt(2, 9);
  const c5 = a5 * randInt(2, 6) + b5;
  const moves = shuffle([
    { t: `Take ${b5} from the left side only`, ok: false, why: "Then the left is lighter — the balance tips." },
    { t: `Take ${b5} from both sides`, ok: true, why: `Yes: ${a5}x = ${c5 - b5}.` },
    {
      t: `Divide only the ${a5}x by ${a5}`,
      ok: false,
      why: `You must divide <em>everything</em> on both sides, including the ${b5}.`,
    },
    {
      t: `Add ${b5} to the right side`,
      ok: false,
      why: `That's “move it across” with the wrong sign — the right side gets heavier.`,
    },
  ]);
  return [
    sheetItem(false),
    {
      html: ` Solve: <span class="math">${fmtEq({ x: a2, n: -b2 }, { x: 0, n: c2 })}</span>. x = ?`,
      type: "number",
      answer: X2,
      check: (v) =>
        v === X2
          ? {
              ok: true,
              msg: `Yes. Add ${b2} to both sides: ${a2}x = ${c2 + b2}, so x = ${X2}. Check: ${a2} × ${X2} − ${b2} = ${c2} ✓`,
            }
          : Math.abs(v - (c2 - b2) / a2) < 0.01
            ? {
                ok: false,
                msg: `Sign slip! The −${b2} is like ${b2} balloons. To cancel them, <em>add</em> ${b2} weights to both sides.`,
              }
            : {
                ok: false,
                msg: `Put your answer back in: does ${a2} × ${v} − ${b2} equal ${c2}? First cancel the −${b2}, then share.`,
              },
      show: `${a2}x − ${b2} = ${c2} → add ${b2} to both → ${a2}x = ${c2 + b2} → x = ${X2}.`,
    },
    {
      html: ` Solve: <span class="math">${fmtEq({ x: p3, n: q3 }, { x: r3, n: s3 })}</span>. x = ?`,
      type: "number",
      answer: X3,
      check: (v) =>
        v === X3
          ? {
              ok: true,
              msg: `Yes. Take ${r3 === 1 ? "x" : `${r3}x`} off both: ${fmtEq({ x: p3 - r3, n: q3 }, { x: 0, n: s3 })}, so x = ${X3}.`,
            }
          : Math.abs(v - (s3 - q3) / (p3 + r3)) < 0.01
            ? {
                ok: false,
                msg: `Did you <em>add</em> the x-terms? Taking ${r3 === 1 ? "x" : `${r3}x`} from both sides leaves ${p3 - r3 === 1 ? "x" : `${p3 - r3}x`} on the left.`,
              }
            : {
                ok: false,
                msg: `Test it: put x = ${v} into both sides. Are they equal? Start by taking the x-bags off the right pan (and the same from the left).`,
              },
      show: `Take ${r3}x off both → ${fmtEq({ x: p3 - r3, n: q3 }, { x: 0, n: s3 })} → take ${q3} off both → ${fmtEq({ x: p3 - r3, n: 0 }, { x: 0, n: s3 - q3 })} → x = ${X3}.`,
    },
    sheetItem(true),
    {
      html: ` For <span class="math">${fmtEq({ x: a5, n: b5 }, { x: 0, n: c5 })}</span>, which move keeps the balance level?`,
      type: "choice",
      options: moves.map((m) => m.t),
      answer: moves.findIndex((m) => m.ok),
      check: (i) => ({ ok: moves[i].ok, msg: moves[i].why }),
      show: `Take ${b5} from both sides → ${a5}x = ${c5 - b5}.`,
    },
  ];
}

export const claims = () =>
  shuffle([
    {
      text: "Whatever you do to one side, you must do to the other.",
      answer: true,
      why: "Otherwise the balance tips — the two sides are no longer equal.",
    },
    { text: "x − 3 = 5 means x = 5 − 3.", answer: false, why: "x is 3 more than 5. Add 3 to both sides: x = 8." },
    {
      text: "Adding a balloon (−1) to both pans has the same effect as taking a weight off both pans.",
      answer: true,
      why: "Both make each side 1 lighter, so it stays level.",
    },
    {
      text: "To halve 2x + 4 = 10, you can halve just the 2x and the 10.",
      answer: false,
      why: "Halve everything: x + 2 = 5. Halving only part of a side is a cheat.",
    },
    {
      text: "“Move it across and change the sign” is a shortcut for doing the same thing to both sides.",
      answer: true,
      why: "+3 “moves” as −3 because you took 3 off both sides.",
    },
  ]);
