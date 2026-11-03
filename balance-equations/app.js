// @ts-check
import {
  $,
  $$,
  character,
  explainStep,
  feedback,
  initTheme,
  lesson,
  predictStep,
  quiz,
  radio,
  say,
  transferRound,
} from "../assets/lib.js";
import { apply, claims, describe, fmt, fmtEq, isSolved, transferItems, value } from "./logic.js";

initTheme();
$$("[data-character]").forEach((el) => (el.outerHTML = character(/** @type {HTMLElement} */ (el).dataset.character)));

const LINES = {
  intro: `Hee hee! I'm <strong>Gappu</strong>. I solve equations super fast. Watch: <span class="say-math">2x + 3 = 11</span> — I just throw away the 3! So x = 5.5. Easy peasy!`,
  observe: `Okay, okay, you caught me once. But I'm sneaky! Can you spot my cheats <em>without</em> a balance?`,
  transfer: `Last chance! I've hidden cheats in some of these. And some are fair… or are they?`,
};
const L = lesson("balance-equations", {
  onEnter: (step) => {
    const bubble = $(`section[data-step].active [data-say]`);
    if (bubble) say(bubble, LINES[/** @type {HTMLElement} */ (bubble).dataset.say ?? "intro"]);
    if (step === 2) draw();
    if (step === 5 && !$("#transfer-quiz").childElementCount)
      transferRound(L, {
        slug: "balance-equations",
        title: "Equations: The balance-sheet cheat",
        makeItems: transferItems,
        prediction: () =>
          `${{ yes: "Gappu is right, x = 5.5", less: "x is less than 5.5", more: "x is more than 5.5", unsure: "Not sure" }[D.claim] ?? "—"} (${D.confidence ?? "—"})`,
      });
  },
});
const D = L.data;

predictStep(
  L,
  /** @type {HTMLFormElement} */ ($("#predict-form")),
  "Locked in! Now let's put 2x + 3 = 11 on a real balance.",
);

// ---------- Balance view ----------
// Tilt uses container-query units (cqw) so the same markup works for the live balance and static mini balances.
const STRINGS = `<svg class="strings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0 L4 100 M50 0 L96 100" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" fill="none"/></svg>`;
const SKELETON = `<div class="post"></div><div class="foot"></div>
  <div class="pan left">${STRINGS}<div class="items"></div><div class="plate"></div></div>
  <div class="pan right">${STRINGS}<div class="items"></div><div class="plate"></div></div>
  <div class="beam"></div><div class="pivot"></div>`;

const itemsHTML = ({ x, n }, X, reveal, popped) =>
  `<span class="bag${reveal ? " open" : ""}">${reveal ? X : "x"}</span>`.repeat(x) +
  '<span class="unit"></span>'.repeat(Math.max(n, 0)) +
  '<span class="balloon"></span>'.repeat(Math.max(-n, 0)) +
  (popped ? '<span class="unit popping"></span><span class="balloon popping"></span>' : "");

/** Paint pans onto a balance root (built with SKELETON). Heavier side goes down. */
function paint(root, [Lp, Rp], X, { reveal = false, popped = [false, false] } = {}) {
  const angle = Math.max(-12, Math.min(12, (value(Rp, X) - value(Lp, X)) * 3));
  root.style.setProperty("--angle", `${angle}deg`);
  root.style.setProperty("--s", String(Math.sin((angle * Math.PI) / 180)));
  $$(".items", root).forEach((el, i) => (el.innerHTML = itemsHTML([Lp, Rp][i], X, reveal, popped[i])));
}
const eqHTML = ([Lp, Rp], X) =>
  `${fmt(Lp)} ${value(Lp, X) === value(Rp, X) ? "=" : '<span class="neq">≠</span>'} ${fmt(Rp)}`;
/** Static mini balance for feedback messages. */
function mini(pans, X, reveal = false) {
  const div = document.createElement("div");
  div.className = "balance mini";
  div.innerHTML = SKELETON;
  paint(div, pans, X, { reveal });
  return `${div.outerHTML}<p class="eq-display">${eqHTML(pans, X)}</p>`;
}

// ---------- 2. Experiment ----------
const PUZZLES = {
  one: {
    pans: [
      { x: 2, n: 3 },
      { x: 0, n: 11 },
    ],
    X: 4,
  },
  two: {
    pans: [
      { x: 1, n: -3 },
      { x: 0, n: 5 },
    ],
    X: 8,
  },
};
const balance = $("#balance");
balance.innerHTML = SKELETON;
const ledger = $("#ledger");
const toolFb = $("#tool-fb");
let stage = "one";
let pans = PUZZLES.one.pans;
let X = PUZZLES.one.X;
let history = [];
let solved = false;

