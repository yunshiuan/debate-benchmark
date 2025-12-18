# 🏟️ DEBATE: Opinion Dynamics Benchmark

> **A Large-Scale Benchmark for Evaluating Opinion Dynamics in Role-Playing LLM Agents**

DEBATE is a high-fidelity environment designed to evaluate how well role-playing LLM agents (RPLAs) simulate realistic human opinion dynamics. It bridges the gap between multi-agent simulations and empirical human behavior.

---

## 🚀 TL;DR
We provide a dataset of **37,357 messages** from **2,792 U.S.-based participants** across **107 controversial topics**. This repository contains both the evaluation benchmark and the interactive dashboard to visualize agent performance.

---

## Repository Structure
```
debate-benchmark/
├── data/               # Raw and processed benchmark data (37k+ messages)
├── scripts/            # Python scripts for running RPLA simulations
├── evaluation/         # Metrics logic (alignment, belief drift, etc.)
├── public/             # Static assets for the website (images, icons)
├── src/                # Next.js Frontend
│   ├── app/            # Main pages (Home, Leaderboard)
│   ├── components/     # Reusable UI (HeroNav, Citation, Table)
│   └── styles/         # Global CSS / Tailwind config
├── .gitignore
├── package.json        # Frontend dependencies
├── requirements.txt    # Research dependencies (Python)
└── README.md           # The "entry point" for coworkers
```

- data/: Contains the human-ground-truth conversations and belief reports.

- scripts/: Core logic for prompting LLMs to act as specific personas.

- src/app/: The Next.js frontend, including the UW-Madison themed homepage and leaderboard.

- evaluation/: Implementation of multi-level metrics (utterance, individual, and group levels).

---

## 🛠️ Getting Started

### 1. Prerequisites
* **Node.js** (v18+ for the Dashboard)
* **Python 3.9+** (for the Simulation/Evaluation engine)

### 2. Installation
1. First, clone the repository:
```
git clone [https://github.com/your-lab/debate-benchmark.git](https://github.com/your-lab/debate-benchmark.git)
cd debate-benchmark
```

2. Then Setup the Dashboard (Frontend):
```
npm install
npm run dev
```

3. Setup the Python dependencies:
```
pip install -r requirements.txt
```

---

## 🛠️ Development Guide
For coworkers looking to contribute:
* **Adding a Model**: Add a new provider class in `scripts/models/`.
* **Modifying the UI**: Components are built using **Ant Design** and **Tailwind CSS**. Check `src/components/` to update the Nav or Citation sections.
* **Adding Topics**: Update `data/topics.json` with new controversial prompts.

---

## 📜 Citation
If you use this benchmark or codebase in your research, please cite:

```bibtex
@misc{chuang2025debatelargescalebenchmarkroleplaying,
      title={DEBATE: A Large-Scale Benchmark for Role-Playing LLM Agents in Multi-Agent, Long-Form Debates}, 
      author={Yun-Shiuan Chuang and Ruixuan Tu and Chengtao Dai and Smit Vasani and Binwei Yao and Michael Henry Tessler and Sijia Yang and Dhavan Shah and Robert Hawkins and Junjie Hu and Timothy T. Rogers},
      year={2025},
      eprint={2510.25110},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2510.25110}, 
}
```
Contact: yunshiuan.chuang@wisc.edu