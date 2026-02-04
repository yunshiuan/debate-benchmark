"use client";

import { Button, message, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function Citation() {
  const bibtex = `@misc{chuang2025debatelargescalebenchmarkroleplaying,
      title={DEBATE: A Large-Scale Benchmark for Role-Playing LLM Agents in Multi-Agent, Long-Form Debates}, 
      author={Yun-Shiuan Chuang and Ruixuan Tu and Chengtao Dai and Smit Vasani and You Li and Binwei Yao and Michael Henry Tessler and Sijia Yang and Dhavan Shah and Robert Hawkins and Junjie Hu and Timothy T. Rogers},
      year={2025},
      eprint={2510.25110},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2510.25110}, 
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bibtex);
    message.success('Citation copied to clipboard!');
  };

  return (
    <section className="bg-white text-gray-800 rounded-xl p-8 mt-8 text-left shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <Title level={3} style={{ margin: 0 }}>Citation</Title>
        <Button 
          icon={<CopyOutlined />} 
          onClick={copyToClipboard}
          className="flex items-center"
        >
          Copy
        </Button>
      </div>
      
      <div className="bg-zinc-900 rounded-lg p-6 overflow-x-auto">
        <pre className="text-gray-300 font-mono text-sm leading-relaxed">
          {bibtex}
        </pre>
      </div>
    </section>
  );
}