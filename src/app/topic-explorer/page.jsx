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
  return <main className="min-h-screen bg-gray-50 font-sans"><TopicExplorerHeader /><div className="max-w-7xl mx-auto px-4 py-8">
    {error ? <Alert type="error" title={error} /> : !index ? <div className="p-12 text-center"><Spin /></div> : <>
      <Paragraph>Explore all {index.counts.topics} discussion topics represented in the {index.counts.sessions} human-evaluation groups. Group generalization holds out participant groups; topic generalization holds out entire discussion topics.</Paragraph>
      <Card className="mb-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label><Text strong>Search topics</Text><Input aria-label="Search topics" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the discussion statements" className="mt-2" /></label>
        <label><Text strong>Evaluation split</Text><Select aria-label="Evaluation split" className="w-full mt-2" value={split} onChange={setSplit} options={splitOptions} /></label>
        <label><Text strong>Partition</Text><Select aria-label="Partition" className="w-full mt-2" value={partition} onChange={setPartition} options={partitionOptions} /></label>
      </div><div className="mt-4"><Tag color="red">{topics.length} topics</Tag><Tag>{topics.reduce((sum, topic) => sum + topic.groups, 0)} groups</Tag></div></Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{topics.map((topic) => <Card key={topic.id} className="h-full" title={<Title level={5} style={{whiteSpace: "normal", margin: 0, fontSize: 16, lineHeight: 1.55}}>{topic.label}</Title>}>
        <p>{topic.groups} group{topic.groups === 1 ? "" : "s"} in this selection</p>
        <Link href={`/conversation-explorer?topic=${topic.id}&split=${split}&partition=${partition}`}><Button type="primary">Explore conversations</Button></Link>
      </Card>)}</div>
    </>}
  </div></main>;
}
