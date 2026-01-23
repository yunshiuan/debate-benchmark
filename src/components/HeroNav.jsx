"use client";
import { Button, Space } from 'antd';
import { 
  TableOutlined, 
  GithubOutlined, 
  FilePdfOutlined, 
  FileImageOutlined,
  UserOutlined,
  TagsOutlined
} from '@ant-design/icons';
import Link from 'next/link';

export default function HeroNav() {
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
        icon={<GithubOutlined />} 
        href="https://github.com/your-repo" 
        target="_blank"
      >
        Code
      </Button>

      <Button 
        size="large" 
        icon={<FilePdfOutlined />} 
        href="/paper.pdf"
      >
        Paper
      </Button>

      <Button 
        size="large" 
        icon={<FileImageOutlined />} 
        href="/poster.pdf"
      >
        Poster
      </Button>
    </div>
  );
}
