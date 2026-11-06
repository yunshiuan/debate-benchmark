# DEBATE website

- Read the relevant source before editing. Preserve the current scientific data pin and public-facing terminology.
- `src/app/leaderboard/page.jsx` reads `public/release/leaderboard.json`; regenerate it with `scripts/build_leaderboard.py` from verified paper outputs.
- The conversation, persona and topic explorers use `src/components/ExplorerClient.jsx`, `src/lib/explorerData.mjs` and `data/explorers/`. Regenerate exports with `scripts/build_explorer_data.py`; see README for required arguments.
- Preserve model-specific human references, source-specific masks, missing outputs and session-local participant identities. Do not replace missing model text with human responses or silently rescore cached labels.
- The survey overview and evaluation inventory have distinct denominators. Use the recorded manifests and validation reports when changing counts.
- Use Node 22. Run `npm test` and `npm run build` for data or application changes. Browser-check affected interactions and mobile layout.
- Keep original research data licenses with derived exports. Keep credentials, build caches and temporary screenshots out of Git.
- Production deploys automatically from `main` through Vercel. Verify the deployment and relevant production endpoints after publishing.
