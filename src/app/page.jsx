"use client";

import HeroNav from "@/components/HeroNav";
import Citation from "@/components/Citation";
import { Typography, Space, Tag } from "antd";
import { MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import leaderboard from "../../public/release/leaderboard.json";

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const inventory = leaderboard.inventory;
  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <div className="w-full bg-[#9B0000] px-4 pb-10 pt-12 shadow-md">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-semibold tracking-wide text-white/85">NeurIPS 2026 Main Conference (<strong>Evaluations &amp; Datasets Track</strong>)</p>
          <Title level={1} style={{ color: "white", fontSize: "clamp(2.4rem, 7vw, 3.2rem)", fontWeight: 700, marginBottom: 12 }}>🏟️ DEBATE</Title>
          <Paragraph style={{ color: "white", fontSize: "1.25rem", marginBottom: 20 }}>
            A Large-Scale Benchmark for Evaluating Opinion Dynamics in Role-Playing LLM Agents
          </Paragraph>
          <Paragraph style={{ color: "white", fontSize: "1rem", maxWidth: 900, margin: "0 auto 16px", lineHeight: 1.7, opacity: 0.95 }}>
            Yun-Shiuan Chuang, Ruixuan Tu, Chengtao Dai, You Li, Smit Vasani, Binwei Yao, Michael Henry Tessler,<br className="hidden sm:block" />
            {" "}Sijia Yang, Dhavan Shah, Robert Hawkins, Junjie Hu, Timothy T. Rogers
          </Paragraph>
          <a href="mailto:yunshiuan.chuang@gmail.com" className="inline-flex items-center justify-center gap-2 text-sm text-white/90 hover:text-white">
            <MailOutlined /> yunshiuan.chuang@gmail.com
          </a>
          <HeroNav />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 grid grid-cols-3 gap-3 text-center sm:gap-6">
          {[[inventory.topics, "Discussion topics"], [inventory.available_groups, "Evaluated groups"], [inventory.subjects, "Participants in evaluation"]].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white px-2 py-5 shadow-sm">
              <p className="text-2xl font-bold text-[#9B0000] sm:text-3xl">{value.toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-600 sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
        <div className="mb-8 text-center">
          <Space size={[0, 8]} wrap className="justify-center">
            {["Role-playing LLM agents", "Social simulation", "Opinion dynamics", "Human–LLM evaluation"].map((tag) => (
              <Tag key={tag} variant="filled" className="rounded-full bg-gray-200 px-4 py-1 text-sm text-gray-700">{tag}</Tag>
            ))}
          </Space>
        </div>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 text-gray-800 shadow-sm sm:p-10">
          <Title level={2}>Do simulated discussions change opinions like human discussions?</Title>
          <Paragraph className="text-lg leading-relaxed text-gray-700">
            DEBATE pairs human discussions with role-playing LLM agents initialized from the same participants.
            It measures whether models reproduce human opinions, individual opinion updates, and group convergence.
          </Paragraph>
          <figure className="my-8">
            <a href="/camera-ready/experiment.png" target="_blank" rel="noopener noreferrer" aria-label="Open the experiment diagram at full resolution">
              <img src="/camera-ready/experiment.png" alt="Four participants report initial private opinions, complete three rounds of public posts and dyadic chats, and report final private opinions. Each round pairs each participant with a different partner." className="h-auto w-full rounded-xl border border-gray-200 bg-white" />
            </a>
            <figcaption className="mt-3 text-sm leading-relaxed text-gray-600">
              Participants report an initial private opinion, complete three rounds of public tweet-like posts and dyadic chats with different partners, and report a final private opinion.
            </figcaption>
          </figure>

          <Title level={3}>About the benchmark</Title>
          <div className="space-y-5 text-base leading-relaxed text-gray-700">
            <Paragraph>
              Modeling opinion change through social interactions is important for understanding polarization, misinformation, and societal conflict.
              Multi-agent simulations with role-playing LLM agents often display unnatural group behavior, such as premature convergence,
              and need empirical benchmarks for comparison with real human interactions.
            </Paragraph>
            <Paragraph>
              DEBATE contains multi-round public messages and private Likert-scale beliefs from U.S.-based participants across 107 topics.
              Evaluation data cover 2,788 participants in 697 groups. Its three-round design makes each participant&apos;s observed public interaction history traceable,
              supporting evaluation at the utterance, individual, and group levels.
            </Paragraph>
            <Paragraph>
              We instantiate digital-twin agents with seven LLMs and evaluate two settings: <strong>Next Message Prediction</strong> and <strong>Full Dynamics Simulation</strong>.
              Base-model groups generally converge more strongly than human groups. Across tests with unseen participant groups and unseen discussion topics,
              supervised fine-tuning of <strong>Llama-3.1-8B</strong>, <strong>Qwen3.5-4B</strong>, and <strong>Mistral-7B</strong> improves stance-based alignment and reduces excessive convergence,
              generally bringing group dynamics closer to the corresponding human groups. Differences in opinion change and belief updating remain.
            </Paragraph>
          </div>
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-5">
            <Text strong>Explore the evidence</Text>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Inspect the <Link href="/leaderboard" className="font-medium text-[#9B0000] underline">model results</Link>,
              browse <Link href="/conversation-explorer" className="font-medium text-[#9B0000] underline">human and generated conversations</Link>,
              or explore participant personas and discussion topics. The public code and data include cached generations, stance and validity labels,
              training pipelines, and commands for reproducing the figures and tables.
            </p>
          </div>
        </section>
        <div className="mt-8"><Citation /></div>
        <section className="mt-8 px-1 text-sm leading-relaxed text-gray-600" aria-label="Acknowledgements">
          <Title level={4}>Acknowledgements</Title>
          <p>We acknowledge Smit Vasani for his core contributions to this work. We thank Aditya Dharap for assistance with human annotation, evaluation checks, and access to Gemini models.</p>
        </section>
      </div>
    </main>
  );
}
