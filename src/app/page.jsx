"use client";
import HeroNav from '@/components/HeroNav';
import Citation from '@/components/Citation';
import { Typography, Space, Tag } from 'antd';
import { MailOutlined } from '@ant-design/icons';
const { Title, Paragraph, Text } = Typography;

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 rounded-full py-1 px-8 w-fit mx-auto my-6 shadow-sm">
    <span>{icon}</span>
    <Text strong className="uppercase tracking-wider text-xs text-gray-600">{title}</Text>
  </div>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      
      {/* === Top Red Header Section === */}
      <div className="w-full bg-[#9B0000] pt-12 pb-12 px-4 shadow-md">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Main Title */}
          <Title level={1} style={{ color: 'white', fontSize: '3.2rem', fontWeight: '700', marginBottom: '12px' }}>
            🏟️ DEBATE
          </Title>
          
          {/* Subtitle */}
          <Paragraph style={{ color: 'white', fontSize: '1.25rem', fontWeight: '400', marginBottom: '20px', letterSpacing: '0.01em' }}>
            A Large-Scale Benchmark for Evaluating Opinion Dynamics in Role-Playing LLM Agents
          </Paragraph>
          
          {/* Authors List */}
          <Paragraph style={{ color: 'white', fontSize: '1rem', fontWeight: '400', maxWidth: '900px', margin: '0 auto 16px auto', lineHeight: '1.6', opacity: 0.95 }}>
            Yun-Shiuan Chuang, Ruixuan Tu, Chengtao Dai, Smit Vasani, Binwei Yao, Michael Henry Tessler, <br />
            Sijia Yang, Dhavan V. Shah, Robert D. Hawkins, Junjie Hu, Timothy T. Rogers
          </Paragraph>

          {/* Contact Email */}
          <div className="mb-10">
            <a 
              href="mailto:yunshiuan.chuang@wisc.edu" 
              style={{ color: 'white', fontSize: '0.95rem', opacity: 0.9 }}
              className="hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
            >
              <MailOutlined /> yunshiuan.chuang@wisc.edu
            </a>
          </div>

          {/* Navigation Buttons */}
          <HeroNav />
        </div>
      </div>

      {/* === Main Content Section === */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* ... (Keywords, About, and Citation code from before) */}
        
        {/* Keywords Section */}
        <div className="mb-10 text-center">
          <Text strong className="text-gray-500 uppercase text-xs tracking-widest mr-2">Keywords:</Text>
          <Space size={[0, 8]} wrap className="justify-center">
            {['Role-playing LLM agent', 'Social simulation benchmark', 'Multi-agent LLM system', 'Opinion dynamics'].map(tag => (
              <Tag key={tag} bordered={false} className="bg-gray-200 text-gray-700 rounded-full px-4 py-1 text-sm">
                {tag}
              </Tag>
            ))}
          </Space>
        </div>

        {/* 1. Main About Card */}
        <section className="bg-white text-gray-800 rounded-2xl p-12 text-left shadow-sm border border-gray-100">
          <Title level={2} className="text-center mb-10 font-bold">About</Title>
          
          <SectionHeader icon="🚀" title="TL;DR" />
          <Paragraph className="text-xl text-gray-700 leading-relaxed text-left font-medium max-w-3xl mx-auto">
            We introduce DEBATE, a large-scale benchmark for evaluating how well role-playing LLM agents 
            simulate realistic human opinion dynamics in multi-agent conversations.
          </Paragraph>

          <SectionHeader icon="✨" title="Abstract" />
          
          <div className="border-2 border-dashed border-gray-200 rounded-2xl my-10 bg-gray-50 overflow-hidden">
            <div className="p-4">
              <div className="w-full">
                <img
                  src="/exp_diagram_fig.png"
                  alt="Benchmark architecture diagram"
                  className="w-full h-auto rounded-xl border border-gray-200 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Paragraph className="text-lg text-gray-700 leading-relaxed text-justify">
              Accurately modeling opinion change through social interactions is crucial for understanding and 
              mitigating polarization, misinformation, and societal conflict. Recent work explores simulating 
              opinion dynamics with role-playing LLM agents (RPLAs)—language models assigned human-like personas 
              that engage in multi-turn, multi-agent opinion exchange. However, existing RPLA simulations often 
              produce unnatural group behaviors (e.g., premature consensus) and lack empirical benchmarks for 
              evaluating alignment with real human interactions. 
            </Paragraph>
            <Paragraph className="text-lg text-gray-700 leading-relaxed text-justify">
              We introduce DEBATE, the first large-scale benchmark for evaluating the authenticity of opinion 
              dynamics in multi-agent RPLA simulations. DEBATE contains 37,357 messages from 2,792 U.S.-based 
              participants who engaged in multi-player, multi-round conversations across 107 controversial topics, 
              reporting both public messages and private beliefs. We simulate these conversations using various 
              LLMs and introduce multi-level evaluation metrics to assess behavioral alignment between humans and RPLAs. 
              Our analyses reveal key behavioral gaps: RPLA groups exhibit stronger opinion convergence and belief 
              drift than humans, and individual agents show more systematic shifts in response to social influence. 
              The dataset and codebase will be publicly released.
            </Paragraph>
          </div>
        </section>

        {/* 2. Citation Card */}
        <div className="mt-12">
          <Citation />
        </div>
      </div>
    </main>
  );
}
