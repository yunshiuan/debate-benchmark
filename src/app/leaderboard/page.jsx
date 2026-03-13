"use client";

import { Typography } from "antd";
import { useState } from "react";
import LeaderboardHeader from "../../components/LeaderboardHeader";

const { Title } = Typography;

const columns = [
  {
    title: "LLM",
    dataIndex: "model",
    key: "model",
    fixed: "left",
  },
  {
    title: "Avg Stance Δ (↓)",
    dataIndex: "stance",
    key: "stance",
  },
  {
    title: "Avg RG (↑)",
    dataIndex: "rg",
    key: "rg",
  },
  {
    title: "Avg Length Δ (→0)",
    dataIndex: "len",
    key: "len",
  },
  {
    title: "On-topic Rate",
    dataIndex: "onTopic",
    key: "onTopic",
  },
];

const depthSections = [
  {
    id: "depth-mode-2",
    versionLabel: "Simulation Mode 2: Full Conversation Simulation",
    columns,
    data: [
      { key: "depth-2-gpt4o-mini", model: "gpt-4o-mini-2024-07-18", stance: "1.60", rg: "0.07", len: "-49.85", onTopic: "0.97" },
      { key: "depth-2-gpt5-mini", model: "gpt-5-mini", stance: "1.28", rg: "0.07", len: "-52.85", onTopic: "0.96" },
      { key: "depth-2-tulu-8b", model: "Llama-3.1-Tulu-3-8B-SFT", stance: "1.85", rg: "0.05", len: "-37.39", onTopic: "0.81" },
      { key: "depth-2-llama-8b", model: "Llama-3.1-8B-Instruct", stance: "1.76", rg: "0.05", len: "-44.94", onTopic: "0.96" },
      { key: "depth-2-llama-70b", model: "Llama-3.1-70B-Instruct", stance: "1.69", rg: "0.05", len: "-42.79", onTopic: "0.97" },
      { key: "depth-2-mistral-7b", model: "Mistral-7B-Instruct-v0.3", stance: "1.74", rg: "0.06", len: "-39.69", onTopic: "0.97" },
      { key: "depth-2-qwen-32b", model: "Qwen2.5-32B-Instruct", stance: "1.84", rg: "0.06", len: "-37.23", onTopic: "0.93" },
      { key: "depth-2-gemini", model: "gemini-2.5-flash-lite", stance: "1.79", rg: "0.07", len: "-68.36", onTopic: "0.97" },
    ],
  },
];

const breadthSections = [
  {
    id: "breadth-mode-2",
    versionLabel: "Simulation Mode 2: Full Conversation Simulation",
    columns,
    data: [
      { key: "breadth-2-gpt4o-mini", model: "gpt-4o-mini-2024-07-18", stance: "1.52", rg: "0.07", len: "-55.52", onTopic: "0.98" },
      { key: "breadth-2-gpt5-mini", model: "gpt-5-mini", stance: "1.23", rg: "0.07", len: "-47.81", onTopic: "0.98" },
      { key: "breadth-2-tulu-8b", model: "Llama-3.1-Tulu-3-8B-SFT", stance: "2.99", rg: "0.05", len: "-18.19", onTopic: "0.55" },
      { key: "breadth-2-llama-8b", model: "Llama-3.1-8B-Instruct", stance: "1.78", rg: "0.05", len: "-43.58", onTopic: "0.96" },
      { key: "breadth-2-llama-70b", model: "Llama-3.1-70B-Instruct", stance: "1.64", rg: "0.05", len: "-34.33", onTopic: "0.96" },
      { key: "breadth-2-mistral-7b", model: "Mistral-7B-Instruct-v0.3", stance: "1.62", rg: "0.06", len: "-43.70", onTopic: "0.98" },
      { key: "breadth-2-qwen-32b", model: "Qwen2.5-32B-Instruct", stance: "1.66", rg: "0.05", len: "-42.07", onTopic: "0.95" },
      { key: "breadth-2-gemini", model: "gemini-2.5-flash-lite", stance: "1.05", rg: "0.07", len: "-68.92", onTopic: "0.98" },
    ],
  },
];

function buildSections() {
  return [
    {
      id: "depth",
      levelLabel: "Utterance-level Alignment: LLM vs. Human (Depth Topics)",
      subsections: depthSections,
    },
    {
      id: "breadth",
      levelLabel: "Utterance-level Alignment: LLM vs. Human (Breadth Topics)",
      subsections: breadthSections,
    },
  ];
}

