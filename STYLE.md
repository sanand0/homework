# The Mistake Lab — Style guide

Maths homework experiments for CBSE Classes 6–8. Each one starts from a confident, common mistake and lets the student
take it apart. This guide is for the current experiments and every future one. The live component gallery is at
[`/style-guide/`](style-guide/index.html).

## 1. Learning design (the part that matters most)

Every experiment is **one misconception, one surprise, five steps**, 5–10 minutes on a phone.

| Step           | Student does                                                    | Rule                                                                                                |
| -------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1. Predict     | Commits to an answer _and_ a confidence level                   | Never graded. Commitment makes the surprise land. Include the tempting wrong option.                |
| 2. Experiment  | Manipulates a visual model (strips, bars, balance)              | Model must make the truth _visible_ — the student sees the mistake, we don't tell them.             |
| 3. Observe     | States what happened, in numbers, on a _slightly new_ case       | Ask for a value they have not been shown verbatim.                                                  |
| 4. Explain     | Judges true/false claims (+ optional own-words note)            | Claims are the misconception in disguise. Each gets a one-line reason after checking.               |
| 5. Transfer    | Solves fresh, randomized problems in a new context              | Numbers regenerate per attempt. First-try score is what the teacher sees. Feedback names the mistake. |

Principles:

- **A character makes the mistake, not the student.** Students correct Turbo / Dinesh / Gappu. Being wrong is safe because
  the "wrong" voice belongs to someone else, and students who predicted wrongly see they were in good company.
- **Wrong answers get diagnosis, not just "try again".** Detect the specific misconception behind a wrong answer
  (e.g. `a+c / b+d` → "That's Turbo's trick") and say what to look at.
- **Score first tries only.** Retries are allowed and encouraged but don't change the reported score.
- **AI-resistant by design.** Randomized numbers, interactive tasks, and predictions recorded before the reveal. An AI can
  tell a student the answer; it can't do the noticing for them.
- **No dead ends.** Every task has a hint after one miss and a "show me" after two.
- **Report card, not dashboard.** The final step makes a short text summary the student shares (WhatsApp / copy) with
  the teacher: prediction → transfer score, plus their own-words explanation.

## 2. Voice

- Short sentences. Class 6 reading level. Second person ("you"). One idea per line.
- Characters are cheerful and overconfident, never mean. Light Hinglish in character speech is fine ("Arre!", "Bilkul!").
  Instructions stay in plain English.
- Praise the thinking, not the student: "You checked the size of the pieces — that's the key", not "You're smart".
- Feedback format: **what happened → why → what to try**. Max 2 sentences.

## 3. Visual identity — notebook & blackboard

Light theme is a **graph-paper exercise notebook** (cream paper, faint blue grid, red margin rule, teacher's red pen,
highlighter). Dark theme is a **school blackboard** (green-black slate, chalk-white text, chalk-coloured accents). Every
Indian student knows both surfaces; feedback in "red pen" and "green tick" reads instantly.

### Colour tokens (`assets/site.css`)

| Token         | Use                                   | Light     | Dark      |
| ------------- | ------------------------------------- | --------- | --------- |
| `--paper`     | Page background                       | `#f8f4e8` | `#16211c` |
| `--sheet`     | Cards / sheets                        | `#fffdf6` | `#1e2c26` |
| `--ink`       | Body text                             | `#1c2230` | `#eef2ea` |
| `--ink-soft`  | Secondary text                        | `#545b69` | `#a9b6ad` |
| `--pen`       | Primary actions, links, student marks | `#2449a0` | `#94b8ff` |
| `--red`       | Errors, the character's mistake       | `#c8322a` | `#ff8f85` |
| `--green`     | Correct, balanced, true               | `#1d7f46` | `#7edc9e` |
| `--marker`    | Highlights, attention                 | `#f4c430` | `#ffd166` |
| `--line`      | Borders, rules                        | `#ddd5c0` | `#33463c` |

Model colours (consistent across experiments): **blue = the student's / true quantity**, **red = the character's claim**,
**green = added / correct**, **amber = unknown or variable** (x-bags, "?" values).

### Type

- **Bricolage Grotesque** (700/800) — headings, step titles, big numbers.
- **Atkinson Hyperlegible** (400/700) — body, UI, all maths. Designed for legibility; distinguishes `1 l I`, `0 O`.
- **Kalam** (400/700) — handwritten voice: character speech, teacher's red-pen marks. Designed in India; never for
  instructions or numbers students must read precisely.
- Scale: `--step-0` 1rem body (min 16px), `--step-1` 1.25rem, `--step-2` 1.6rem, `--step-3` clamp to 2.4rem.
- Maths: write fractions with `<span class="frac"><b>1</b><b>2</b></span>`; use real minus `−` and `×`, `÷`, `₹`.

### Icons

Bootstrap Icons (`bi bi-*`) from jsDelivr. No emoji in UI. Icons always paired with text or `aria-label`.

### Motion

- One staggered entrance per step (`.reveal` children, `--i` delay). Model changes animate with `transform`, 250–600 ms.
- The "aha" moment gets the biggest motion (strip re-cut, bar regrid, balance tilt). Nothing else competes.
- All motion is disabled under `prefers-reduced-motion`.

## 4. Components

All in `assets/site.css` + `assets/lib.js`. See `/style-guide/` for live examples.

- **Header** `.lab-header` — brand, back link, theme toggle (`[data-theme-toggle]`).
- **Stepper** `.stepper` — five steps; done ✓, current, locked. Driven by `lesson()` in `lib.js`.
- **Sheet** `.sheet` — the notebook page card with margin rule. One per step.
- **Speech** `.speech` — character SVG + Kalam bubble. `.speech.claim` puts the claim in red pen.
- **Choices** `.choices` — radio buttons styled as big tappable cards (min 48px).
- **Confidence** `.confidence` — three-way "Guessing / Fairly sure / Certain".
- **Buttons** `.btn`, `.btn.primary`, `.btn.ghost`, `.btn.small`.
- **Feedback** `.feedback.ok | .bad | .hint` — appears under the task, `aria-live="polite"`.
- **Claims** `.claims` — true/false checker built by `claimChecker()`.
- **Quiz** `.quiz` — transfer items built by `quiz()`: number, fraction, or choice answers, first-try scoring.
- **Missions** `.missions` — checklist that ticks itself as the student explores.
- **Report** `.report` — built by `reportCard()`; share via Web Share API or clipboard.

## 5. Mobile & performance budget

- Works at 320 px wide. Tap targets ≥ 48 px. No hover-only information.
- No frameworks. Per page: shared CSS + one small ES module per experiment. Fonts with `display=swap`.
- Everything works offline after first load except fonts/icons (degrade to system fonts).
- State: current step in the URL hash (`#step=3`), answers in `localStorage` (`lab:<slug>`). No accounts.

## 6. Adding an experiment

1. Copy `add-fractions/` to `<new-slug>/`. Keep `index.html` (markup for the 5 steps) and `app.js` (behaviour);
   put pure maths in `logic.js` and test it in `tests/`.
2. Pick one misconception, one character, one visual model. Write the predict question with the tempting wrong option.
3. Add a card to the home page (`index.html`, `.experiments` list) with `data-slug` so completion shows.
4. Run `just test` (unit tests + link check).
