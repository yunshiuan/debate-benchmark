"use client";

import { useState } from "react";
import { Table, Tag, Typography } from "antd";
import LeaderboardHeader from "../../components/LeaderboardHeader";
import leaderboard from "../../../public/release/leaderboard.json";

const { Title, Paragraph } = Typography;
const reproductionUrl = "https://github.com/yunshiuan/DEBATE-neurips2026/blob/main/docs/paper_reproduction.md";
const format = (value) => Number.isFinite(value) ? value.toFixed(3) : "—";

function Choice({ label, value, onChange, options }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-gray-700">{label}</legend>
      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        {options.map(([key, text]) => (
          <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${value === key ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"}`}>
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function PaperFigure({ name, title, caption }) {
  return (
    <figure className="mt-8">
      <Title level={4}>{title}</Title>
      <a href={`/camera-ready/${name}.png`} target="_blank" rel="noopener noreferrer" aria-label={`Open full-resolution ${title}`}>
        <img src={`/camera-ready/${name}.png`} alt={title} loading="lazy" className="h-auto w-full rounded-lg border border-gray-200 bg-white" />
      </a>
      <figcaption className="mt-3 text-sm leading-relaxed text-gray-600">
        {caption}
        <span className="mt-2 flex flex-wrap gap-4">
          <a className="text-[#9B0000] underline" href={`/camera-ready/${name}.png`} target="_blank" rel="noopener noreferrer">Full-resolution image</a>
          <a className="text-[#9B0000] underline" href={`/camera-ready/${name}.pdf`} target="_blank" rel="noopener noreferrer">PDF</a>
          <a className="text-[#9B0000] underline" href={`/camera-ready/${name}.csv`} download>Numeric CSV</a>
        </span>
      </figcaption>
    </figure>
  );
}

export default function Leaderboard() {
  const [partition, setPartition] = useState("group_test");
  const [mode, setMode] = useState("v0");
  const rows = leaderboard.results.filter((row) => row.partition === partition && row.mode === mode);
  const comparison = leaderboard.crossModel.filter((row) => row.partition === partition);
  const figurePrefix = partition === "group_test" ? "group" : "topic";
  const metricColumns = (channel) => leaderboard.metrics.filter((metric) => metric.channel === channel).map((metric) => ({
    title: `${metric.label} ↓`, key: metric.id, width: 140,
    sorter: (a, b) => a.metrics[metric.id].value - b.metrics[metric.id].value,
    render: (_, row) => {
      const result = row.metrics[metric.id];
      return <div className="tabular-nums">
        <div className={`text-base ${row.kind === "sft" ? "font-semibold text-[#9B0000]" : "text-gray-900"}`}>{format(result.value)}</div>
        <div className="text-xs text-gray-500">[{format(result.ciLow)}, {format(result.ciHigh)}]</div>
        <div className="mt-1 text-xs text-gray-500">n = {result.count.toLocaleString()} {metric.countUnit}</div>
      </div>;
    },
  }));
  const mainColumns = [
    { title: "Model", key: "model", fixed: "left", width: 190, render: (_, row) => <div>
      <span className="font-medium">{row.label}</span>
      <div className="mt-1">{row.kind === "sft" ? <Tag color="red">Fine-tuned</Tag> : row.kind === "baseline" ? <Tag>Scalar baseline</Tag> : null}</div>
    </div> },
    { title: "Public opinion", children: metricColumns("Public") },
    { title: "Private opinion", children: metricColumns("Private") },
  ];
  const privateColumns = [
    { title: "Model family", dataIndex: "label", key: "family", width: 190 },
    ...leaderboard.metrics.filter((metric) => metric.channel === "Private").map((metric) => ({
      title: `${metric.label} ↓`, key: metric.id,
      render: (_, row) => <span className="tabular-nums">{format(row.errors[metric.id].base)} → <strong>{format(row.errors[metric.id].SFT)}</strong></span>,
    })),
  ];
  const convergenceRows = comparison.flatMap((row) => ["public", "private"].map((channel) => ({
    key: `${row.family}-${channel}`, family: row.label, channel: channel === "public" ? "Public" : "Private", ...row.convergence[channel],
  })));
  const convergenceColumns = [
    { title: "Model family", dataIndex: "family", key: "family" },
    { title: "Opinion", dataIndex: "channel", key: "channel" },
    ...[["human", "Human"], ["base", "Base"], ["SFT", "SFT"]].map(([key, title]) => ({ title, dataIndex: key, key, render: format })),
  ];

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <LeaderboardHeader />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <section className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6" aria-labelledby="metric-definitions">
          <Title level={4} id="metric-definitions" style={{marginTop: 0}}>Definitions of the Metrics</Title>
          <dl className="space-y-5 text-base leading-relaxed text-gray-700">
            <div><dt className="font-semibold text-gray-900">Single-opinion prediction error</dt><dd className="mt-2 sm:pl-7">Mean absolute difference between model and human stance labels. Lower values indicate closer agreement with human opinions.</dd></div>
            <div><dt className="font-semibold text-gray-900">Opinion-update prediction error</dt><dd className="mt-2 sm:pl-7">Mean absolute difference between model and human changes in stance. Lower values indicate closer agreement with human opinion updates.</dd></div>
            <div><dt className="font-semibold text-gray-900">Opinion-convergence prediction error</dt><dd className="mt-2 sm:pl-7">Mean absolute difference between model and human changes in within-group stance standard deviation. Lower values indicate closer agreement with human convergence.</dd></div>
            <div><dt className="font-semibold text-gray-900">Opinion diversity (SD) and change in opinion diversity (ΔSD)</dt><dd className="mt-2 sm:pl-7">SD measures how much participants’ stances differ within a group. ΔSD is final SD minus initial SD: negative values indicate convergence, and positive values indicate divergence.</dd></div>
          </dl>
          <details className="mt-4 rounded-lg border border-gray-200 p-4 text-sm leading-relaxed text-gray-600">
            <summary className="cursor-pointer font-semibold text-gray-800">Evaluation protocol</summary>
            <p className="mt-3">Stance labels run from 1 (Certainly disagree) to 6 (Certainly agree). Metrics retain their applicable validity rules and observation counts. Base-model and fine-tuned evaluations can have different available examples. DeGroot coefficients are fitted on the training partition.</p>
            <p className="mt-3">The SFT test partitions also supplied validation loss for checkpoint selection. The released protocol documents coverage, annotation limitations, and the inputs supporting each analysis.</p>
            <a href={reproductionUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[#9B0000] underline">Read the evaluation protocol and reproduce these results</a>
          </details>
        </section>
        <nav aria-label="Leaderboard sections" className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {[["stance-alignment", "Stance prediction"], ["group-alignment", "Group-level alignment"], ["sft-alignment", "Fine-tuning across model families"], ["text-alignment", "Text quality"]].map(([id, label]) => <a key={id} href={`#${id}`} className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-md">{label}</a>)}
          </div>
        </nav>
        <section id="stance-alignment" className="bg-white rounded-lg shadow p-4 sm:p-6 mb-10 scroll-mt-6">
          <Tag color="red" style={{ maxWidth: "100%", whiteSpace: "normal" }}>NeurIPS 2026 Main Conference (Evaluations &amp; Datasets Track)</Tag>
          <Title level={4} style={{ marginTop: 12 }}>Predicting human opinion dynamics</Title>
          <Paragraph className="max-w-4xl text-gray-600">
            Compare seven base LLMs, supervised fine-tuning of Llama-3.1-8B, and a fitted DeGroot baseline.
            All six errors measure agreement with human observations; lower is better.
          </Paragraph>
          <div className="mt-6 flex flex-wrap gap-6">
            <Choice label="Test partition" value={partition} onChange={setPartition} options={Object.entries(leaderboard.partitions).map(([key, value]) => [key, value.label])} />
            <Choice label="Simulation setting" value={mode} onChange={setMode} options={Object.entries(leaderboard.modes)} />
          </div>
          <div className="mt-4 text-sm leading-relaxed text-gray-600">
            <strong>{leaderboard.partitions[partition].description}.</strong>{" "}
            {mode === "v0" ? "Agents continue the conversation using their generated messages." : "Each next message is predicted from the observed human conversation history."}{" "}
            The test partition contains {leaderboard.partitions[partition].requestedGroups} groups; the valid observations available for each metric are shown below.
          </div>
          <div className="mt-6">
            <Table key={`${partition}-${mode}`} rowKey="modelId" columns={mainColumns} dataSource={rows} pagination={false}
              size="small" scroll={{ x: 1030 }} bordered />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Brackets show bootstrap 95% confidence intervals. Click a metric heading to sort; the initial order matches the paper.
            Public targets are tweet-like posts, and private targets are final opinions. Conditioned initial opinions and first-round posts are excluded from single-opinion prediction error.
          </p>
          <p className="mt-2 text-xs text-gray-500 sm:hidden">Scroll the tables horizontally to see all metrics.</p>
          <PaperFigure name={`${figurePrefix}-errors`} title="Six stance prediction errors" caption="Paired bars compare Full Dynamics Simulation and Next Message Prediction, with bootstrap 95% confidence intervals." />
        </section>

        <section id="group-alignment" className="bg-white rounded-lg shadow p-4 sm:p-6 mb-10 scroll-mt-6">
          <Title level={3} style={{marginTop: 0}}>How opinions change during discussion</Title>
          <Paragraph>These figures show Full Dynamics Simulation on the selected {partition === "group_test" ? "group-generalization" : "topic-generalization"} test partition.</Paragraph>
          <PaperFigure name={`${figurePrefix}-convergence`} title="Group convergence and stance-diversity trajectories"
            caption="More negative changes in within-group stance standard deviation indicate stronger convergence. Initial aggregate standard deviations are anchored to the human reference in these panels. Convergence-summary error bars propagate the initial and final standard errors; the prediction errors in the table use each model's own endpoints." />
          <PaperFigure name={`${figurePrefix}-partner-gap`} title="Partner stance and opinion change"
            caption="Initial partner–self stance differences versus later opinion changes, with Spearman correlations and bootstrap 95% confidence intervals. Stronger positive correlations indicate a stronger monotonic association with the first partner's stance." />
        </section>

        <section id="sft-alignment" className="bg-white rounded-lg shadow p-4 sm:p-6 mb-10 scroll-mt-6">
          <Title level={3} style={{marginTop: 0}}>Fine-tuning across model families</Title>
          <Paragraph>
            Full Dynamics Simulation · {leaderboard.partitions[partition].label}. Each family uses its own human reference and available valid examples.
            Compare Base → SFT within a model family; absolute values across families are not a common-sample ranking.
          </Paragraph>
          <Title level={4}>Private-opinion prediction errors</Title>
          <Table rowKey="family" columns={privateColumns} dataSource={comparison} pagination={false} size="middle" scroll={{ x: 740 }} />
          <Title level={4} style={{ marginTop: 28 }}>Mean change in group stance diversity</Title>
          <Paragraph>Negative values indicate convergence. Closeness to the corresponding human value, rather than a more negative value, indicates closer agreement with human dynamics.</Paragraph>
          <Table rowKey="key" columns={convergenceColumns} dataSource={convergenceRows} pagination={false} size="small" scroll={{ x: 660 }} />
        </section>

        <section id="text-alignment" className="bg-white rounded-lg shadow p-4 sm:p-6 mb-10 scroll-mt-6">
          <Title level={3} style={{marginTop: 0}}>Text quality beyond stance</Title>
          <Paragraph>Semantic similarity, ROUGE-L, and response length complement stance prediction. Base and SFT text metrics use different evaluation subsets; these comparisons are descriptive.</Paragraph>
          <PaperFigure name={`${figurePrefix}-text`} title="Text-alignment metrics" caption="Text similarity and response length for both simulation settings. The text evaluation uses different observation sets from the stance-prediction metrics above." />
        </section>
        <p className="mt-6 text-center text-sm text-gray-500">
          <a className="underline" href="/release/leaderboard.json" download>Download leaderboard values</a>{" · "}
          <a className="underline" href="/release/leaderboard-provenance.json" download>Data provenance</a>{" · "}
          <a className="underline" href="https://github.com/yunshiuan/DEBATE-neurips2026" target="_blank" rel="noopener noreferrer">Reproduction code</a>
        </p>
      </div>
    </main>
  );
}
