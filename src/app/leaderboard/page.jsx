import fs from "fs";
import path from "path";
import LeaderboardTable from "../../components/LeaderboardTable";
import LeaderboardHeader from "../../components/LeaderboardHeader";

const versions = [
  {
    key: "v2",
    label: "Simulation Mode 1: Next Message Prediction (v2)",
  },
  {
    key: "v1",
    label: "Simulation Mode 2: Tweet-guided Conversation Simulation (v1)",
  },
  {
    key: "v0",
    label: "Simulation Mode 3: Full Conversation Simulation (v0)",
  },
];

const modelNames = [
  "gpt-4o-mini-2024-07-18",
  "Llama-3.1-Tulu-3-8B-SFT",
  "Llama-3.1-8B-Instruct",
  "Llama-3.1-70B-Instruct",
  "Mistral-7B-Instruct-v0.3",
  "Qwen2.5-32B-Instruct",
];

const baseMetricsRound = [
  "semantic_similarity_mean",
  "semantic_similarity_bipartite",
  "likert_diff_mean",
  "likert_diff_bipartite",
  "likert_diff_js",
  "n_word_diff_mean",
  "n_word_diff_bipartite",
  "n_word_diff_js",
  "n_word_abs_diff_mean",
  "n_word_abs_diff_bipartite",
  "n_word_abs_diff_js",
  "rouge_1_mean",
  "rouge_2_mean",
  "rouge_L_mean",
  "rouge_L_sum_mean",
  "bleu_mean",
  "rouge_1_bipartite",
  "rouge_2_bipartite",
  "rouge_L_bipartite",
  "rouge_L_sum_bipartite",
  "bleu_bipartite",
  "valid_response_rate",
];

const baseMetricsMessage = [
  "semantic_similarity_mean",
  "likert_diff_mean",
  "n_word_diff_mean",
  "n_word_abs_diff_mean",
  "rouge_1_mean",
  "rouge_2_mean",
  "rouge_L_mean",
  "rouge_L_sum_mean",
  "bleu_mean",
  "valid_response_rate",
];

const metricMapping = {
  semantic_similarity_mean: "semantic_similarity_mean",
  semantic_similarity_bipartite: "semantic_similarity_bipartite",
  likert_diff_mean: "likert_diff_mean",
  likert_diff_bipartite: "likert_diff_bipartite",
  likert_diff_js: "likert_diff_js",
  n_word_diff_mean: "n_word_diff_mean",
  n_word_diff_bipartite: "n_word_diff_bipartite",
  n_word_diff_js: "n_word_diff_js",
  n_word_abs_diff_mean: "n_word_abs_diff_mean",
  n_word_abs_diff_bipartite: "n_word_abs_diff_bipartite",
  n_word_abs_diff_js: "n_word_abs_diff_js",
  rouge_1_mean: "rouge1_mean",
  rouge_2_mean: "rouge2_mean",
  rouge_L_mean: "rougeL_mean",
  rouge_L_sum_mean: "rougeLsum_mean",
  bleu_mean: "bleu_mean",
  rouge_1_bipartite: "rouge1_bipartite",
  rouge_2_bipartite: "rouge2_bipartite",
  rouge_L_bipartite: "rougeL_bipartite",
  rouge_L_sum_bipartite: "rougeLsum_bipartite",
  bleu_bipartite: "bleu_bipartite",
};

const filterType = "none"; // Keep in sync with table_creation.py

function csvPath(relative) {
  return path.join(process.cwd(), relative);
}

function safeReadFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch (e) {
    console.warn("Failed to read", filePath, e);
    return null;
  }
}

function parseCsv(text) {
  if (!text) return [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",");
  return lines
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const cells = line.split(",");
      const row = {};
      headers.forEach((h, idx) => {
        const raw = cells[idx] ?? "";
        const num = Number(raw);
        row[h] = Number.isNaN(num) ? raw : num;
      });
      return row;
    });
}

function loadCsvData(version) {
  const file = csvPath(
    path.join( `llm_report_${version}_depth.csv`)
  );
  const text = safeReadFile(file);
  if (!text) return { message: {}, round: {} };

  const rows = parseCsv(text);
  const messageScores = {};
  const roundScores = {};

  for (const row of rows) {
    const type = String(row.type || "");
    const model = row.model;
    const score = row.score;
    if (!model || typeof score !== "number") continue;

    if (type.endsWith("_message")) {
      const metricName = type.replace("_message", "") + "_mean";
      if (!messageScores[model]) messageScores[model] = {};
      messageScores[model][metricName] = score;
    } else if (type.endsWith("_round")) {
      if (/_round_.*_/.test(type)) continue;
      const metricName = type.replace("_round", "") + "_mean";
      if (!roundScores[model]) roundScores[model] = {};
      roundScores[model][metricName] = score;
    }
  }

  return { message: messageScores, round: roundScores };
}

function loadV3Data(version) {
let rel = path.join(`llm_report_${version}_depth.csv`);
  if (filterType !== "none") {
    rel = path.join(
    //   "..",
    //   "..",
    //   "..",
      `llm_report_${version}_depth_${filterType}.csv`
    );
  }
  const text = safeReadFile(csvPath(rel));
  console.log('text', text);
  if (!text) return { message: {}, round: {} };

  const rows = parseCsv(text);
  const messageScores = {};
  const roundScores = {};

  for (const row of rows) {
    const type = String(row.type || "");
    const model = row.model;
    const score = row.score;
    if (!model || typeof score !== "number") continue;

    if (type.endsWith("_message")) {
      const metricName = type.replace("_message", "") + "_mean";
      if (!messageScores[model]) messageScores[model] = {};
      messageScores[model][metricName] = score;
    } else if (type.endsWith("_round")) {
      if (/_round_.*_/.test(type)) continue;
      const metricName = type.replace("_round", "");
      if (!roundScores[model]) roundScores[model] = {};
      roundScores[model][metricName] = score;
    }
  }

//   console.log('loaded v3 data for version', version, JSON.stringify({ messageScores, roundScores }, null, 2));
  return { message: messageScores, round: roundScores };
}

