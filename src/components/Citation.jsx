"use client";

import { Button, message, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function Citation() {
  const bibtex = `@article{chuang2025debate,
  title={DEBATE: A large-scale benchmark for evaluating opinion dynamics in role-playing LLM agents},
  author={Chuang, Yun-Shiuan and Tu, Ruixuan and Dai, Chengtao and Li, You and Vasani, Smit and Yao, Binwei and Tessler, Michael Henry and Yang, Sijia and Shah, Dhavan and Hawkins, Robert and others},
  journal={arXiv preprint arXiv:2510.25110},
  year={2025}
}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bibtex);
      message.success('Citation copied to clipboard.');
    } catch {
      message.error('Could not copy automatically. Select and copy the citation below.');
    }
  };

  return (
    <section className="bg-white text-gray-800 rounded-xl p-8 mt-8 text-left shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <Title level={3} style={{ margin: 0 }}>Preprint citation</Title>
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
