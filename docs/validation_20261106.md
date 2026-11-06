# Website validation — 2026-11-06

The website uses the camera-ready evaluation and dataset commit `39ae48ab86048a4c480e224c9a6badfabde79a39`. Presentation changes to the Hugging Face page do not change the scientific data pin.

- The leaderboard's 36 model/split/mode rows, six errors with confidence intervals and counts, and 72 cross-model table values agree with verified paper reproduction outputs.
- The explorers cover 697 evaluation groups, 2,788 participant records and 107 topics. There are 19,258 available model/mode conversations.
- An independent audit checked 773,771 model rows against released sources. Cached text and stance labels are preserved, missing text remains missing, and paired human references stay within their original model evaluation. No cross-session joins or alternate-model human substitutions were found.
- The survey overview uses 708 recorded sessions and 2,640 respondents among 2,832 participant records. Item-specific denominators are retained; this overview is distinct from the 697-group persona index.
- All 12 Python and 4 Node regression tests pass, including export checksums, source comparisons, split masks, joins and invalid request handling.
- The production build passes under Node 22. All 697 session files are included in the API deployment traces; each route traces approximately 83.5 MB including its data and dependencies.
- Browser checks pass at desktop and mobile widths. Split/mode selectors, metric sorting, topic search, persona filters, stage navigation, conversation links and unavailable-output states work. All 28 model/mode combinations return paired data for an available session. No JavaScript errors or page-level horizontal overflow were observed. The leaderboard's wide table scrolls within its own container on mobile.
- The experiment diagram and eight result-figure families load with full-resolution image, PDF and numeric CSV links. Three figures were also checked on the public Hugging Face dataset page.

The website displays the released historical evaluation. It does not resolve the annotation and exact-training-input limitations documented in the reproduction repository. Original recorded responses are retained even when they differ from the usual conditioning convention; stage labels do not replace their text.
