"use client";

import {useEffect, useMemo, useState} from "react";
import {Alert, Button, Card, Input, Select, Spin, Tag, Typography} from "antd";
import Link from "next/link";
import TopicExplorerHeader from "@/components/TopicExplorerHeader";
import {partitionOptions, splitOptions} from "@/lib/explorerOptions";

const {Title, Paragraph, Text} = Typography;

export default function TopicExplorer() {
  const [index, setIndex] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [split, setSplit] = useState("group");
  const [partition, setPartition] = useState("all");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/explorer", {signal: controller.signal}).then(async (response) => {
      if (!response.ok) throw new Error("Unable to load topics.");
      setIndex(await response.json());
    }).catch((error) => {if (error.name !== "AbortError") setError(error.message);});
    return () => controller.abort();
  }, []);
  const topics = useMemo(() => {
    if (!index) return [];
    const eligible = new Set(index.sessions.filter((session) => partition === "all" || session.partitions.main[split] === partition).map((session) => session.id));
    return index.topics.map((topic) => ({...topic, groups: topic.sessions.filter((id) => eligible.has(id)).length})).filter((topic) => topic.groups && topic.label.toLowerCase().includes(query.toLowerCase().trim()));
  }, [index, split, partition, query]);
  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <TopicExplorerHeader />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          {error ? <Alert type="error" title={error} /> : !index ? <div className="p-12 text-center"><Spin /></div> : <>
            <Paragraph>Explore all {index.counts.topics} discussion topics represented in the {index.counts.sessions} human-evaluation groups. Group generalization holds out participant groups; topic generalization holds out entire discussion topics.</Paragraph>
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <label className="w-full sm:w-64"><Text strong>Evaluation split</Text><Select aria-label="Evaluation split" className="w-full mt-2" value={split} onChange={setSplit} options={splitOptions} /></label>
                <label className="w-full sm:w-48"><Text strong>Partition</Text><Select aria-label="Partition" className="w-full mt-2" value={partition} onChange={setPartition} options={partitionOptions} /></label>
              </div>
              <label className="block max-w-[640px]"><Text strong>Search topics</Text><Input aria-label="Search topics" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the discussion statements" className="mt-2" /></label>
              <div className="flex flex-wrap gap-2"><Tag color="blue">{topics.length} topics</Tag><Tag>{topics.reduce((sum, topic) => sum + topic.groups, 0)} groups</Tag></div>
            </div>
            <div className="grid gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => <Card key={topic.id} className="shadow-sm h-full" title={<Title level={5} style={{whiteSpace: "normal", overflowWrap: "anywhere", margin: 0, lineHeight: 1.55}}>{topic.label}</Title>}>
                <Text type="secondary" style={{display: "block", marginBottom: 12}}>{topic.groups} group{topic.groups === 1 ? "" : "s"} in this selection</Text>
                <Link href={`/conversation-explorer?topic=${topic.id}&split=${split}&partition=${partition}`}><Button type="primary" style={{maxWidth: "100%", height: "auto", minHeight: 32, whiteSpace: "normal"}}>Open in Conversation Explorer</Button></Link>
              </Card>)}
            </div>
          </>}
        </div>
      </div>
    </main>
  );
}
