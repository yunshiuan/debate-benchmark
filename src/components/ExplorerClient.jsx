"use client";

import {useEffect, useMemo, useState} from "react";
import {Alert, Button, Card, Collapse, Empty, Input, Select, Slider, Spin, Table, Tabs, Tag, Typography} from "antd";
import Link from "next/link";
import {demographicLabels, displayAnswer, partitionOptions, splitOptions, versionLabels} from "@/lib/explorerOptions";

const {Title, Paragraph, Text} = Typography;
const COLORS = {p1: "#e7eefb", p2: "#e5f2e9", p3: "#f7e9da", p4: "#f0e7f7"};
const STAGES = [{key: "initial", label: "Initial private opinions"}, {key: "1", label: "Round 1"}, {key: "2", label: "Round 2"}, {key: "3", label: "Round 3"}, {key: "final", label: "Final private opinions"}];
const matchesStage = (row, stage) => stage === "initial" ? row.event === "Initial Opinion" : stage === "final" ? row.event === "Post Opinion" : row.round === Number(stage) && ["tweet", "message_sent"].includes(row.event);
const selectedOptions = (values) => values.map((value) => ({value, label: displayAnswer(value)}));

async function getJson(url, signal) {
  const response = await fetch(url, {signal});
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Unable to load this view.");
  return payload;
}

function Records({rows, source, stage, person}) {
  const visible = rows.filter((row) => matchesStage(row, stage) && (!person || row.participant === person || row.recipient === person));
  if (!visible.length) return <Empty description="No records for this stage and participant selection." image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  return <div className="space-y-4">{visible.map((row, index) => <article key={index} style={{background: COLORS[row.participant] || "#f1f1f1", padding: 16, borderRadius: 12, borderLeft: row.event === "tweet" ? "4px solid #9b0000" : "4px solid transparent"}}>
    <div className="flex flex-wrap justify-between gap-2 mb-2">
      <Text strong>Participant {row.participant.slice(1)}{row.recipient ? ` → Participant ${row.recipient.slice(1)}` : ""}</Text>
      <Text type="secondary">{row.event === "tweet" ? "Public post" : row.event === "message_sent" ? "Chat message" : "Private opinion"}</Text>
    </div>
    {row.conditioned && <Tag color="blue">Human-conditioned input</Tag>}
    <p style={{whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: "8px 0", lineHeight: 1.65}}>{row.text.trim() ? row.text : <em>{source === "model" ? (row.conditioned ? "Human input supplied as context; no separate model text recorded." : "No generated response recorded.") : "No response recorded."}</em>}</p>
    <div className="flex flex-wrap gap-2 mt-3">
      {row.stance !== null && <Tag>{row.stance >= 1 && row.stance <= 6 ? `Judge stance: ${row.stance}/6` : `Cached stance outside scale: ${row.stance}`}{row.stance_label ? ` · ${row.stance_label}` : ""}</Tag>}
      {row.participant_rating !== null && row.participant_rating >= 1 && row.participant_rating <= 6 && <Tag>Self-report: {row.participant_rating}/6</Tag>}
      {row.validity === "INVALID" && <Tag color="orange">Excluded by cached validity label</Tag>}
      {row.validity && !["VALID", "INVALID"].includes(row.validity) && <Tag>Validity: {row.validity}</Tag>}
    </div>
  </article>)}</div>;
}

function SurveyOverview({demographics}) {
  const [field, setField] = useState("gender");
  if (!demographics) return null;
  const record = demographics.fields[field];
  return <Collapse className="mb-6" items={[{key: "survey", label: "Participant survey overview", children: <>
    <Paragraph>The demographic survey covers the 708 recorded sessions. {demographics.survey_respondents.toLocaleString()} of {demographics.participant_records.toLocaleString()} participant records contain at least one response ({demographics.survey_participation_percent.toFixed(1)}%). Each percentage uses the respondents to that item; multi-select percentages can sum to more than 100%.</Paragraph>
    <Select aria-label="Survey item" value={field} onChange={setField} style={{width: "100%", maxWidth: 330}} options={Object.keys(demographics.fields).map((key) => ({value: key, label: demographicLabels[key] || key}))} />
    <p className="mt-3">{record.response_n.toLocaleString()} responses{record.multi_select ? " · Multiple selections allowed" : ""}</p>
    <Table size="small" rowKey="label" pagination={{pageSize: 10, showSizeChanger: false}} dataSource={record.categories} columns={[{title: "Response", dataIndex: "label", render: displayAnswer}, {title: "Count", dataIndex: "count"}, {title: "Respondents", dataIndex: "percent", render: (value) => `${value.toFixed(1)}%`}]} />
  </>}]} />;
}

