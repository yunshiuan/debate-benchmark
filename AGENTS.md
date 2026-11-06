# DEBATE website

## Local commits only; the user pushes

- Never run `git push` (including dry runs), `git send-pack`, `git lfs push`, or equivalent remote repository writes, publishing, or deployment actions. The user reviews local commits and pushes personally. Earlier push authorization is revoked.
- Never set or use `DEBATE_REVIEWED_PUSH`, bypass hooks with `--no-verify` or `core.hooksPath`, remove/disable the guard, or hide a push inside scripts, tools, or CI. Read-only remote checks remain allowed.
- Local edits, checks, and explicitly authorized local commits remain allowed. Stop at the local commit and report it for review.
- The local push guard is installed with `python3 .githooks/install.py`. See [.githooks/README.md](.githooks/README.md) for the user's manual-review workflow.

- Read the relevant source before editing. Preserve the current scientific data pin and public-facing terminology.
- `src/app/leaderboard/page.jsx` reads `public/release/leaderboard.json`; regenerate it with `scripts/build_leaderboard.py` from verified paper outputs.
- The conversation, persona and topic explorers use `src/components/ExplorerClient.jsx`, `src/lib/explorerData.mjs` and `data/explorers/`. Regenerate exports with `scripts/build_explorer_data.py`; see README for required arguments.
- Preserve model-specific human references, source-specific masks, missing outputs and session-local participant identities. Do not replace missing model text with human responses or silently rescore cached labels.
- The survey overview and evaluation inventory have distinct denominators. Use the recorded manifests and validation reports when changing counts.
- Use Node 22. Run `npm test` and `npm run build` for data or application changes. Browser-check affected interactions and mobile layout.
- Keep original research data licenses with derived exports. Keep credentials, build caches and temporary screenshots out of Git.
- Production is configured to deploy from `main` through Vercel. Only the user pushes or initiates deployment; after the user publishes, agents may verify production with read-only checks.