function draw(popped = [false, false]) {
  paint(balance, pans, X, { reveal: solved, popped });
  $("#eq").innerHTML = eqHTML(pans, X);
  if (popped.some(Boolean)) setTimeout(() => paint(balance, pans, X, { reveal: solved }), 800);
}
const ledgerLine = (how = "", bad = false) =>
  ledger.insertAdjacentHTML(
    "beforeend",
    `<li><span class="${bad ? "bad" : ""}">${fmtEq(...pans)}</span><span class="how">${how}</span></li>`,
  );
const setTools = (on) => ($("#toolbox").hidden = !on);

function load(name) {
  ({ pans, X } = structuredClone(PUZZLES[name]));
  stage = name;
  history = [];
  solved = false;
  ledger.innerHTML = "";
  ledgerLine("start");
  feedback(toolFb, "", "");
  setTools(true);
  draw();
}

function doOp(op) {
  const r = apply(pans, op);
  if (r.error) {
    const tip =
      r.missing === "balloon"
        ? " A weight and a balloon cancel out (+1 and −1 make 0). What could you <strong>add</strong> to both pans instead?"
        : r.missing === "unit"
          ? " Could you add the opposite to both pans instead?"
          : op.type === "split"
            ? " Clear away the loose weights or balloons first."
            : "";
    return feedback(toolFb, "hint", r.error + tip);
  }
  history.push(pans);
  pans = r.pans;
  ledgerLine(describe(op));
  feedback(toolFb, "", "");
  if (isSolved(...pans)) solved = true;
  draw(r.popped);
  if (solved) onSolved();
}

$$("[data-op]").forEach((b) =>
  b.addEventListener("click", () => {
    const [type, item] = /** @type {HTMLElement} */ ((b).dataset.op ?? "").split(" ");
    doOp({ type, item, side: "both" });
  }),
);
$$("[data-split]").forEach((b) =>
  b.addEventListener("click", () =>
    doOp({ type: "split", k: +(/** @type {HTMLElement} */ ((b).dataset.split ?? 2)), side: "both" }),
  ),
);
$("#undo").addEventListener("click", () => {
  if (!history.length) return;
  pans = history.pop();
  ledger.lastElementChild?.remove();
  draw();
});

const gappuBubble = $("#gappu-bubble");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function onSolved() {
  setTools(false);
  if (stage === "one") {
    feedback(toolFb, "ok", `Open the bags: <strong>x = 4</strong>! Check: 2 × 4 + 3 = 11 ✓. Gappu said 5.5…`);
    $("#gappu-part").hidden = false;
    await say(gappuBubble, "Hmph. Your way is slow. Watch MY shortcut — I'll just take the 3 off the left…");
    await sleep(600);
    ({ pans, X } = structuredClone(PUZZLES.one));
    solved = false;
    ledger.insertAdjacentHTML(
      "beforeend",
      `<li><span>${fmtEq(...pans)}</span><span class="how">Gappu starts again</span></li>`,
    );
    draw();
    balance.scrollIntoView({ behavior: "smooth", block: "center" });
    for (let i = 0; i < 3; i++) {
      await sleep(700);
      pans = apply(pans, { type: "remove", item: "unit", side: "left" }).pans ?? pans;
      draw();
    }
    ledgerLine("Gappu: took 3 off the left pan only", true);
    await sleep(900);
    await say(gappuBubble, "Ta-da! 2x = 11! … Wait. Why is my balance tipping??");
    $("#repair-form").hidden = false;
  } else {
    feedback(
      toolFb,
      "ok",
      `<strong>x = 8</strong> — not 2! Check: 8 − 3 = 5 ✓. To cancel 3 balloons you <em>add</em> 3 weights to both pans. That's why “−3 moves across as +3”: you added 3 to both sides.`,
    );
    D.experimentMoves = history.length;
    L.complete(2);
  }
}

$("#repair-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = /** @type {HTMLFormElement} */ (e.target);
  const v = radio(form, "fix");
  const fb = $(".feedback", form);
  if (!v) return feedback(fb, "hint", "Pick a fix.");
  D.repairFirst ??= v;
  const before = pans;
  if (v === "halve")
    return feedback(
      fb,
      "bad",
      "Halving 11 gives 5.5 — the right pan would be too light now. What did Gappu do to the left? Do <em>exactly that</em> to the right.",
    );
  const op = { type: v === "right" ? "remove" : "add", item: "unit", side: "right" };
  for (let i = 0; i < 3; i++) {
    pans = apply(pans, op).pans ?? pans;
    draw();
    await sleep(450);
  }
  if (v === "addright") {
    feedback(fb, "bad", "Worse! The right pan got even heavier. Gappu took 3 <em>off</em> the left…");
    await sleep(1400);
    pans = before;
    draw();
    return;
  }
  ledgerLine("you: took 3 off the right pan too");
  feedback(
    fb,
    "ok",
    "Level again! <strong>2x = 8</strong>, so x = 4, not 5.5. Gappu's cheat: he changed only one side, so the sides stopped being equal.",
  );
  say(
    gappuBubble,
    "Okay, okay… same thing to both sides. Fine! But my next puzzle has <strong>balloons</strong>. Hee hee!",
  );
  $("fieldset", form).hidden = true;
  $("button", form).hidden = true;
  $("#to-balloons").hidden = false;
});