export default function Leaderboard() {
  const [alignmentTopicType, setAlignmentTopicType] = useState("depth");
  const sections = buildSections();
  const depthSection = sections.find((section) => section.id === "depth");
  const breadthSection = sections.find((section) => section.id === "breadth");

  const scrollToSection = (id) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <LeaderboardHeader />
      
      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <Title level={4} style={{ marginTop: 0 }}>
            Definitions & Notes
          </Title>
          <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
            Stance distance metric: |stance (human message) - stance (LLM message)|.
          </p>
          <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 0 }}>
            The stance labels are based classification onto a 6-point scale:{" "}
            {`{Certainly disagree (-2.5), Probably disagree (-1.5), Lean disagree (−0.5), Lean agree (+0.5), Probably agree (+1.5), Certainly agree (+2.5)}`}{" "}
            (see paper for details).
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => scrollToSection("utterance-alignment")}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-md"
            >
              Utterance-level Alignment
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("group-alignment")}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-md"
            >
              Group-level Alignment
            </button>
          </div>
        </div>

        <div id="utterance-alignment" className="bg-white rounded-lg shadow p-6 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Title level={4} style={{ margin: 0 }}>
              Utterance-level Evaluation of Role-playing LLM Agents
            </Title>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              {[
                { value: "depth", label: "Depth" },
                { value: "breadth", label: "Breadth" },
              ].map((option) => {
                const isActive = alignmentTopicType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAlignmentTopicType(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } rounded-md`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            {alignmentTopicType === "depth" && (
              <>
                <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                  Depth Topics - Avg Stance Δ (Full Conversation Simulation)
                </Title>
                <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 16 }}>
                  Average stance change for Depth topics in Full Conversation Simulation. Bars are sorted in
                  ascending order; lower values indicate smaller shifts in stance magnitude.
                </p>
                <div className="w-full" style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
                  <img
                    src="/leaderboard/avg_stance_delta_depth_mode2.svg"
                    alt="Depth topics average stance delta (mode 2)"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              </>
            )}
            {alignmentTopicType === "breadth" && (
              <>
                <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                  Breadth Topics - Avg Stance Δ (Full Conversation Simulation)
                </Title>
                <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 16 }}>
                  Average stance change for Breadth topics in Full Conversation Simulation. Bars are sorted in
                  ascending order; lower values indicate smaller shifts in stance magnitude.
                </p>
                <div className="w-full" style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
                  <img
                    src="/leaderboard/avg_stance_delta_breadth_mode2.svg"
                    alt="Breadth topics average stance delta (mode 2)"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div id="group-alignment" className="bg-white rounded-lg shadow p-6">
          {alignmentTopicType === "depth" && (
            <>
              <Title level={3} style={{ margin: 0, marginBottom: 12 }}>
                Group-Level Alignment in Opinion Dynamics: LLM Groups vs. Human Groups (Depth Topics)
              </Title>
              <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 16 }}>
                Change in within-group opinion diversity for humans and RPLA simulations on Depth
                Topics. Bars
                show averages over groups; more negative values indicate stronger convergence and
                positive values indicate divergence. Error bars denote the standard error of the mean
                across groups.
              </p>
          <div className="w-full" style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
            <img
              src="/bar_change_in_sd_fig_depth.svg"
              alt="Change in within-group opinion diversity figure (depth)"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>

          <div style={{ height: 24 }} />
            </>
          )}

          {alignmentTopicType === "breadth" && (
            <>
              <Title level={3} style={{ margin: 0, marginBottom: 12 }}>
                Group-Level Alignment in Opinion Dynamics: LLM Groups vs. Human Groups (Breadth Topics)
              </Title>
              <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 16 }}>
                Change in within-group opinion diversity for humans and RPLA simulations on Breadth
                Topics. Bars
                show averages over groups; more negative values indicate stronger convergence and
                positive values indicate divergence. Error bars denote the standard error of the mean
                across groups.
              </p>
              <div className="w-full" style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
                <img
                  src="/bar_change_in_sd_fig_breadth.svg"
                  alt="Change in within-group opinion diversity figure (breadth)"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            </>
          )}

          <Title level={4} style={{ margin: "0 0 12px" }}>
            Fine-tuning with SFT and DPO on the Dataset Aligns LLM Opinion Dynamics on Unseen Topics
          </Title>
          <p style={{ color: "#555", lineHeight: 1.6, marginTop: 0, marginBottom: 8 }}>
            Change in within-group opinion diversity after SFT/DPO post-training.
          </p>
          <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
            Note: This is only for breadth topics as breadth topic data scale supports proper fine-tuning.
          </p>
          <div className="w-full" style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
            <img
              src="/bar_change_in_sd_sft_dpo_fig_breadth.svg"
              alt="Change in within-group opinion diversity after SFT/DPO (breadth)"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
