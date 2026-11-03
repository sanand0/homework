# The Mistake Lab

Ten-minute maths homework experiments for CBSE Classes 6–8. In each one a confident character makes a classic mistake, and
the student catches it: **predict → experiment → observe → explain → transfer**.

| URL                   | Misconception                                  | Character | Model                      |
| --------------------- | ---------------------------------------------- | --------- | -------------------------- |
| `/add-fractions/`     | ½ + ⅓ = ⅖ (add tops, add bottoms)              | Turbo     | Fraction strips + measuring |
| `/percent-changes/`   | +20% then −20% returns to the start            | Dinesh    | Re-gridding price bar + lab |
| `/balance-equations/` | Changing one side; sign slips; partial halving | Gappu     | Pan balance with balloons  |

Static HTML/CSS/JS. No build, no backend, no accounts. Progress stays in the student's browser; the final report card is
shared by the student (WhatsApp / copy).

## Layout

```
index.html            Home page: experiment cards + teacher notes
STYLE.md              Style guide: learning design, voice, tokens, components, how to add an experiment
style-guide/          Live component gallery
assets/site.css       Shared styles (notebook light theme / blackboard dark theme)
assets/lib.js         Shared behaviour: lesson stepper, characters, say(), claimChecker(), quiz(), reportCard(), …
<slug>/index.html     The five steps' markup
<slug>/app.js         Experiment-specific interaction
<slug>/logic.js       Pure maths + randomized transfer questions (unit-tested)
tests/                node --test: logic + link/structure checks
```

## Run

```sh
just serve   # http://localhost:8765  (ES modules need http://, not file://)
just test    # unit + link tests
```

Deploy by copying the folder to any static host (GitHub Pages, Cloudflare Pages, Netlify). All paths are relative, so it
also works from a sub-path.

## Add an experiment

See [STYLE.md §6](STYLE.md#6-adding-an-experiment). In short: copy an experiment folder, rewrite the five sections and
`logic.js`, add a card with `data-slug` to `index.html`, run `just test`.
