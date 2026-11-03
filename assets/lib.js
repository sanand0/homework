// @ts-check
/**
 * The Mistake Lab — shared helpers for every experiment.
 * No framework: each experiment's index.html holds the markup for its steps; app.js wires behaviour using these helpers.
 * All content passed to innerHTML here is authored by us (never user input).
 */

export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a, b) => (a / gcd(a, b)) * b;
export const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) =>
  arr
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map((p) => p[1]);
export const frac = (n, d) => `<span class="frac" aria-label="${n} over ${d}"><b>${n}</b><b>${d}</b></span>`;
export const rupees = (x) => `₹${Number.isInteger(x) ? x : (+x.toFixed(2)).toString()}`;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** localStorage that silently does nothing in private mode / blocked storage. */
export const storage = {
  get(key, fallback = null) {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

/** Theme toggle. The initial theme is set by an inline <head> script to avoid a flash. */
export function initTheme() {
  const root = document.documentElement;
  for (const btn of $$("[data-theme-toggle]")) {
    const paint = () => {
      const dark = root.dataset.theme === "dark";
      btn.innerHTML = `<i class="bi ${dark ? "bi-sun" : "bi-moon-stars"}" aria-hidden="true"></i>`;
      btn.setAttribute("aria-label", dark ? "Switch to notebook (light) theme" : "Switch to blackboard (dark) theme");
    };
    btn.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      storage.set("lab:theme", root.dataset.theme);
      paint();
    });
    paint();
  }
}

/**
 * Five-step lesson controller.
 * Markup contract: <ol class="stepper"></ol> and <section data-step data-title="Predict" data-icon="bi-lightbulb">…
 * <button data-next disabled>…</button></section>. Steps unlock in order; `complete(i)` enables step i's [data-next].
 * State `{unlocked, done[], data{}, started}` persists in localStorage under `lab:<slug>`; current step lives in `#step=N`.
 * @param {string} slug
 * @param {{onEnter?: (step: number) => void}} [opts]
 */
export function lesson(slug, { onEnter } = {}) {
  const key = `lab:${slug}`;
  const sections = $$("section[data-step]");
  const state = storage.get(key, null) ?? { unlocked: 1, done: [], data: {}, started: Date.now() };
  const stepper = $(".stepper");
  stepper.setAttribute("aria-label", "Progress");
  stepper.innerHTML = sections
    .map(
      (s, i) =>
        `<li><button type="button" data-goto="${i + 1}"><i class="bi ${s.dataset.icon}" aria-hidden="true"></i>${s.dataset.title}</button></li>`,
    )
    .join("");
  const save = () => storage.set(key, state);

  const paint = (current) => {
    $$("button[data-goto]", stepper).forEach((btn, i) => {
      const n = i + 1;
      btn.disabled = n > state.unlocked;
      btn.classList.toggle("done", state.done.includes(n));
      btn.toggleAttribute("aria-current", n === current);
      if (n === current) btn.setAttribute("aria-current", "step");
    });
    sections.forEach((s, i) => {
      const next = $("[data-next]", s);
      if (next) next.disabled = !state.done.includes(i + 1);
    });
  };

  let current = 1;
  const go = (n, { scroll = true } = {}) => {
    current = Math.max(1, Math.min(n, state.unlocked, sections.length));
    sections.forEach((s, i) => {
      const active = i + 1 === current;
      s.classList.toggle("active", active);
      // Re-trigger the entrance animation on each visit.
      if (active)
        $$(".reveal", s).forEach((r) => (r.classList.remove("reveal"), void r.offsetWidth, r.classList.add("reveal")));
    });
    history.replaceState(null, "", `#step=${current}`);
    paint(current);
    if (scroll) window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
    onEnter?.(current);
  };

  const complete = (n) => {
    if (!state.done.includes(n)) state.done.push(n);
    state.unlocked = Math.max(state.unlocked, n + 1);
    save();
    paint(current);
  };

  stepper.addEventListener("click", (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest("[data-goto]");
    if (btn) go(+(/** @type {HTMLElement} */ ((btn).dataset.goto ?? 1)));
  });
  sections.forEach((s, i) => $("[data-next]", s)?.addEventListener("click", () => go(i + 2)));
  $$("[data-restart]").forEach((b) =>
    b.addEventListener("click", () => {
      storage.remove(key);
      location.hash = "";
      location.reload();
    }),
  );

  const fromHash = +(location.hash.match(/step=(\d+)/)?.[1] ?? 0);
  setTimeout(() => go(fromHash || state.unlocked, { scroll: false }));
  return { state, data: state.data, go, complete, save };
}