export default function ExplorerClient({kind = "conversation"}) {
  const [index, setIndex] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [initialError, setInitialError] = useState("");
  const [split, setSplit] = useState("group");
  const [partition, setPartition] = useState(kind === "persona" ? "all" : "test");
  const [model, setModel] = useState("llama-sft-group");
  const [mode, setMode] = useState("v0");
  const [topic, setTopic] = useState("all");
  const [sessionId, setSessionId] = useState("");
  const [person, setPerson] = useState("");
  const [stage, setStage] = useState("initial");
  const [filters, setFilters] = useState({});
  const [ageRange, setAgeRange] = useState([18, 100]);
  const [ageFilter, setAgeFilter] = useState(false);
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runError, setRunError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getJson("/api/explorer", controller.signal).then((value) => {
      setIndex(value);
      const params = new URLSearchParams(window.location.search);
      const querySplit = ["group", "topic"].includes(params.get("split")) ? params.get("split") : "group";
      setSplit(querySplit);
      const queryModel = value.models.find((item) => item.id === params.get("model") && (!item.training_split || item.training_split === querySplit));
      setModel(queryModel?.id || `llama-sft-${querySplit}`);
      if (Object.hasOwn(value.modes, params.get("mode"))) setMode(params.get("mode"));
      const queryTopic = params.get("topic");
      const foundTopic = value.topics.find((item) => item.id === queryTopic || item.label.replaceAll(" ", "_") === queryTopic);
      if (foundTopic) {setTopic(foundTopic.id); setPartition("all");}
      if (value.sessions.some((item) => item.id === params.get("session"))) {setSessionId(params.get("session")); setPartition("all");}
      if (/^p[1-4]$/.test(params.get("person") || "")) setPerson(params.get("person"));
      if (["all", "train", "test"].includes(params.get("partition"))) setPartition(params.get("partition"));
    }).catch((error) => {if (error.name !== "AbortError") setInitialError(error.message);});
    if (kind === "persona") getJson("/api/demographics", controller.signal).then(setDemographics).catch((error) => {if (error.name !== "AbortError") setInitialError(error.message);});
    return () => controller.abort();
  }, [kind]);

  const selectedModel = index?.models.find((item) => item.id === model);
  const maskSource = selectedModel?.mask_source || "main";
  const eligibleSessions = useMemo(() => (index?.sessions || []).filter((session) => (topic === "all" || session.topic === topic) && (partition === "all" || session.partitions[maskSource]?.[split] === partition)), [index, topic, partition, split, maskSource]);
  const eligibleIds = useMemo(() => new Set(eligibleSessions.map((session) => session.id)), [eligibleSessions]);
  const filteredPersonas = useMemo(() => (demographics?.personas || []).filter((item) => {
    if (!eligibleIds.has(item.session)) return false;
    const answers = item.demographics;
    if (ageFilter && (answers.age === null || answers.age === undefined || answers.age < ageRange[0] || answers.age > ageRange[1])) return false;
    if (Object.entries(filters).some(([field, value]) => value && !(Array.isArray(answers[field]) ? answers[field].includes(value) : answers[field] === value))) return false;
    return !query.trim() || Object.values(answers).some((answer) => displayAnswer(answer).toLowerCase().includes(query.trim().toLowerCase()));
  }), [demographics, eligibleIds, filters, ageFilter, ageRange, query]);
  const personaSessionIds = useMemo(() => new Set(filteredPersonas.map((item) => item.session)), [filteredPersonas]);
  const sessionOptions = kind === "persona" ? eligibleSessions.filter((session) => personaSessionIds.has(session.id)) : eligibleSessions;
  const session = sessionOptions.find((item) => item.id === sessionId) || sessionOptions.find((item) => item.available.includes(`${model}:${mode}`)) || sessionOptions[0];
  const activePerson = kind === "persona" ? (filteredPersonas.find((item) => item.session === session?.id && item.id === person) || filteredPersonas.find((item) => item.session === session?.id)) : null;
  const personId = kind === "persona" ? activePerson?.id : person;
  const hasRun = session?.available.includes(`${model}:${mode}`);

  useEffect(() => {
    if (!session) {setPayload(null); return;}
    const controller = new AbortController();
    setLoading(true); setPayload(null); setRunError("");
    const endpoint = hasRun ? `/api/conversation-csv?session=${session.id}&model=${encodeURIComponent(model)}&version=${mode}` : `/api/conversation-human?session=${session.id}`;
    getJson(endpoint, controller.signal).then((value) => {
      setPayload(hasRun ? value : {humanData: value.data, data: [], participants: value.participants});
      if (!hasRun) setRunError("No cached model output is available for this group and mode. The human conversation is shown below.");
    }).catch((error) => {if (error.name !== "AbortError") setRunError(error.message);}).finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [session?.id, hasRun, model, mode]);

  function changeSplit(next) {
    setSplit(next);
    if (selectedModel?.training_split) setModel(model.replace(/-(group|topic)$/, `-${next}`));
    setSessionId("");
  }
  if (initialError) return <Alert type="error" showIcon title="Unable to load explorer data" description={initialError} />;
  if (!index || (kind === "persona" && !demographics)) return <div className="p-12 text-center"><Spin tip="Loading released conversations" /></div>;
  const topicRecord = index.topics.find((item) => item.id === session?.topic);
  const selectedPersona = payload?.participants.find((item) => item.id === personId);
  const filterFields = ["gender", "education", "ethnicity", "politicalIdentity", "politicalViews", "income", "occupation", "religion", "origin"];
  const extraFields = ["residency", "maritalStatus", "childrenSchool", "residence", "bibleBelief", "evangelical"];
  const renderFilter = (field) => {
    const values = [...new Set(demographics.personas.flatMap((item) => {const value = item.demographics[field]; return Array.isArray(value) ? value : value ? [value] : [];}))].sort();
    return <label key={field}><Text strong>{demographicLabels[field]}</Text><Select aria-label={demographicLabels[field]} allowClear showSearch optionFilterProp="label" className="w-full mt-2" placeholder="Any response" value={filters[field]} onChange={(value) => {setFilters({...filters, [field]: value}); setSessionId("");}} options={selectedOptions(values)} /></label>;
  };
  return <>
    <Paragraph>Explore {index.counts.sessions} human-evaluation groups and their retained model conversations across {index.counts.topics} topics. Stance labels run from 1 (certainly disagree) to 6 (certainly agree).</Paragraph>
    {kind === "persona" && <SurveyOverview demographics={demographics} />}
    <Card className="mb-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label><Text strong>Evaluation split</Text><Select aria-label="Evaluation split" className="w-full mt-2" value={split} options={splitOptions} onChange={changeSplit} /></label>
        <label><Text strong>Partition</Text><Select aria-label="Partition" className="w-full mt-2" value={partition} options={partitionOptions} onChange={setPartition} /></label>
        <label><Text strong>Simulation mode</Text><Select aria-label="Simulation mode" className="w-full mt-2" value={mode} onChange={setMode} options={Object.entries(versionLabels).map(([value, label]) => ({value, label}))} /></label>
        <label className="lg:col-span-2"><Text strong>Topic</Text><Select aria-label="Topic" className="w-full mt-2" showSearch optionFilterProp="label" value={topic} onChange={(value) => {setTopic(value); setSessionId("");}} options={[{value: "all", label: "All topics"}, ...index.topics.map((item) => ({value: item.id, label: item.label}))]} /></label>
        <label><Text strong>Model</Text><Select aria-label="Model" className="w-full mt-2" value={model} onChange={setModel} options={index.models.filter((item) => !item.training_split || item.training_split === split).map((item) => ({value: item.id, label: item.label}))} /></label>
      </div>
      <p className="mt-4 mb-0 text-sm text-gray-600">{versionLabels[mode]}: {mode === "v0" ? "each model continues its generated conversation history." : "each prediction is conditioned on the observed human conversation history."} Human-conditioned inputs are labelled below; cached response text is preserved as recorded.</p>
    </Card>
    {kind === "persona" && <Card className="mb-6" title="Find participants">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filterFields.map(renderFilter)}</div>
      <Collapse className="mt-4" items={[{key: "extra", label: `More filters${extraFields.some((field) => filters[field]) ? ` (${extraFields.filter((field) => filters[field]).length} active)` : ""}`, children: <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{extraFields.map(renderFilter)}</div>}]} />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label><Text strong>Search survey responses</Text><Input aria-label="Search survey responses" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2" placeholder="Search responses" /></label>
        <div><label><input type="checkbox" checked={ageFilter} onChange={(event) => setAgeFilter(event.target.checked)} /> Filter age: {ageRange[0]}–{ageRange[1]}</label><Slider range min={18} max={100} value={ageRange} onChange={setAgeRange} disabled={!ageFilter} /></div>
      </div>
      <div className="mt-3 flex gap-3 items-center"><Tag>{filteredPersonas.length} matching participants</Tag><Button size="small" onClick={() => {setFilters({}); setQuery(""); setAgeFilter(false);}}>Reset demographics</Button></div>
      <p className="text-sm text-gray-600 mt-3 mb-0">Participant labels are local to each group. Persona browsing covers the 2,788 participants in the 697 evaluation groups; survey overview percentages above use all recorded sessions.</p>
    </Card>}
    <Card className="mb-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label><Text strong>Conversation group</Text><Select aria-label="Conversation group" className="w-full mt-2" value={session?.id} onChange={(value) => {setSessionId(value); setPerson("");}} showSearch optionFilterProp="label" options={sessionOptions.map((item) => ({value: item.id, label: `${item.label} · ${item.date.slice(0,4)}-${item.date.slice(4,6)}-${item.date.slice(6)}${item.available.includes(`${model}:${mode}`) ? "" : " · human only"}`}))} /></label>
        <label><Text strong>{kind === "persona" ? "Participant" : "Focus participant"}</Text><Select aria-label="Focus participant" className="w-full mt-2" value={personId || ""} onChange={setPerson} options={[...(kind === "persona" ? [] : [{value: "", label: "All participants"}]), ...(kind === "persona" ? filteredPersonas.filter((item) => item.session === session?.id) : payload?.participants || []).map((item) => ({value: item.id, label: item.label}))]} /></label>
      </div>
      <p className="mt-4 mb-0 text-sm text-gray-600">{sessionOptions.length} groups match this selection; {sessionOptions.filter((item) => item.available.includes(`${model}:${mode}`)).length} have cached model output.</p>
    </Card>
    {!session ? <Empty description="No participants or groups match these filters." /> : <>
      <Title level={3} style={{fontSize: 23}}>{topicRecord?.label}</Title>
      <div className="flex flex-wrap gap-2 mb-5"><Tag color="red">{session.label}</Tag><Tag>{split === "group" ? "Group" : "Topic"} split: {session.partitions[maskSource]?.[split] || "Not assigned"}</Tag><Link href={`/conversation-explorer?session=${session.id}&split=${split}&partition=${partition}&model=${model}&mode=${mode}${personId ? `&person=${personId}` : ""}`}>Link to this conversation</Link></div>
      {selectedPersona && <Card className="mb-6" title={`${selectedPersona.label} · Survey responses`}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(selectedPersona.demographics).map(([field, value]) => <div key={field}><Text type="secondary">{demographicLabels[field]}</Text><p className="mt-1 mb-0">{displayAnswer(value)}</p></div>)}</div></Card>}
      {runError && <Alert type={hasRun ? "error" : "info"} showIcon title={hasRun ? "Unable to load conversation" : "Model output unavailable"} description={runError} className="mb-5" />}
      <Tabs activeKey={stage} onChange={setStage} items={STAGES} />
      {loading ? <div className="p-12 text-center"><Spin tip="Loading conversation" /></div> : payload && <div className="grid gap-5 lg:grid-cols-2">
        <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6"><Title level={4}>Human conversation</Title><Records rows={payload.humanData} source="human" stage={stage} person={personId} /></section>
        <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6"><Title level={4}>{selectedModel?.label}</Title>{hasRun ? <Records rows={payload.data} source="model" stage={stage} person={personId} /> : <Empty description="No model output for this selection." image={Empty.PRESENTED_IMAGE_SIMPLE} />}</section>
      </div>}
      <Paragraph type="secondary" className="mt-6" style={{fontSize: 13}}>The explorer shows retained conversations, including missing responses and records excluded by cached validity labels. Human records are paired with the selected model’s annotation cache; the paper’s metrics apply additional observation and validity requirements. Final-opinion validity labels have a documented historical input limitation. <a href="https://github.com/yunshiuan/DEBATE-neurips2026/blob/main/docs/paper_reproduction.md#historical-validity-label-limitation" target="_blank" rel="noreferrer">Evaluation details</a>.</Paragraph>
    </>}
  </>;
}
