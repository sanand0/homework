// @ts-check
import {
  $,
  $$,
  character,
  explainStep,
  feedback,
  frac,
  initTheme,
  lesson,
  predictStep,
  quiz,
  radio,
  say,
  shuffle,
  transferRound,
} from "../assets/lib.js";
import { transferItems } from "./logic.js";

initTheme();
$$("[data-character]").forEach((el) => (el.outerHTML = character(/** @type {HTMLElement} */ (el).dataset.character)));

const LINES = {
  intro: `Namaste! I'm <strong>Turbo</strong>, the fastest maths tutor in the galaxy. Fractions are easy — add the tops, add the bottoms! <span class="say-math">½ + ⅓ = ⅖</span>. Done in 0.001 seconds!`,
  observe: `Hmm. My pieces were different sizes… halves and thirds. Is that why my fifths didn't fit?`,
  transfer: `Okay, okay. I've been practising. Check my homework — and do some of your own!`,
};
const L = lesson("add-fractions", {
  onEnter: (step) => {
    const bubble = $(`section[data-step].active [data-say]`);
    if (bubble) say(bubble, LINES[/** @type {HTMLElement} */ (bubble).dataset.say ?? "intro"]);
    if (step === 5 && !$("#transfer-quiz").childElementCount) startTransfer();
  },
});
const D = L.data;
const piece = (l, n, d, cls, label = frac(n, d)) =>
  `<div class="piece ${cls}" style="--l:${l};--w:${n / d}">${label}</div>`;

// ---------- 1. Predict ----------
predictStep(
  L,
  /** @type {HTMLFormElement} */ ($("#predict-form")),
  "Locked in! A scientist doesn't trust a claim — even a confident one. Let's test it.",
);

// ---------- 2. Experiment ----------
const SUM = [5, 6]; // 1/2 + 1/3
const placed = new Set();
const sumTrack = $("#sum-track");
const marker = /** @type {HTMLElement} */ ($("#marker"));
for (const btn of $$("[data-place]")) {
  btn.addEventListener("click", () => {
    const kind = /** @type {HTMLElement} */ (btn).dataset.place;
    placed.add(kind);
    /** @type {HTMLButtonElement} */ (btn).disabled = true;
    // Pieces always sit in order ½ then ⅓, whichever is tapped first.
    sumTrack.innerHTML =
      (placed.has("half") ? piece(0, 1, 2, "half") : "") +
      (placed.has("third") ? piece(placed.has("half") ? 0.5 : 0, 1, 3, "third") : "");
    if (placed.size < 2) return;
    marker.style.setProperty("--x", String(SUM[0] / SUM[1]));
    marker.style.opacity = "1";
    $("#turbo-row").hidden = false;
    $("#turbo-track").innerHTML = piece(0, 2, 5, "turbo");
    $("#compare-form").hidden = false;
  });
}

$("#compare-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = /** @type {HTMLFormElement} */ (e.target);
  const v = radio(form, "cmp");
  const fb = $(".feedback", form);
  if (!v) return feedback(fb, "hint", "Pick one.");
  D.compareFirst ??= v;
  if (v !== "shorter")
    return feedback(
      fb,
      "bad",
      "Look again. Compare the red strip's right edge with where the blue <span class='frac'><b>1</b><b>2</b></span> piece ends.",
    );
  feedback(
    fb,
    "ok",
    `Caught it! Adding <span class="frac"><b>1</b><b>3</b></span> to <span class="frac"><b>1</b><b>2</b></span> should make it <em>longer</em> than <span class="frac"><b>1</b><b>2</b></span>. Turbo's answer is <em>shorter</em>. So <span class="frac"><b>2</b><b>5</b></span> can't be right.`,
  );
  $("fieldset", form).hidden = true;
  $("button", form).hidden = true;
  $("#lab-strips").classList.add("sticky"); // keep the strips in view while using the measure controls
  $("#measure-part").hidden = false;
  $("#measure-row").hidden = false;
  renderMeasure();
});

