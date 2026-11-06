"use client";

import { Typography } from "antd";
import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function ConversationExplorerHeader() {
  return (
    <div className="w-full bg-[#9B0000] pt-8 pb-8 px-4 shadow-md">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="text-white hover:text-gray-200 transition-colors inline-flex items-center gap-2 mb-4"
        >
          <ArrowLeftOutlined /> Back to Home
        </Link>

        <Title
          level={1}
          style={{
            color: "white",
            fontSize: "clamp(1.8rem, 5vw, 3rem)",
            fontWeight: "700",
            marginBottom: "0",
          }}
        >
          💬 Conversation Explorer
        </Title>
      </div>
    </div>
  );
}
