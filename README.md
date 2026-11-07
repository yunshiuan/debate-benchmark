# DEBATE benchmark website

The public website for **DEBATE: A Large-Scale Benchmark for Evaluating Opinion Dynamics in Role-Playing LLM Agents**, accepted to the NeurIPS 2026 Main Conference (Evaluations & Datasets Track).

[Website](https://debate-llm-benchmark.vercel.app/) · [Dataset](https://huggingface.co/datasets/seantw/DEBATE_LLM) · [Reproduction and training code](https://github.com/yunshiuan/DEBATE-neurips2026) · [Paper](https://arxiv.org/abs/2510.25110)

This repository contains the Next.js website. Simulation, annotation, SFT preparation/training, and scientific evaluation live in the separate reproduction code repository linked above.

## Run locally

Use Node.js 22 and npm. The exported website data are committed, so a normal build does not download the research archives or call a model API.

```bash
npm ci
npm run dev
```

For the production build and automated checks, also install Python 3.10 or 3.11 with the `python3` command available; `npm test` runs both Node and Python tests:

```bash
npm test
npm run build
npm start
```

## Website sections

- **Model leaderboard:** six stance-prediction errors for seven base LLMs, Llama SFT, and DeGroot; group- and topic-generalization test partitions; Full Dynamics Simulation and Next Message Prediction. The original model order, confidence intervals, and valid observation counts are preserved. Separate cross-model tables compare Base to SFT within Llama, Qwen, and Mistral.
- **Conversation explorer:** recorded human discussions and available generated trajectories from the released experiment caches.
- **Persona explorer:** demographic responses and participant-level conversation views from the released human records.
- **Topic explorer:** discussion statements, their sessions, and initial opinions.

The evaluation inventory covers 2,788 participants in 697 groups across 107 topics. The supplied partition masks contain 708 recorded sessions; availability varies by model and metric. These quantities have different meanings and should not be interchanged.

## Refresh the website data

Use Python 3.10 or 3.11 for the data exporters. First install the public DEBATE reproduction package and download its pinned dataset revision. Follow that repository's README for environment setup.

```bash
debate download --data-root /path/to/debate-data
debate reproduce all --data-root /path/to/debate-data --output-dir /path/to/paper-results
python scripts/build_leaderboard.py --reproduction-root /path/to/paper-results
python scripts/build_explorer_data.py --data-root /path/to/debate-data --demographics /path/to/paper-results/demographics/aggregates.json
```

The leaderboard exporter requires successful numerical verification reports. It copies values directly from the verified CSVs into `public/release/leaderboard.json` and exports the original figure geometry and model order under `public/camera-ready/`. There are 36 model/split/mode rows and six Base→SFT family/split comparisons. `public/release/leaderboard-provenance.json` records SHA-256 hashes of the inputs and figure assets. Use the optional `--experiment-png` argument to replace the experiment diagram with a current paper export.

The explorer exporter writes `data/explorers/index.json`, `demographics.json`, compressed session files under `sessions/`, a dated manifest, and the dataset license. API routes read these exports instead of the older Parquet files. See the script's `--help` for optional output settings. Session availability and data provenance are explicit; missing generations are not filled with results from a different model or experiment.

The scientific inputs are pinned to dataset commit `39ae48ab86048a4c480e224c9a6badfabde79a39`. Presentation-only additions to the dataset card do not change this pin. Do not silently mix experiment versions when refreshing the website.

## Interpretation and provenance

All six leaderboard errors are lower-is-better. The main plots retain the publication's evaluation and metric-specific validity rules. Cross-model SFT comparisons use their respective human references, so absolute scores across those families are not a common-sample ranking. Text-quality panels use retained scored aggregates with different base/SFT populations; they are descriptive comparisons.

The released SFT test partitions also supplied validation loss for checkpoint selection. Historical annotation behavior and missing supporting records are documented in the [reproduction guide](https://github.com/yunshiuan/DEBATE-neurips2026/blob/main/docs/paper_reproduction.md). The website presents the published cached evaluation, not a newly rescored experiment.

Human records, cached model outputs, numeric results, and derived exports remain subject to the [DEBATE Dataset Research-Only License (Non-Commercial, v1.0)](https://huggingface.co/datasets/seantw/DEBATE_LLM/blob/main/LICENSE). Participant keys support record linkage and must not be used for re-identification.

## Source map

- `src/app/`: homepage, leaderboard, explorers, and API routes.
- `src/components/`: shared navigation and presentation components.
- `scripts/`: deterministic website-data exporters.
- `public/camera-ready/`: current paper figures, PDFs, and numeric CSVs.
- `public/release/`: leaderboard data and provenance.
- `data/explorers/`: compact records used by the explorer API routes.

The production website is hosted at https://debate-llm-benchmark.vercel.app/, with automatic Vercel deployment from the `main` branch. Keep credentials and local environment files out of Git.
