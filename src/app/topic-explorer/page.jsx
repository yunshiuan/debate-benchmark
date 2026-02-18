"use client";

import { useMemo, useState } from "react";
import { Button, Card, Input, Space, Typography, Tag } from "antd";
import Link from "next/link";
import TopicExplorerHeader from "../../components/TopicExplorerHeader";
import { dataPrefixes } from "../../lib/explorerOptions";

const { Title, Text } = Typography;

export default function TopicExplorer() {
  const [query, setQuery] = useState("");
  const [topicType, setTopicType] = useState("all");

  const normalizeTopicLabel = (label) =>
    String(label || "")
      .toLowerCase()
      .replace(/["“”]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const depthTopicSet = new Set(
    [
      'A "body cleanse," in which you consume only particular kinds of nutrients over 1-3 days, helps your body to eliminate toxins',
      "Angels are real",
      "Everything that happens can eventually be explained by science",
      "Regular fasting will improve your health",
      "The US deficit increased after President Obama was elected",
      "The United States has the highest federal income tax rate of any Western country",
      "The position of the planets at the time of your birth can influence your personality",
    ].map(normalizeTopicLabel)
  );

  const parseDataPrefix = (prefix) => {
    const parts = String(prefix || "").split("_");
    if (parts.length < 4) {
      return { topicKey: prefix || "", topicLabel: prefix || "", prefix };
    }
    const topicParts = parts.slice(2, -1);
    const topicKey = topicParts.join("_");
    const topicLabel = topicParts.join(" ");
    return { topicKey, topicLabel, prefix };
  };

  const topics = useMemo(() => {
    const byTopic = new Map();
    dataPrefixes.forEach((prefix) => {
      const { topicKey, topicLabel } = parseDataPrefix(prefix);
      if (!topicKey) return;
      if (!byTopic.has(topicKey)) {
        byTopic.set(topicKey, { label: topicLabel || topicKey, prefixes: [] });
      }
      byTopic.get(topicKey).prefixes.push(prefix);
    });
    return Array.from(byTopic.entries()).map(([topicKey, info]) => ({
      topicKey,
      label: info.label,
      prefixes: info.prefixes,
      topicType: depthTopicSet.has(normalizeTopicLabel(info.label)) ? "depth" : "breadth",
    }));
  }, []);

  const filteredTopics = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let next = topics;
    if (topicType !== "all") {
      next = next.filter((topic) => topic.topicType === topicType);
    }
    if (!needle) return next;
    return next.filter((topic) => {
      return (
        topic.label.toLowerCase().includes(needle) ||
        topic.prefixes.some((prefix) => prefix.toLowerCase().includes(needle))
      );
    });
  }, [query, topicType, topics]);

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <TopicExplorerHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Text strong>Search topics</Text>
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                  {[
                    { value: "all", label: "All" },
                    { value: "depth", label: "Depth" },
                    { value: "breadth", label: "Breadth" },
                  ].map((option) => {
                    const isActive = topicType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTopicType(option.value)}
                        className={`px-3 py-1.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-gray-900 text-white"
                            : "text-gray-600 hover:text-gray-900"
                        } rounded-md`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Input
                placeholder="Search by topic text or prefix"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                style={{ maxWidth: 640, marginTop: 8 }}
              />
            </div>

            <Space size="small" wrap>
              <Tag color="blue">Topics: {filteredTopics.length}</Tag>
            </Space>
          </Space>

          <div className="grid gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTopics.map((topic) => (
              <Card
                key={topic.topicKey}
                className="shadow-sm"
                title={<Title level={5} style={{ marginBottom: 0 }}>{topic.label}</Title>}
              >
                <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                  {topic.prefixes.length} group{topic.prefixes.length === 1 ? "" : "s"}
                </Text>
                <Link href={`/conversation-explorer?topic=${encodeURIComponent(topic.topicKey)}`}>
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