/** Reusable cartoon characters. Kind: "robot" (Turbo), "shopkeeper" (Dinesh), "monkey" (Gappu). */
export function character(kind) {
  const eyes = (y = 44, dx = 14, r = 8) => `<g class="blink">
    <circle cx="${50 - dx}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${50 + dx}" cy="${y}" r="${r}" fill="#fff"/>
    <circle cx="${52 - dx}" cy="${y + 1}" r="${r / 2}" fill="#1c2230"/><circle cx="${52 + dx}" cy="${y + 1}" r="${r / 2}" fill="#1c2230"/></g>`;
  const parts = {
    robot: `<line x1="50" y1="14" x2="50" y2="4" stroke="#1c2230" stroke-width="3"/><circle cx="50" cy="5" r="5" fill="#e8463c"/>
      <rect x="14" y="14" width="72" height="66" rx="18" fill="#3b82c4" stroke="#1c2230" stroke-width="3"/>
      <rect x="22" y="30" width="56" height="28" rx="12" fill="#cfe6ff"/>${eyes(44, 13, 8)}
      <rect class="mouth" x="36" y="64" width="28" height="8" rx="4" fill="#1c2230"/>
      <rect x="8" y="40" width="7" height="18" rx="3" fill="#2a5f93"/><rect x="85" y="40" width="7" height="18" rx="3" fill="#2a5f93"/>`,
    shopkeeper: `<circle cx="50" cy="54" r="36" fill="#e8a868" stroke="#1c2230" stroke-width="3"/>
      <path d="M18 40 Q50 2 82 40 Z" fill="#8e2b4a" stroke="#1c2230" stroke-width="3"/>${eyes(50, 13, 7)}
      <path d="M34 66 Q42 60 50 66 Q58 60 66 66 Q58 72 50 68 Q42 72 34 66Z" fill="#1c2230"/>
      <ellipse class="mouth" cx="50" cy="76" rx="8" ry="4" fill="#7a2a1c"/>`,
    monkey: `<circle cx="16" cy="48" r="12" fill="#9a6a3c" stroke="#1c2230" stroke-width="3"/><circle cx="84" cy="48" r="12" fill="#9a6a3c" stroke="#1c2230" stroke-width="3"/>
      <circle cx="50" cy="50" r="36" fill="#9a6a3c" stroke="#1c2230" stroke-width="3"/>
      <ellipse cx="50" cy="60" rx="26" ry="22" fill="#e9c79c"/>${eyes(46, 12, 7)}
      <path class="mouth" d="M38 68 Q50 80 62 68 Z" fill="#7a2a1c"/>`,
  };
  return `<svg class="character" viewBox="0 0 100 100" role="img" aria-hidden="true"><g class="bob">${parts[kind]}</g></svg>`;
}

/**
 * Type HTML into a speech bubble character by character. Tap the bubble to finish instantly.
 * @param {Element} bubble
 * @param {string} html
 */
export function say(bubble, html) {
  const who = bubble.closest(".speech")?.querySelector(".character");
  bubble.innerHTML = html;
  bubble.setAttribute("aria-live", "polite");
  if (reducedMotion()) return Promise.resolve();
  const walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push([walker.currentNode, walker.currentNode.textContent ?? ""]);
  nodes.forEach(([n]) => (n.textContent = ""));
  who?.classList.add("talking");
  return new Promise((resolve) => {
    let i = 0;
    let j = 0;
    const finish = () => {
      clearInterval(timer);
      nodes.forEach(([n, t]) => (n.textContent = t));
      who?.classList.remove("talking");
      bubble.removeEventListener("click", finish);
      resolve(undefined);
    };
    const timer = setInterval(() => {
      if (i >= nodes.length) return finish();
      const [node, text] = nodes[i];
      node.textContent = text.slice(0, ++j);
      if (j >= text.length) i++, (j = 0);
    }, 28);
    bubble.addEventListener("click", finish);
  });
}

