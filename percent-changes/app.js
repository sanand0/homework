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
  rupees,
  say,
  transferRound,
} from "../assets/lib.js";
import { change, claims, round2, transferItems } from "./logic.js";

initTheme();
$$("[data-character]").forEach((el) => (el.outerHTML = character(/** @type {HTMLElement} */ (el).dataset.character)));

const LINES = {
  intro: `Welcome to <strong>Dhamaka Mart</strong>! This school bag was ₹100. Monday I raised the price <strong>20%</strong>. Today — mega sale — <strong>20% OFF</strong>! <span class="say-math">So you pay ₹100 again.</span> Fair and square, bilkul!`,
  observe: `Arre… so my "fair" sale was ₹4 cheaper than I thought? Okay, okay. Let's see if you really understand it.`,
  transfer: `My cousin runs shops all over town. Help his customers check his offers — and other tricky changes too!`,
};
const L = lesson("percent-changes", {
  onEnter: (step) => {
    const bubble = $(`section[data-step].active [data-say]`);
    if (bubble) say(bubble, LINES[/** @type {HTMLElement} */ (bubble).dataset.say ?? "intro"]);
    if (step === 5 && !$("#transfer-quiz").childElementCount)
      transferRound(L, {
        slug: "percent-changes",
        title: "Percentages: The discount that lies",
        makeItems: transferItems,
        prediction: () =>
          `${{ same: "Back to ₹100", more: "More than ₹100", less: "Less than ₹100" }[D.claim] ?? "—"} (${D.confidence ?? "—"})`,
      });
  },
});
const D = L.data;

predictStep(
  L,
  /** @type {HTMLFormElement} */ ($("#predict-form")),
  "Locked in! Let's go shopping and watch the price tag closely.",
);

// ---------- 2a. Watch the price tag ----------
// Six blocks on a ₹130-wide scale: five equal parts of the price, plus one slot for the 20% increase.
const SCALE = 130;
const bar = $("#pricebar");
bar.innerHTML = `${'<div class="block"></div>'.repeat(6)}<div class="ghost-line" data-label="start ₹100" style="left:${(100 / SCALE) * 100}%"></div>`;
const blocks = $$(".block", bar);
const paintBlocks = (widths, labels, classes = []) =>
  blocks.forEach((b, i) => {
    b.style.width = `${(widths[i] / SCALE) * 100}%`;
    b.textContent = labels[i] ?? "";
    b.className = `block ${classes[i] ?? ""}`;
  });
const tag = $("#tag");
const setTag = (v) => {
  tag.textContent = rupees(v);
  tag.classList.remove("bump");
  void (/** @type {HTMLElement} */ (tag).offsetWidth);
  tag.classList.add("bump");
};
const caption = $("#caption");
paintBlocks([20, 20, 20, 20, 20, 0], ["₹20", "₹20", "₹20", "₹20", "₹20"]);

$("#btn-up").addEventListener("click", (e) => {
  /** @type {HTMLButtonElement} */ (e.currentTarget).disabled = true;
  paintBlocks([20, 20, 20, 20, 20, 20], ["₹20", "₹20", "₹20", "₹20", "₹20", "+₹20"], ["", "", "", "", "", "add"]);
  setTag(120);
  caption.innerHTML = `20% of ₹100 = <strong>₹20</strong>. New price: <strong>₹120</strong>.`;
  /** @type {HTMLButtonElement} */ ($("#btn-down")).disabled = false;
});

$("#btn-down").addEventListener("click", (e) => {
  /** @type {HTMLButtonElement} */ (e.currentTarget).disabled = true;
  // Phase 1: re-cut ₹120 into five equal parts. This regrid IS the insight: 20% now means one-fifth of ₹120.
  paintBlocks([24, 24, 24, 24, 24, 0], ["₹24", "₹24", "₹24", "₹24", "₹24"]);
  caption.innerHTML = `20% off… but 20% <em>of what?</em> Of today's price, ₹120. Cut ₹120 into 5 equal parts: each is <strong>₹24</strong>.`;
  setTimeout(() => {
    paintBlocks([24, 24, 24, 24, 24, 0], ["₹24", "₹24", "₹24", "₹24", "−₹24"], ["", "", "", "", "cut"]);
    setTag(96);
    caption.innerHTML = `20% of ₹120 = <strong>₹24</strong> off. Price now: <strong>₹96</strong>. That's <span class="hl">₹4 less</span> than where we started!`;
    $("#why-form").hidden = false;
  }, 1800);
});

$("#why-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = /** @type {HTMLFormElement} */ (e.target);
  const v = radio(form, "why");
  const fb = $(".feedback", form);
  if (!v) return feedback(fb, "hint", "Pick one.");
  D.whyFirst ??= v;
  if (v !== "base")
    return feedback(fb, "bad", "Both were exactly 20%. Look at the blocks: what was each 20% <em>taken from</em>?");
  feedback(fb, "ok", "Yes! Same 20%, but the discount was taken from ₹120, not ₹100. Bigger base → bigger slice.");
  $("fieldset", form).hidden = true;
  $("button", form).hidden = true;
  $("#lab").hidden = false;
  renderLab();
});

