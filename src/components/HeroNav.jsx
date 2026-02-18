"use client";
import { Button, Space } from 'antd';
import { 
  TableOutlined, 
  FilePdfOutlined, 
  UserOutlined,
  TagsOutlined
} from '@ant-design/icons';
import Link from 'next/link';

export default function HeroNav() {
  const hfIcon = (
    <img
      src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/huggingface-color.svg"
      alt="Hugging Face"
      width={18}
      height={18}
      style={{ display: "block" }}
    />
  );

  return (
    <div className="flex flex-wrap justify-center gap-3 my-8">
      {/* Internal Link to Leaderboard */}
      <Link href="/leaderboard">
        <Button size="large" icon={<TableOutlined />} className="hover:scale-105 transition-transform">
          Leaderboard
        </Button>
      </Link>

      {/* Internal Link to Conversation Explorer */}
      <Link href="/conversation-explorer">
        <Button size="large" icon={<TableOutlined />} className="hover:scale-105 transition-transform">
          Conversation Explorer
        </Button>
      </Link>

      <Link href="/persona-explorer">
        <Button size="large" icon={<UserOutlined />} className="hover:scale-105 transition-transform">
          Persona Explorer
        </Button>
      </Link>

      <Link href="/topic-explorer">
        <Button size="large" icon={<TagsOutlined />} className="hover:scale-105 transition-transform">
          Topic Explorer
        </Button>
      </Link>

      {/* External Links */}
      <Button 
        size="large" 
        icon={hfIcon} 
        href="https://huggingface.co/datasets/seantw/DEBATE_LLM" 
        target="_blank"
      >
        Dataset
      </Button>

      <Button 
        size="large" 
        icon={<FilePdfOutlined />} 
        href="/paper.pdf"
      >
        Paper
      </Button>

    </div>
  );
}
