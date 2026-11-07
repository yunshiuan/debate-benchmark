"use client";

import HeroNav from "@/components/HeroNav";
import Citation from "@/components/Citation";
import { Typography, Space, Tag } from "antd";
import Link from "next/link";
import leaderboard from "../../public/release/leaderboard.json";

const { Title, Paragraph, Text } = Typography;

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 rounded-full py-1 px-8 w-fit mx-auto my-6 shadow-sm">
    <span aria-hidden="true">{icon}</span>
    <Text strong className="uppercase tracking-wider text-xs text-gray-600">{title}</Text>
  </div>
);

export default function Home() {
  const inventory = leaderboard.inventory;
  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <div className="w-full bg-[#9B0000] px-4 py-12 shadow-md">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-normal tracking-wide text-white/85">NeurIPS 2026 Main Conference (Evaluations &amp; Datasets Track)</p>
          <Title level={1} style={{ color: "white", fontSize: "clamp(2.4rem, 7vw, 3.2rem)", fontWeight: 700, marginBottom: 12 }}>🏟️ DEBATE</Title>
          <Paragraph style={{ color: "white", fontSize: "1.25rem", marginBottom: 20 }}>
            A Large-Scale Benchmark for Evaluating Opinion Dynamics in Role-Playing LLM Agents
          </Paragraph>
          <Paragraph aria-label="Authors" style={{ color: "white", fontSize: "1rem", fontWeight: 500, maxWidth: 900, margin: "0 auto 16px", lineHeight: 1.9, opacity: 0.95 }}>
            <span className="whitespace-nowrap">Yun-Shiuan Chuang<sup>1†</sup></span>,{" "}
            <span className="whitespace-nowrap">Ruixuan Tu<sup>1,2,3*</sup></span>,{" "}
            <span className="whitespace-nowrap">Chengtao Dai<sup>1*</sup></span>,{" "}
            <span className="whitespace-nowrap">You Li<sup>1*</sup></span>,{" "}
            <span className="whitespace-nowrap">Smit Vasani<sup>1*</sup></span>,{" "}
            <span className="whitespace-nowrap">Binwei Yao<sup>1</sup></span>,{" "}
            <span className="whitespace-nowrap">Michael Henry Tessler<sup>5</sup></span>,{" "}
            <span className="whitespace-nowrap">Sijia Yang<sup>1</sup></span>,{" "}
            <span className="whitespace-nowrap">Dhavan Shah<sup>1</sup></span>,{" "}
            <span className="whitespace-nowrap">Robert Hawkins<sup>4</sup></span>,{" "}
            <span className="whitespace-nowrap">Junjie Hu<sup>1</sup></span>,{" "}
            <span className="whitespace-nowrap">Timothy T. Rogers<sup>1,6‡</sup></span>
          </Paragraph>
          <div aria-label="Author affiliations" className="mx-auto mb-4 grid max-w-4xl gap-x-6 gap-y-1 text-sm italic leading-relaxed text-white/90 sm:grid-cols-2 lg:grid-cols-3">
            <p><sup>1</sup> University of Wisconsin–Madison</p>
            <p><sup>2</sup> University of Tokyo</p>
            <p><sup>3</sup> RIKEN Center for Advanced Intelligence Project (AIP)</p>
            <p><sup>4</sup> Stanford University</p>
            <p><sup>5</sup> Google DeepMind</p>
            <p><sup>6</sup> UCL Institute of Cognitive Neuroscience</p>
          </div>
          <div aria-label="Author notes" className="mx-auto max-w-4xl space-y-1 text-xs leading-relaxed text-white/90">
            <p>* Co-authors with core contributions.</p>
            <p>† First author contact: <a href="mailto:yunshiuan.chuang@gmail.com" className="text-white underline decoration-white/50 underline-offset-2 hover:decoration-white">yunshiuan.chuang@gmail.com</a>.</p>
            <p>‡ Correspondence to Timothy T. Rogers: <a href="mailto:timothy.rogers@ucl.ac.uk" className="text-white underline decoration-white/50 underline-offset-2 hover:decoration-white">timothy.rogers@ucl.ac.uk</a>.</p>
          </div>
          <HeroNav />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <Text strong className="text-gray-500 uppercase text-xs tracking-widest mr-2">Keywords:</Text>
          <Space size={[0, 8]} wrap className="justify-center">
            {["Role-playing LLM agents", "Social simulation", "Opinion dynamics", "Human–LLM evaluation"].map((tag) => (
              <Tag key={tag} variant="filled" className="rounded-full bg-gray-200 px-4 py-1 text-sm text-gray-700">{tag}</Tag>
            ))}
          </Space>
        </div>

        <section className="bg-white text-gray-800 rounded-2xl p-6 sm:p-12 text-left shadow-sm border border-gray-100">
          <Title level={2} className="text-center mb-10 font-bold">About</Title>
          <SectionHeader icon="🚀" title="TL;DR" />
          <Paragraph className="text-xl text-gray-700 leading-relaxed text-left font-medium max-w-3xl mx-auto">
            DEBATE pairs human discussions with role-playing LLM agents initialized from the same participants.
            It measures whether models reproduce human opinions, individual opinion updates, and group convergence.
          </Paragraph>
          <SectionHeader icon="💬" title="Lay Summary" />
          <Paragraph className="text-lg text-gray-700 leading-relaxed sm:text-justify">
            Role-playing AI models are increasingly used to simulate how people talk, disagree, and change their minds. But a conversation that sounds realistic may still produce unrealistic changes in opinion. We introduce DEBATE, a public collection of discussions covering 107 topics, with records from 2,788 people in 697 groups. Participants exchange messages over three rounds of discussion and report their views before and after discussion. We use these data to test whether role-playing AI participants reproduce how people change their opinions. Across seven models, AI participants tend to agree more with others in their group after discussion, whereas humans tend to retain their initial views. Additional training on human conversations reduces this convergence tendency in three models, including when tested on new discussion topics. DEBATE offers a way to test the reliability of AI simulations used to study disagreement, misinformation, and social behavior.
          </Paragraph>
          <SectionHeader icon="✨" title="Abstract" />
          <figure className="border-2 border-dashed border-gray-200 rounded-2xl my-10 bg-gray-50 overflow-hidden p-4">
            <a href="/camera-ready/experiment.png" target="_blank" rel="noopener noreferrer" aria-label="Open the experiment diagram at full resolution">
              <img src="/camera-ready/experiment.png" alt="Four participants report initial private opinions, complete three rounds of public posts and dyadic chats, and report final private opinions. Each round pairs each participant with a different partner." className="h-auto w-full rounded-xl border border-gray-200 bg-white" />
            </a>
            <figcaption className="mt-3 text-sm leading-relaxed text-gray-600">
              Participants report an initial private opinion, complete three rounds of public tweet-like posts and dyadic chats with different partners, and report a final private opinion.
            </figcaption>
          </figure>

          <div className="space-y-6 text-lg leading-relaxed text-gray-700 sm:text-justify">
            <Paragraph>
              Modeling opinion change through social interactions is important for understanding polarization, misinformation, and societal conflict.
              Multi-agent simulations with role-playing LLM agents often display unnatural group behavior, such as premature convergence,
              and need empirical benchmarks for comparison with real human interactions.
            </Paragraph>
            <Paragraph>
              DEBATE contains multi-round public messages and private Likert-scale beliefs from U.S.-based participants across {inventory.topics} topics.
              Evaluation data cover {inventory.subjects.toLocaleString()} participants in {inventory.available_groups.toLocaleString()} groups. Its three-round design makes each participant&apos;s observed public interaction history traceable,
              supporting evaluation at the utterance, individual, and group levels.
            </Paragraph>
            <Paragraph>
              We instantiate digital-twin agents with seven LLMs and evaluate two settings: <strong>Next Message Prediction</strong> and <strong>Full Dynamics Simulation</strong>.
              Base-model groups generally converge more strongly than human groups. Across tests with unseen participant groups and unseen discussion topics,
              supervised fine-tuning of <strong>Llama-3.1-8B</strong>, <strong>Qwen3.5-4B</strong>, and <strong>Mistral-7B</strong> improves stance-based alignment and reduces excessive convergence,
              generally bringing group dynamics closer to the corresponding human groups. Differences in opinion change and belief updating remain.
            </Paragraph>
          </div>
          <div className="mt-8 text-gray-700">
            <Text strong>Explore the evidence</Text>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Inspect the <Link href="/leaderboard" className="font-medium text-[#9B0000] underline">model results</Link>,
              browse <Link href="/conversation-explorer" className="font-medium text-[#9B0000] underline">human and generated conversations</Link>,
              or explore participant personas and discussion topics. The public code and data include cached generations, stance and validity labels,
              training pipelines, and commands for reproducing the figures and tables.
            </p>
          </div>
        </section>
        <div className="mt-12"><Citation /></div>
        <section className="mt-8 px-1 text-sm leading-relaxed text-gray-600" aria-label="Acknowledgements">
          <Title level={4}>Acknowledgements</Title>
          <p>We acknowledge Smit Vasani for his core contributions to this work. We thank Aditya Dharap for assistance with human annotation, evaluation checks, and access to Gemini models.</p>
        </section>
      </div>
    </main>
  );
}