// ---------- 2b. Price lab ----------
const inputs = { price: $("#price"), up: $("#up"), down: $("#down") };
let order = "up";
const found = new Set();
Object.values(inputs).forEach((el) => el.addEventListener("input", renderLab));
$$("[data-order]").forEach((btn) =>
  btn.addEventListener("click", () => {
    order = /** @type {HTMLElement} */ (btn).dataset.order ?? "up";
    $$("[data-order]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    renderLab();
  }),
);

function renderLab() {
  const [P, up, down] = Object.values(inputs).map((el) => +(/** @type {HTMLInputElement} */ (el).value));
  $("#o-price").textContent = rupees(P);
  $("#o-up").textContent = `+${up}%`;
  $("#o-down").textContent = `−${down}%`;
  const steps = order === "up" ? [up, -down] : [-down, up];
  const v1 = change(P, steps[0]);
  const v2 = change(v1, steps[1]);
  const pct = (p) => `<span class="${p >= 0 ? "up" : "down"}">${p >= 0 ? "+" : "−"}${Math.abs(p)}%</span>`;
  const delta = (a, b) => `<span class="arrow">(${b >= a ? "+" : "−"}${rupees(round2(Math.abs(b - a)))})</span>`;
  $("#chain").innerHTML =
    `${rupees(P)} <span class="arrow">→</span> ${pct(steps[0])} ${delta(P, v1)} <span class="arrow">→</span> ${rupees(v1)} <span class="arrow">→</span> ${pct(steps[1])} ${delta(v1, v2)} <span class="arrow">→</span> <strong>${rupees(v2)}</strong>`;

  const max = Math.max(P, v1, v2) * 1.05;
  const w = (v) => `width:${(v / max) * 100}%`;
  const row = (label, from, to) =>
    `<div class="row"><span>${label}</span><div class="bar"><div class="base" style="${w(Math.min(from, to))}">${rupees(to)}</div>${
      to > from
        ? `<div class="plus" style="${w(to - from)}"></div>`
        : to < from
          ? `<div class="minus" style="${w(from - to)}"></div>`
          : ""
    }</div></div>`;
  $("#rows").innerHTML =
    `${row("Start", P, P)}${row(order === "up" ? "After rise" : "After sale", P, v1)}${row("Final", v1, v2)}<div class="start-line" style="--x:${P / max}"></div>`;

  const ratio = round2((v2 / P) * 100);
  $("#verdict").innerHTML =
    ratio === 100
      ? `<span style="color:var(--green)">Back to exactly the start!</span>`
      : `Final is ${ratio}% of the start — ${ratio < 100 ? `<span style="color:var(--red)">${round2(100 - ratio)}% less</span>` : `<span style="color:var(--green)">${round2(ratio - 100)}% more</span>`}.`;

  if (up === 20 && down === 20 && P !== 100) mission("start", `${rupees(P)} → ${rupees(v2)}. Still 4% less!`);
  if (up === 20 && down === 20 && order === "down")
    mission("order", `${rupees(P)} → ${rupees(v1)} → ${rupees(v2)}. Same 96%!`);
  if (up === 50 && down === 50) mission("big", `${rupees(P)} → ${rupees(v2)}. A 25% loss! Bigger % → bigger loss.`);
  if (up === 25 && down === 20) mission("undo", `+25% then −20% = back to start! (20% of 125 = 25)`);
  if (found.size === 4 && !L.state.done.includes(2)) {
    L.complete(2);
    $("#verdict").insertAdjacentHTML(
      "beforeend",
      `<br><span class="hand" style="color:var(--green)">All missions done. Tap the button below!</span>`,
    );
  }
}
function mission(id, text) {
  if (found.has(id)) return;
  found.add(id);
  const li = $(`[data-m="${id}"]`);
  li.classList.add("done", "pop");
  $(".found", li).textContent = text;
}

// ---------- 3. Observe ----------
quiz(
  $("#observe-quiz"),
  [
    {
      html: " Any price, +20% then −20%. The final price is what <strong>% of the start</strong>?",
      type: "number",
      suffix: "%",
      check: (v) =>
        v === 96
          ? { ok: true, msg: "Yes — always 96%. ×1.2 then ×0.8 = ×0.96." }
          : v === 100
            ? { ok: false, msg: "That's Dinesh's idea! What did the price lab show for ₹500?" }
            : v === 4
              ? { ok: false, msg: "4% is what you <em>lose</em>. What % is <em>left</em>?" }
              : { ok: false, msg: "Think of ₹100: it ended at ₹96." },
      show: "96%. ₹100 → ₹120 → ₹96, and the same happens to every starting price.",
    },
    {
      html: " A ₹200 toy goes up 10%, then down 10%. Final price?",
      type: "number",
      prefix: "₹",
      check: (v) =>
        v === 198
          ? { ok: true, msg: "Yes. ₹200 → ₹220 → ₹198. Only 1% lost this time — smaller % change, smaller loss." }
          : v === 200
            ? { ok: false, msg: "Equal % up and down don't cancel. 10% of ₹220 is more than 10% of ₹200." }
            : { ok: false, msg: "Step 1: 10% of ₹200 = ? Step 2: 10% of the new price = ?" },
      show: "₹200 → +₹20 → ₹220 → −₹22 → ₹198.",
    },
    {
      html: " +30% then −30%. The final price is what % of the start?",
      type: "number",
      suffix: "%",
      check: (v) =>
        Math.abs(v - 91) < 0.01
          ? { ok: true, msg: "Yes — 91%. ×1.3 × 0.7 = ×0.91. Bigger swings lose more." }
          : v === 100
            ? { ok: false, msg: "They never cancel! Try it on ₹100." }
            : v === 96
              ? { ok: false, msg: "96% was for 20%. Try ₹100 → +30% → −30%." }
              : { ok: false, msg: "Try ₹100: +30% gives ₹130. 30% of ₹130 = ?" },
      show: "₹100 → ₹130 → ₹130 − ₹39 = ₹91. So 91%.",
    },
  ],
  (r) => {
    D.observe = r;
    L.complete(3);
  },
);

// ---------- 4. Explain ----------
explainStep(L, claims());