/**
 * Show feedback. kind: ok | bad | hint.
 * @param {Element} el
 */
export function feedback(el, kind, html) {
  el.className = `feedback ${kind}`;
  el.setAttribute("role", "status");
  el.innerHTML = html;
}

/** Read the checked value of a radio group by name within a root. */
export const radio = (root, name) =>
  /** @type {HTMLInputElement|null} */ ($(`input[name="${name}"]:checked`, root))?.value;

/**
 * True/false claim checker. Claims hide the misconception; each reveals a one-line reason after checking.
 * onDone fires after the first complete check (no dead ends) with the first-try score.
 * @param {Element} root
 * @param {{text: string, answer: boolean, why: string}[]} claims
 * @param {(r: {score: number, total: number, wrong: string[]}) => void} onDone
 */
export function claimChecker(root, claims, onDone) {
  const id = Math.random().toString(36).slice(2, 7);
  root.innerHTML = `<ol class="claims">${claims
    .map(
      (c, i) => `<li><div class="claim-text">${c.text}</div>
      <div class="tf" role="radiogroup" aria-label="True or false">
        <label><input type="radio" name="c${id}${i}" value="true"> True</label>
        <label><input type="radio" name="c${id}${i}" value="false"> False</label>
      </div><div class="why" hidden>${c.why}</div></li>`,
    )
    .join("")}</ol>
    <button class="btn primary" type="button"><i class="bi bi-check2-square" aria-hidden="true"></i> Check my answers</button>
    <div class="feedback"></div>`;
  const items = $$("li", root);
  const fb = $(".feedback", root);
  let first = null;
  $("button", root).addEventListener("click", () => {
    const answers = claims.map((_, i) => radio(root, `c${id}${i}`));
    if (answers.includes(undefined)) return feedback(fb, "hint", "Mark every statement True or False first.");
    const right = claims.map((c, i) => String(c.answer) === answers[i]);
    items.forEach((li, i) => {
      li.classList.toggle("right", right[i]);
      li.classList.toggle("wrong", !right[i]);
      $(".why", li).hidden = false;
    });
    const score = right.filter(Boolean).length;
    if (score === claims.length) feedback(fb, "ok", `All ${score} correct. Read the reasons — they're the big ideas.`);
    else
      feedback(
        fb,
        "bad",
        `${score} of ${claims.length} right. Read the reasons on the red ones, then change your answer.`,
      );
    if (!first) {
      first = { score, total: claims.length, wrong: claims.filter((_, i) => !right[i]).map((c) => c.text) };
      onDone(first);
    }
  });
}

/**
 * Transfer quiz with first-try scoring and misconception-aware feedback.
 * item.type: "number" | "fraction" | "choice". item.check(value) → {ok, msg}. value is a number, [num, den], or option index.
 * After 1 miss the item's msg is shown (diagnosis); after 2 misses a "Show me" button reveals item.show.
 * @param {Element} root
 * @param {Array<{html: string, type: string, options?: string[], prefix?: string, suffix?: string,
 *   check: (v: any) => {ok: boolean, msg?: string}, show: string}>} items
 * @param {(r: {score: number, total: number}) => void} onDone
 */
