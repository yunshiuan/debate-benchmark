"use client";
import { Button, Space } from 'antd';
import { 
  TableOutlined, 
  GithubOutlined, 
  FilePdfOutlined, 
  FileImageOutlined 
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