function mergeWithSelection(v2Data, v3Data, messageSelect, roundSelect) {
  const merged = { message: {}, round: {} };
  const models = new Set([
    ...Object.keys(v2Data.message || {}),
    ...Object.keys(v2Data.round || {}),
    ...Object.keys(v3Data.message || {}),
    ...Object.keys(v3Data.round || {}),
  ]);

  for (const model of models) {
    merged.message[model] = {};
    merged.round[model] = {};

    for (const [targetMetric, source] of Object.entries(messageSelect)) {
      let val = null;
      if (source === "v2") {
        val = v2Data.message?.[model]?.[targetMetric] ?? null;
      } else {
        val = v3Data.message?.[model]?.[targetMetric] ?? null;
      }
      if (typeof val === "number") merged.message[model][targetMetric] = val;
    }

    for (const [targetMetric, source] of Object.entries(roundSelect)) {
      let val = null;
      if (source === "v2") {
        if (targetMetric.endsWith("_mean")) {
          val = v2Data.round?.[model]?.[targetMetric] ?? null;
        }
      } else {
        val = v3Data.round?.[model]?.[targetMetric] ?? null;
      }
      if (typeof val === "number") merged.round[model][targetMetric] = val;
    }
  }

  return merged;
}

function loadValidityData(version) {
  const rel = path.join(`validity_rate_${version}.csv`);
  const text = safeReadFile(csvPath(rel));
  if (!text) return {};
  const rows = parseCsv(text);
  const out = {};
  for (const row of rows) {
    const model = row.model;
    const rate = row.rate_validity;
    if (model && typeof rate === "number") out[model] = rate;
  }
  return out;
}

function buildVersionDataAndValidity() {
  const versionData = {};
  const validityData = {};

  for (const v of ["v2", "v1", "v0"]) {
    const v2 = loadCsvData(v);
    const v3 = loadV3Data(v);
    // console.log('v2 and v3 data for version', v, JSON.stringify({ v2, v3 }, null, 2));

    const messageSelect = {
      semantic_similarity_mean: "v3",
      likert_diff_mean: "v3",
      rouge1_mean: "v3",
      rouge2_mean: "v3",
      rougeL_mean: "v3",
      rougeLsum_mean: "v3",
      bleu_mean: "v3",
      n_word_diff_mean: "v3",
      n_word_abs_diff_mean: "v3",
    };

    const roundSelect = {
      semantic_similarity_mean: "v3",
      semantic_similarity_bipartite: "v3",
      likert_diff_mean: "v3",
      likert_diff_bipartite: "v3",
      likert_diff_js: "v3",
      n_word_diff_mean: "v3",
      n_word_diff_bipartite: "v3",
      n_word_diff_js: "v3",
      n_word_abs_diff_mean: "v3",
      n_word_abs_diff_bipartite: "v3",
      n_word_abs_diff_js: "v3",
      rouge1_mean: "v3",
      rouge2_mean: "v3",
      rougeL_mean: "v3",
      rougeLsum_mean: "v3",
      bleu_mean: "v3",
      rouge1_bipartite: "v3",
      rouge2_bipartite: "v3",
      rougeL_bipartite: "v3",
      rougeLsum_bipartite: "v3",
      bleu_bipartite: "v3",
    };

    versionData[v] = mergeWithSelection(v2, v3, messageSelect, roundSelect);
    validityData[v] = loadValidityData(v);
  }

  return { versionData, validityData };
}

function buildSections() {
  const { versionData, validityData } = buildVersionDataAndValidity();
  const sections = [];

  const levels = [
    { key: "round", label: "Round Level Metrics", metrics: baseMetricsRound },
    { key: "message", label: "Message Level Metrics", metrics: baseMetricsMessage },
  ];

  console.log('versionData', JSON.stringify(versionData, null, 2));

  for (const level of levels) {
    const subsections = [];
    
    for (const v of versions) {
      const cols = [
        {
          title: "Model",
          dataIndex: "model",
          key: "model",
          fixed: "left",
        },
        ...level.metrics.map((m) => ({
          title:
            m === "valid_response_rate"
              ? "valid_response_rate"
              : m.replace(/_/g, " "),
          dataIndex: m,
          key: m,
        })),
      ];

      const data = modelNames.map((model) => {
        const row = { key: `${level.key}-${v.key}-${model}`, model };
        for (const metric of level.metrics) {
          if (metric === "valid_response_rate") {
            const val = validityData[v.key]?.[model];
            if (typeof val === "number") row[metric] = val.toFixed(2);
          } else {
            const mapped = metricMapping[metric];
            const val =
              versionData[v.key]?.[level.key]?.[model]?.[mapped] ?? null;
            console.log(`Metric: ${metric}, Mapped: ${mapped}, Model: ${model}, Level: ${level.key}, Version: ${v.key}, Val: ${val}`);
            if (typeof val === "number") row[metric] = val.toFixed(2);
          }
        }
        return row;
      });

      subsections.push({
        id: `${level.key}-${v.key}`,
        versionLabel: v.label,
        columns: cols,
        data,
      });
    }

    sections.push({
      id: level.key,
      levelLabel: level.label,
      subsections,
    });
  }

  console.log('Final sections structure:', JSON.stringify(sections, null, 2));
  return sections;
}

export default function Leaderboard() {
  const sections = buildSections();

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <LeaderboardHeader />
      
      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LeaderboardTable sections={sections} />
      </div>
    </main>
  );
}