export function quiz(root, items, onDone) {
  const id = Math.random().toString(36).slice(2, 7);
  root.innerHTML = items
    .map((it, i) => {
      const input =
        it.type === "fraction"
          ? `<span class="frac-input"><input type="number" inputmode="numeric" aria-label="numerator"><hr><input type="number" inputmode="numeric" aria-label="denominator"></span>`
          : it.type === "choice"
            ? `<fieldset class="choices"><legend class="visually-hidden">Options</legend>${it.options
                ?.map((o, k) => `<label><input type="radio" name="q${id}${i}" value="${k}"> <span>${o}</span></label>`)
                .join("")}</fieldset>`
            : `${it.prefix ?? ""}<input type="number" inputmode="decimal" step="any" aria-label="answer">${it.suffix ?? ""}`;
      return `<div class="quiz-item"><span class="badge" aria-hidden="true"></span><p><span class="q-num">Q${i + 1}.</span>${it.html}</p>
        <div class="answer-row">${input}<button class="btn small primary" type="button" data-check>Check</button>
        <button class="btn small ghost" type="button" data-show hidden>Show me</button></div><div class="feedback"></div></div>`;
    })
    .join("");
  let score = 0;
  let finished = 0;
  $$(".quiz-item", root).forEach((el, i) => {
    const it = items[i];
    const fb = $(".feedback", el);
    const badge = $(".badge", el);
    const checkBtn = $("[data-check]", el);
    const showBtn = $("[data-show]", el);
    let misses = 0;
    const end = (firstTry) => {
      checkBtn.disabled = true;
      $$("input", el).forEach((inp) => (inp.disabled = true));
      if (firstTry) score++;
      badge.textContent = firstTry ? "✓" : "↻";
      badge.style.color = firstTry ? "var(--green)" : "var(--amber)";
      if (++finished === items.length) onDone({ score, total: items.length });
    };
    const read = () => {
      const nums = $$("input[type=number]", el).map((x) => /** @type {HTMLInputElement} */ (x).value.trim());
      if (it.type === "choice") return radio(el, `q${id}${i}`) === undefined ? null : +(radio(el, `q${id}${i}`) ?? 0);
      if (nums.some((v) => v === "")) return null;
      return it.type === "fraction" ? nums.map(Number) : Number(nums[0]);
    };
    checkBtn.addEventListener("click", () => {
      const v = read();
      if (v === null) return feedback(fb, "hint", "Enter your answer first.");
      const { ok, msg } = it.check(v);
      if (ok) {
        feedback(fb, "ok", msg ?? "Correct!");
        showBtn.hidden = true;
        return end(misses === 0);
      }
      misses++;
      el.classList.remove("shake");
      void (/** @type {HTMLElement} */ (el).offsetWidth);
      el.classList.add("shake");
      feedback(fb, "bad", msg ?? "Not quite. Try again.");
      if (misses >= 2) showBtn.hidden = false;
    });
    showBtn.addEventListener("click", () => {
      feedback(fb, "hint", it.show);
      showBtn.hidden = true;
      end(false);
    });
  });
}

/**
 * Final report card the student shares with their teacher (Web Share → clipboard fallback).
 * Also marks the experiment complete for the home page.
 * @param {Element} root
 * @param {{slug: string, title: string, rows: [string, string][], note?: string, passed?: boolean}} r
 */
export function reportCard(root, { slug, title, rows, note, passed = true }) {
  const name = storage.get("lab:name", "");
  root.innerHTML = `<div class="report">
    <span class="stamp"${passed ? "" : ' style="color:var(--amber);border-color:var(--amber)"'}>${passed ? "Mistake caught!" : "Getting there"}</span>
    <h3 style="margin-top:12px">${title}</h3>
    <label>Your name and class (for your teacher)<br><input type="text" autocomplete="name" enterkeyhint="done" style="width:100%;margin-top:4px" placeholder="e.g. Priya, 7B"></label>
    <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
    <div class="btn-row"><button class="btn primary" type="button" data-share><i class="bi bi-send" aria-hidden="true"></i> Send to teacher</button>
    <button class="btn ghost" type="button" data-copy><i class="bi bi-clipboard" aria-hidden="true"></i> Copy</button></div>
    <div class="feedback"></div></div>`;
  const input = /** @type {HTMLInputElement} */ ($("input", root));
  input.value = name;
  input.addEventListener("input", () => storage.set("lab:name", input.value));
  const fb = $(".feedback", root);
  const text = () =>
    [
      `The Mistake Lab — ${title}`,
      `Name: ${input.value || "(not given)"}`,
      ...rows.map(([k, v]) => `${k}: ${v.replace(/<[^>]+>/g, "")}`),
      note ? `In my words: ${note}` : "",
      location.href.split("#")[0],
    ]
      .filter(Boolean)
      .join("\n");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      feedback(fb, "ok", "Copied. Paste it in your class WhatsApp group or message to your teacher.");
    } catch {
      feedback(fb, "hint", `Couldn't copy automatically. Take a screenshot of this card instead.`);
    }
  };
  $("[data-copy]", root).addEventListener("click", copy);
  $("[data-share]", root).addEventListener("click", async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: `The Mistake Lab — ${title}`, text: text() });
    } catch {}
  });
  const done = storage.get("lab:done", {});
  done[slug] = rows.find(([k]) => k.startsWith("Transfer"))?.[1].replace(/<[^>]+>/g, "") ?? "done";
  storage.set("lab:done", done);
}

