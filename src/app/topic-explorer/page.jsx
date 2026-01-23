"use client";

import { useMemo, useState } from "react";
import { Button, Card, Input, Space, Typography, Tag } from "antd";
import Link from "next/link";
import TopicExplorerHeader from "../../components/TopicExplorerHeader";
import { dataPrefixes, topicLabelsByPrefix } from "../../lib/explorerOptions";

const { Title, Text } = Typography;

export default function TopicExplorer() {
  const [query, setQuery] = useState("");

  const topics = useMemo(() => {
    return dataPrefixes.map((prefix) => ({
      prefix,
      label: topicLabelsByPrefix[prefix] ?? prefix,
    }));
  }, []);

  const filteredTopics = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return topics;
    return topics.filter((topic) => {
      return (
        topic.label.toLowerCase().includes(needle) ||
        topic.prefix.toLowerCase().includes(needle)
      );
    });
  }, [query, topics]);

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <TopicExplorerHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Search topics
              </Text>
              <Input
                placeholder="Search by topic text or prefix"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                style={{ maxWidth: 640 }}
              />
            </div>

            <Space size="small" wrap>
              <Tag color="blue">Topics: {filteredTopics.length}</Tag>
            </Space>
          </Space>

          <div className="grid gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTopics.map((topic) => (
              <Card
                key={topic.prefix}
                className="shadow-sm"
                title={<Title level={5} style={{ marginBottom: 0 }}>{topic.label}</Title>}
              >
                <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                  {topic.prefix}
                </Text>
                <Link href={`/conversation-explorer?topic=${encodeURIComponent(topic.prefix)}`}>
                  <Button type="primary">Open in Conversation Explorer</Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