const SIZES = [4, 5, 6, 8, 10, 12];
let size = 5;
let count = 0;
const exactSizes = new Set();
const fifthsSeen = new Set();
$("#sizes").innerHTML = SIZES.map(
  (d) => `<button class="btn small" type="button" data-size="${d}" aria-pressed="${d === size}">${frac(1, d)}</button>`,
).join("");
$("#sizes").addEventListener("click", (e) => {
  const btn = /** @type {HTMLElement} */ (e.target).closest("[data-size]");
  if (!btn) return;
  size = +(/** @type {HTMLElement} */ ((btn).dataset.size ?? 5));
  count = 0;
  $$("[data-size]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  renderMeasure();
});
$("#plus").addEventListener("click", () => ((count = Math.min(size, count + 1)), renderMeasure()));
$("#minus").addEventListener("click", () => ((count = Math.max(0, count - 1)), renderMeasure()));

function renderMeasure() {
  $("#count").innerHTML = `${count} × ${frac(1, size)}`;
  $("#measure-track").innerHTML = Array.from({ length: count }, (_, i) =>
    piece(i / size, 1, size, "measure", size <= 6 ? frac(1, size) : ""),
  ).join("");
  const diff = count * SUM[1] - SUM[0] * size; // sign of count/size − 5/6
  const status = $("#status");
  status.className = `status ${diff === 0 ? "exact" : diff < 0 ? "short" : "over"}`;
  if (count === 0) status.textContent = "Add some pieces.";
  else if (diff === 0) status.innerHTML = `Exact fit! ${count} pieces of ${frac(1, size)} = ${frac(count, size)}`;
  else status.textContent = diff < 0 ? "Too short — add more." : "Too far — past the red line.";
  if (count && diff === 0) exactSizes.add(size);
  if (size === 5 && (count === 4 || count === 5)) fifthsSeen.add(count);
  const exact = [...exactSizes];
  mission("exact", exact.length >= 1, exact[0] && `${exact[0]}ths: ${frac((SUM[0] * exact[0]) / SUM[1], exact[0])}`);
  mission("second", exact.length >= 2, exact[1] && `${exact[1]}ths: ${frac((SUM[0] * exact[1]) / SUM[1], exact[1])}`);
  mission("fifths", fifthsSeen.size === 2, "No! 4 fifths is short, 5 fifths overshoots. Fifths never fit.");
  if (exact.length >= 2 && fifthsSeen.size === 2 && !L.state.done.includes(2)) {
    D.exactSizes = exact;
    L.complete(2);
    status.innerHTML += `<br><span class="hand" style="color:var(--green)">All missions done. Tap the button below!</span>`;
  }
}
function mission(id, done, text) {
  const li = $(`[data-m="${id}"]`);
  if (!done || li.classList.contains("done")) return;
  li.classList.add("done", "pop");
  $(".found", li).innerHTML = text;
}

// ---------- 3. Observe ----------
function renderCut(k) {
  const pieces = (start, n, d, cls) =>
    k
      ? Array.from({ length: (n * k) / d }, (_, i) => piece(start + i / k, 1, k, cls, k <= 6 ? frac(1, k) : "")).join(
          "",
        )
      : piece(start, n, d, cls);
  $("#cut-track").innerHTML = pieces(0, 1, 2, "half") + pieces(0.5, 1, 3, "third");
  $("#cut-equation").innerHTML = k
    ? `${frac(1, 2)} = <strong style="color:#2f63c4">${frac(k / 2, k)}</strong> &nbsp; and &nbsp; ${frac(1, 3)} = <strong style="color:#1d8a52">${frac(k / 3, k)}</strong>`
    : `${frac(1, 2)} + ${frac(1, 3)} — different-size pieces. Can't count them together yet.`;
}
$$("[data-cut]").forEach((b) =>
  b.addEventListener("click", () => renderCut(+(/** @type {HTMLElement} */ ((b).dataset.cut ?? 0)))),
);
renderCut(0);

quiz(
  $("#observe-quiz"),
  [
    {
      html: ` After cutting into sixths: ${frac(3, 6)} + ${frac(2, 6)} = <strong>?</strong> sixths`,
      type: "number",
      suffix: " sixths",
      check: (v) =>
        v === 5
          ? { ok: true, msg: `Yes, ${frac(5, 6)}. Now the pieces are the same size, so you <em>can</em> add the tops.` }
          : v === 2
            ? {
                ok: false,
                msg: "That's 1 + 1 again. After cutting, how many blue pieces and how many green pieces are there?",
              }
            : { ok: false, msg: "Tap 'Cut into sixths' above and count all the small pieces." },
      show: `3 blue + 2 green = 5 sixths = ${frac(5, 6)}.`,
    },
    {
      html: ` Turbo tries ${frac(1, 3)} + ${frac(1, 4)}. Which piece size can cut <em>both</em> thirds and quarters exactly?`,
      type: "choice",
      options: [`Sevenths ${frac(1, 7)} (3 + 4)`, `Twelfths ${frac(1, 12)}`, `Eighths ${frac(1, 8)}`],
      check: (i) =>
        i === 1
          ? { ok: true, msg: `Yes. 12 splits into 3 equal groups <em>and</em> 4 equal groups.` }
          : i === 0
            ? { ok: false, msg: "That's adding the bottoms again! Can 7 be split into 3 equal groups?" }
            : { ok: false, msg: "Quarters fit into eighths, but can 8 be split into 3 equal groups?" },
      show: `Twelfths: ${frac(1, 3)} = ${frac(4, 12)} and ${frac(1, 4)} = ${frac(3, 12)}.`,
    },
    {
      html: ` So ${frac(1, 3)} + ${frac(1, 4)} = ?`,
      type: "fraction",
      check: ([n, d]) =>
        n * 12 === 7 * d
          ? { ok: true, msg: `${frac(4, 12)} + ${frac(3, 12)} = ${frac(7, 12)}.` }
          : n === 2 && d === 7
            ? { ok: false, msg: "Turbo's trick! Use twelfths: how many twelfths is a third? A quarter?" }
            : { ok: false, msg: `Convert both to twelfths first: ${frac(1, 3)} = ?/12, ${frac(1, 4)} = ?/12.` },
      show: `${frac(4, 12)} + ${frac(3, 12)} = ${frac(7, 12)}.`,
    },
  ],
  (r) => {
    D.observe = r;
    L.complete(3);
  },
);

// ---------- 4. Explain ----------
explainStep(
  L,
  shuffle([
    // shuffled so answer patterns can't be passed around
    {
      text: `The bottom number tells you the <strong>size</strong> of each piece.`,
      answer: true,
      why: `${frac(1, 3)} means 1 piece when a whole is cut into 3 equal parts. Bigger bottom → smaller pieces.`,
    },
    {
      text: `${frac(1, 2)} + ${frac(1, 3)} must be more than ${frac(1, 2)}.`,
      answer: true,
      why: `You're adding something. Turbo's ${frac(2, 5)} is less than ${frac(1, 2)} — that's how you catch the mistake without calculating.`,
    },
    {
      text: `Adding the bottoms is fine when both tops are 1.`,
      answer: false,
      why: `Try ${frac(1, 2)} + ${frac(1, 2)}. Turbo's way gives ${frac(2, 4)}, which is still a half. But half + half is a whole!`,
    },
    {
      text: `You can add the tops once the pieces are the same size.`,
      answer: true,
      why: `${frac(3, 6)} + ${frac(2, 6)} = ${frac(5, 6)} — 5 pieces, each one-sixth.`,
    },
    {
      text: `To add halves and thirds you need a piece size <strong>both</strong> can be cut into.`,
      answer: true,
      why: `Sixths work, and so do twelfths — any number both 2 and 3 divide into.`,
    },
  ]),
);

// ---------- 5. Transfer ----------
function startTransfer() {
  const claimText = {
    yes: "Turbo is right",
    more: "Answer is more than 2/5",
    less: "Answer is less than 2/5",
    unsure: "Not sure",
  };
  transferRound(L, {
    slug: "add-fractions",
    title: "Adding fractions: Catch the confident mistake",
    makeItems: transferItems,
    prediction: () => `${claimText[D.claim] ?? "—"} (${D.confidence ?? "—"})`,
  });
}
