# Prompts

## Three Maths Assignments, 03 Nov 2026

<!--
cd ~/code/homework
claude --model opus --effort medium
-->

<!-- Source: https://chatgpt.com/c/6ae9d4d0-b3fc-83ec-aaa9-04d54e2d5177 -->

```markdown
Build a static HTML/CSS/JS site with three interactive maths homework experiments for CBSE Classes 6–8.

## Goal

Help students **discover and correct misconceptions**, rather than merely practise calculations. The teachers identified specific concepts students struggle with. Each experiment should:

- Make students **predict → experiment → observe → explain → transfer**.
- Create a surprising insight that changes their intuition.
- Take 5–10 minutes, work well on inexpensive mobile phones, and require no login, installation, special equipment, or adult help.
- Assess understanding automatically where possible, especially through fresh transfer problems. Don't confuse repeating a revealed answer with learning.
- Make mistakes safe and interesting, with immediate, constructive feedback.
- Be valuable even when students can consult AI.

## Three experiments

**1. `/add-fractions/` — Catch the confident mistake**

An animated tutor confidently claims `1/2 + 1/3 = 2/5`. Students challenge it using interactive fraction strips or another compelling visual model. They should understand *why* denominators cannot simply be added. Test transfer using a different problem, e.g. `3/4 + 1/6`.

**2. `/percent-changes/` — The discount that lies**

A shop raises a ₹100 price by 20%, then discounts it by 20%. Students predict whether the original price returns, then experiment with different amounts and percentages to discover why the result is ₹96. Address the misconception that equal percentage increases and decreases cancel out. Include unfamiliar transfer problems.

**3. `/balance-equations/` — The balance-sheet cheat**

Students solve equations by manipulating a virtual balance, starting with `2x + 3 = 11`. A mischievous character performs illegal operations, such as changing only one side. Students catch and repair the mistakes. Build intuition for equality, variables, negative signs, and solving equations rather than memorising transposition rules.

## Site structure

The home page (`/`) introduces the collection and links to the three experiments. Each experiment gets a stable, directly accessible URL using a directory with `index.html`.

We'll add many more experiments later. Make the structure easy to extend without creating an elaborate framework. Keep it entirely static and client-side.

## Design freedom

Take full ownership of the interaction design, visuals, storytelling, and implementation. Aim for something students enjoy exploring and teachers would genuinely assign. Prefer conceptual clarity and memorable discoveries over decorative complexity.

Create a style guide first (for current and future use) and apply it.

## Background references

- [GenWise: My Misconception Mentor](https://genwise.in/my-misconception-mentor) — the teachers' existing approach to diagnosing and repairing misconceptions.
- [Existing audio homework example](https://tds-network-games.sanand.workers.dev/audio/?q=maths-at-work) — an earlier experiment in connecting textbook concepts to real life. Inspiration, not a UI template.
- [CBSE Computational Thinking and AI resources](https://cbseacademic.nic.in/ct-ai.html) — broader curriculum context. These experiments teach mathematics, not AI itself.

The intended pilot involves ordinary CBSE teachers assigning these as homework, then checking whether students overcome the misconceptions. Prioritise a convincing, usable first version over analytics, dashboards, accounts, or infrastructure.

Implement the site and run appropriate checks.
```

<!-- claude --resume 88b58e1e-6b62-47fc-95c2-a6a67d5ea2fc -->
