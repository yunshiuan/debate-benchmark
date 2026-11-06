"use client";
import { Button } from 'antd';
import { 
  TableOutlined, 
  FilePdfOutlined, 
  UserOutlined,
  TagsOutlined,
  GithubOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import Link from 'next/link';

export default function HeroNav() {
  return (
    <div className="flex flex-wrap justify-center gap-3 my-8">
      {/* Internal Link to Leaderboard */}
      <Link href="/leaderboard">
        <Button size="large" icon={<TableOutlined />} className="hover:scale-105 transition-transform">
          Model Leaderboard
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
        icon={<DatabaseOutlined />}
        href="https://huggingface.co/datasets/seantw/DEBATE_LLM" 
        target="_blank"
        rel="noopener noreferrer"
      >
        Dataset
      </Button>

      <Button 
        size="large" 
        icon={<FilePdfOutlined />} 
        href="https://arxiv.org/abs/2510.25110"
        target="_blank"
        rel="noopener noreferrer"
      >
        Paper
      </Button>

      <Button size="large" icon={<GithubOutlined />} href="https://github.com/yunshiuan/DEBATE-neurips2026" target="_blank" rel="noopener noreferrer">
        Code
      </Button>

    </div>
  );
}
