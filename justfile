# The Mistake Lab — static site, no build step.

# Unit tests (maths + generated questions) and link/structure checks
test:
    node --test tests/

# Serve locally at http://localhost:8765
serve:
    uv run -m http.server 8765