$("#to-balloons").addEventListener("click", () => {
  $("#gappu-part").hidden = true;
  $("#stage-title").textContent = "Balloons pull up: x − 3 = 5";
  $("#stage-text").innerHTML =
    `Each red balloon lifts its pan by 1 — it acts like <strong>−1</strong>. Gappu says: “Move the 3 across: x = 5 − 3 = <strong>2</strong>.” Find x on the balance.`;
  load("two");
  $("#stage-title").scrollIntoView({ behavior: "smooth" });
});
load("one");

// ---------- 3. Observe ----------
const O = 5; // x in 5x − 4 = 3x + 6
const FAIR = ["Fair — still balanced", "Cheat — the balance tips"];
quiz(
  $("#observe-quiz"),
  [
    {
      html: ` Line 2: <span class="math">2x − 4 = 6</span><br><span class="muted">Gappu took 3 bags off both pans.</span>`,
      type: "choice",
      options: FAIR,
      check: (i) =>
        i === 0
          ? {
              ok: true,
              msg: `Fair — same thing to both pans.${mini(
                [
                  { x: 2, n: -4 },
                  { x: 0, n: 6 },
                ],
                O,
              )}`,
            }
          : { ok: false, msg: "He took 3 bags from <em>both</em> pans. Does that change which side is heavier?" },
      show: `Fair. ${mini(
        [
          { x: 2, n: -4 },
          { x: 0, n: 6 },
        ],
        O,
      )}`,
    },
    {
      html: ` Line 3: <span class="math">2x = 6</span><br><span class="muted">Gappu took the 4 balloons off the left pan.</span>`,
      type: "choice",
      options: FAIR,
      check: (i) =>
        i === 1
          ? {
              ok: true,
              msg: `Caught him! Without its balloons the left pan sinks.${mini(
                [
                  { x: 2, n: 0 },
                  { x: 0, n: 6 },
                ],
                O,
              )}`,
            }
          : {
              ok: false,
              msg: "Balloons lift. If you take 4 balloons off the left pan only, what happens to the left pan?",
            },
      show: `Cheat. ${mini(
        [
          { x: 2, n: 0 },
          { x: 0, n: 6 },
        ],
        O,
      )}`,
    },
    {
      html: ` Repair Gappu's line 3. From <span class="math">2x − 4 = 6</span>, what should come next?`,
      type: "choice",
      options: ["2x = 10", "2x = 2", "2x = 6"],
      check: (i) =>
        i === 0
          ? {
              ok: true,
              msg: `Yes. Add 4 weights to <em>both</em> pans: the balloons pop on the left, and the right becomes 10.${mini(
                [
                  { x: 2, n: 0 },
                  { x: 0, n: 10 },
                ],
                O,
              )}`,
            }
          : i === 1
            ? {
                ok: false,
                msg: "That moves −4 across as −4. To cancel balloons you <em>add</em> weights — to both pans.",
              }
            : { ok: false, msg: "That's Gappu's cheat — only the left side changed." },
      show: `2x = 10. ${mini(
        [
          { x: 2, n: 0 },
          { x: 0, n: 10 },
        ],
        O,
      )}`,
    },
    {
      html: ` Line 4: <span class="math">x = 5</span><br><span class="muted">Gappu shared both pans into 2 equal groups and kept one.</span>`,
      type: "choice",
      options: FAIR,
      check: (i) =>
        i === 0
          ? {
              ok: true,
              msg: `Fair! Check in the first line: 5 × 5 − 4 = 21 and 3 × 5 + 6 = 21 ✓${mini(
                [
                  { x: 1, n: 0 },
                  { x: 0, n: 5 },
                ],
                O,
                true,
              )}`,
            }
          : { ok: false, msg: "He halved <em>everything</em> on both sides: 2x → x and 10 → 5. Is that fair?" },
      show: `Fair. ${mini(
        [
          { x: 1, n: 0 },
          { x: 0, n: 5 },
        ],
        O,
        true,
      )}`,
    },
  ],
  (r) => {
    D.observe = r;
    L.complete(3);
  },
);

// ---------- 4. Explain ----------
explainStep(L, claims());