/** Minutes since the lesson started, for the report. */
export const minutesSince = (t) => `${Math.max(1, Math.round((Date.now() - t) / 60000))} min`;

/**
 * Step 5 for any experiment: runs a transfer quiz in #transfer-quiz, then a score + "fresh set" + report card in
 * #transfer-result. Expects L.data.observe / L.data.explain ({score,total}) and L.data.note from earlier steps.
 * makeItems(first) gets true for the first set (so a fixed teacher example can lead), false afterwards.
 * @param {ReturnType<typeof lesson>} L
 * @param {{slug: string, title: string, makeItems: (first: boolean) => any[], prediction: () => string}} opts
 */
export function transferRound(L, { slug, title, makeItems, prediction }) {
  const D = L.data;
  D.sets ??= [];
  const out = $("#transfer-result");
  const start = () => {
    out.innerHTML = "";
    quiz($("#transfer-quiz"), makeItems(D.sets.length === 0), (r) => {
      D.sets.push(`${r.score}/${r.total}`);
      L.complete(5);
      show(r);
    });
  };
  const show = ({ score, total }) => {
    const msg =
      score === total
        ? "Perfect. You can spot the mistake <em>and</em> fix it."
        : score >= total - 1
          ? "Strong work. Read the feedback on the one you missed."
          : "Good effort. Try a fresh set — the numbers change each time.";
    out.innerHTML = `<div class="callout"><span class="score-big">${score}/${total}</span> first try<br>${msg}</div>
      <div class="btn-row" style="margin-bottom:16px"><button class="btn" type="button" data-again><i class="bi bi-shuffle" aria-hidden="true"></i> Try a fresh set</button></div>
      <div data-report></div>`;
    $("[data-again]", out).addEventListener("click", () => {
      start();
      $("#transfer-quiz").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
    });
    const firstTry = (r, what = "") => (r ? `${r.score}/${r.total}${what} first try` : "—");
    /** @type {[string, string][]} */
    const rows = [
      ["My prediction", prediction()],
      ["Observe", firstTry(D.observe)],
      ["Explain", firstTry(D.explain, " statements")],
      ["Transfer (first set)", `${D.sets[0]} first try`],
    ];
    if (D.sets.length > 1) rows.push(["Later sets", D.sets.slice(1).join(", ")]);
    rows.push(["Time", minutesSince(L.state.started)]);
    reportCard($("[data-report]", out), { slug, title, rows, note: D.note, passed: score >= total - 1 });
  };
  start();
}

/**
 * Step 1 for any experiment: a form with radio groups `claim` and `confidence`. Restores saved answers, saves on submit.
 * @param {ReturnType<typeof lesson>} L
 * @param {HTMLFormElement} form
 * @param {string} msg feedback shown after locking in
 */
export function predictStep(L, form, msg) {
  const D = L.data;
  for (const name of ["claim", "confidence"]) {
    const saved = $(`input[name=${name}][value="${D[name]}"]`, form);
    if (saved) /** @type {HTMLInputElement} */ (saved).checked = true;
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    D.claim = radio(form, "claim");
    D.confidence = radio(form, "confidence");
    L.complete(1);
    feedback($(".feedback", form), "ok", msg);
  });
}

/**
 * Step 4 for any experiment: claim checker in #claims plus an optional own-words note in #note (sent to the teacher).
 * @param {ReturnType<typeof lesson>} L
 * @param {{text: string, answer: boolean, why: string}[]} claims
 */
export function explainStep(L, claims) {
  const D = L.data;
  claimChecker($("#claims"), claims, (r) => {
    D.explain = r;
    L.complete(4);
  });
  const note = /** @type {HTMLTextAreaElement} */ ($("#note"));
  note.value = D.note ?? "";
  note.addEventListener("input", () => ((D.note = note.value), L.save()));
}
