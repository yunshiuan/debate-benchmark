"use client";

import {useEffect, useMemo, useState} from "react";
import {Alert, Button, Card, Collapse, Empty, Input, Select, Slider, Spin, Table, Tag, Typography} from "antd";
import Link from "next/link";
import ConversationTimeline from "@/components/ConversationTimeline";
import SurveyDistribution from "@/components/SurveyDistribution";
import {demographicLabels, displayAnswer, partitionOptions, splitOptions, versionLabels} from "@/lib/explorerOptions";

const {Paragraph, Text} = Typography;
const selectedOptions = (values) => values.map((value) => ({value, label: displayAnswer(value)}));

async function getJson(url, signal) {
  const response = await fetch(url, {signal});
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Unable to load this view.");
  return payload;
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
  const filterFields = ["gender", "origin", "education", "ethnicity", "income", "politicalIdentity", "politicalViews", "religion", "childrenSchool", "maritalStatus", "residence", "bibleBelief", "evangelical", "occupation", "residency"];
  const availablePeople = kind === "persona" ? filteredPersonas.filter((item) => item.session === session?.id) : payload?.participants || [];
  const initialOpinions = payload?.humanData.filter((row) => row.event === "Initial Opinion" && row.participant === personId) || [];
  const resetFilters = () => {setFilters({}); setQuery(""); setAgeFilter(false);};
  const renderFilter = (field) => {
    const values = [...new Set(demographics.personas.flatMap((item) => {const value = item.demographics[field]; return Array.isArray(value) ? value : value ? [value] : [];}))].sort();
    const change = (value) => {setFilters({...filters, [field]: value}); setSessionId("");};
    return <Card key={field} size="small" className="shadow-sm" title={demographicLabels[field]}>
      {values.length <= 8 ? <div role="group" aria-label={demographicLabels[field]} className="flex flex-wrap gap-2">
        {values.map(value => <button key={value} type="button" aria-pressed={filters[field] === value} onClick={() => change(filters[field] === value ? undefined : value)} className={`rounded border px-3 py-1.5 text-sm ${filters[field] === value ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-blue-500"}`}>{displayAnswer(value)}</button>)}
      </div> : <Select aria-label={demographicLabels[field]} allowClear showSearch optionFilterProp="label" className="w-full" placeholder="Any response" value={filters[field]} onChange={change} options={selectedOptions(values)} />}
      <div className="my-3 text-right"><Button size="small" disabled={!filters[field]} onClick={() => change(undefined)}>Clear</Button></div>
      <SurveyDistribution record={demographics.fields[field]} field={field} label={demographicLabels[field]} />
    </Card>;
  };
  return <>
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 space-y-5">
      <label className="block"><Text strong>Topic</Text><Select aria-label="Topic" className="w-full mt-2" showSearch optionFilterProp="label" value={topic} onChange={(value) => {setTopic(value); setSessionId("");}} options={[{value: "all", label: "All topics"}, ...index.topics.map((item) => ({value: item.id, label: item.label}))]} /></label>
      <div className="flex flex-wrap items-center gap-3"><Text strong>Group ID:</Text><Select aria-label="Conversation group" style={{width: "100%", maxWidth: 400}} value={session?.id} onChange={(value) => {setSessionId(value); setPerson("");}} showSearch optionFilterProp="label" options={sessionOptions.map((item) => ({value: item.id, label: `${item.label} · ${item.date.slice(0,4)}-${item.date.slice(4,6)}-${item.date.slice(6)}${item.available.includes(`${model}:${mode}`) ? "" : " · human only"}`}))} /></div>
      <div className="flex flex-wrap items-center gap-3"><Text strong>Human vs. Model:</Text><Select aria-label="Model" style={{width: "100%", maxWidth: 400}} value={model} onChange={setModel} options={index.models.filter((item) => !item.training_split || item.training_split === split).map((item) => ({value: item.id, label: item.label}))} /></div>
      <label className="block"><Text strong>{kind === "persona" ? "Participant and initial opinion" : "Focus participant"}</Text><Select aria-label="Focus participant" className="w-full mt-2" value={personId || ""} onChange={setPerson} showSearch optionFilterProp="label" options={[...(kind === "persona" ? [] : [{value: "", label: "All participants"}]), ...availablePeople.map((item) => {
        const initial = kind === "persona" ? payload?.humanData.find(row => row.event === "Initial Opinion" && row.participant === item.id)?.text : null;
        return {value: item.id, label: initial ? `${item.label}: ${initial}` : item.label};
      })]} /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label><Text strong>Evaluation split</Text><Select aria-label="Evaluation split" className="w-full mt-2" value={split} options={splitOptions} onChange={changeSplit} /></label>
        <label><Text strong>Partition</Text><Select aria-label="Partition" className="w-full mt-2" value={partition} options={partitionOptions} onChange={setPartition} /></label>
        <label><Text strong>Simulation mode</Text><Select aria-label="Simulation mode" className="w-full mt-2" value={mode} onChange={setMode} options={Object.entries(versionLabels).map(([value, label]) => ({value, label}))} /></label>
      </div>
      <p className="mb-0 text-sm text-gray-600">{versionLabels[mode]}: {mode === "v0" ? "each model continues its generated conversation history." : "each prediction is conditioned on the observed human conversation history."} Human-conditioned inputs are labelled below.</p>
      <p className="mb-0 text-sm text-gray-600">Explore {index.counts.sessions} groups across {index.counts.topics} topics. {sessionOptions.length} groups match this selection; {sessionOptions.filter((item) => item.available.includes(`${model}:${mode}`)).length} have cached model output. Stance labels run from 1 (certainly disagree) to 6 (certainly agree).</p>
      {kind === "persona" && selectedPersona && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <Text strong style={{fontSize: 18, display: "block"}}>Topic you selected: <span className="italic underline">{topicRecord?.label}</span></Text>
        <div><Text strong>{selectedPersona.label} · Survey responses</Text><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-700">{Object.entries(selectedPersona.demographics).map(([field, value]) => <span key={field}><strong>{demographicLabels[field]}:</strong> {displayAnswer(value)}</span>)}</div></div>
        <div><Text strong>Initial private opinion</Text>{initialOpinions.length ? initialOpinions.map((row, i) => <p key={i} className="mt-2 mb-0 italic text-gray-800">{row.text || "No response recorded."}</p>) : <p className="mt-2 mb-0 text-gray-600">No initial opinion recorded.</p>}</div>
        <Button type="primary" href="#persona-conversation-section">Scroll to Conversation</Button>
      </div>}
    </div>
    {kind === "persona" && <>
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-3"><Text strong style={{fontSize: 20}}>Demographics Filters</Text><Tag color="blue">{filteredPersonas.length} matching participants</Tag></div>
          <Button size="small" onClick={resetFilters}>Reset demographics</Button>
        </div>
        <label className="block mb-4"><Text strong>Search survey responses</Text><Input aria-label="Search survey responses" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2" placeholder="Search responses" /></label>
        <p className="text-sm text-gray-600 mb-5">Filters select participants from the 697 evaluation groups. Charts summarize the demographic survey across all 708 recorded sessions; percentages use the respondents to each question.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card size="small" className="shadow-sm" title="Age">
            <label><input type="checkbox" checked={ageFilter} onChange={(event) => setAgeFilter(event.target.checked)} /> Filter age: {ageRange[0]}–{ageRange[1]}</label><Slider range min={18} max={100} value={ageRange} onChange={setAgeRange} disabled={!ageFilter} />
            <SurveyDistribution record={demographics.fields.age} field="age" label="Age" />
          </Card>
          {filterFields.map(renderFilter)}
        </div>
      </div>
      <SurveyOverview demographics={demographics} />
    </>}
    {!session ? <Empty description="No participants or groups match these filters." /> : <section id="persona-conversation-section" className="bg-white rounded-lg shadow p-4 sm:p-6 scroll-mt-4">
      <Tag color="geekblue" style={{marginBottom: 16, maxWidth: "100%", whiteSpace: "normal"}}><Text strong style={{fontSize: 18}}>Topic: {topicRecord?.label}</Text></Tag>
      <div className="flex flex-wrap gap-2 mb-5"><Tag color="red">{session.label}</Tag><Tag>{split === "group" ? "Group" : "Topic"} split: {session.partitions[maskSource]?.[split] || "Not assigned"}</Tag><Link href={`/conversation-explorer?session=${session.id}&split=${split}&partition=${partition}&model=${model}&mode=${mode}${personId ? `&person=${personId}` : ""}`}>Link to this conversation</Link></div>
      {runError && <Alert type={hasRun ? "error" : "info"} showIcon title={hasRun ? "Unable to load conversation" : "Model output unavailable"} description={runError} className="mb-5" />}
      {loading ? <div className="p-12 text-center"><Spin tip="Loading conversation" /></div> : payload && <ConversationTimeline payload={payload} modelLabel={selectedModel?.label} hasRun={hasRun} person={personId} />}
    </section>}
  </>;
}
