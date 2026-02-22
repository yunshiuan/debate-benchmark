"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { Typography, Spin } from "antd";
import { useSearchParams } from "next/navigation";
import ConversationExplorerHeader from "../../components/ConversationExplorerHeader";
import ConversationFilters from "../../components/ConversationFilters";
import ChatDisplay from "../../components/ChatDisplay";
import { dataPrefixes, models, versions } from "../../lib/explorerOptions";

const { Title } = Typography;

function ConversationExplorerContent() {
  const searchParams = useSearchParams();
  const [selectedDataPrefix, setSelectedDataPrefix] = useState(dataPrefixes[0]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedTimestamp, setSelectedTimestamp] = useState("");
  const [selectedTopicType, setSelectedTopicType] = useState("all");
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);
  const [hasAppliedQuery, setHasAppliedQuery] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [rawHumanData, setRawHumanData] = useState([]);
  const [initialOpinions, setInitialOpinions] = useState([]);
  const [postOpinions, setPostOpinions] = useState([]);
  const [postHumanOpinions, setPostHumanOpinions] = useState([]);
  const [round1Data, setRound1Data] = useState({ pair1: [], pair2: [] });
  const [round2Data, setRound2Data] = useState({ pair1: [], pair2: [] });
  const [round3Data, setRound3Data] = useState({ pair1: [], pair2: [] });
  const [round1HumanData, setRound1HumanData] = useState({ pair1: [], pair2: [] });
  const [round2HumanData, setRound2HumanData] = useState({ pair1: [], pair2: [] });
  const [round3HumanData, setRound3HumanData] = useState({ pair1: [], pair2: [] });
  const [loading, setLoading] = useState(false);
  const [loadingHuman, setLoadingHuman] = useState(false);
  const [workerColorMap, setWorkerColorMap] = useState({});
  const [workerAlignmentMap, setWorkerAlignmentMap] = useState({});
  const [workerAvatarMap, setWorkerAvatarMap] = useState({});

  const parseDataPrefix = (prefix) => {
    const parts = String(prefix || "").split("_");
    if (parts.length < 4) {
      return { timestamp: "", topicKey: prefix || "", topicLabel: prefix || "", prefix };
    }
    const timestamp = `${parts[0]}_${parts[1]}`;
    const topicParts = parts.slice(2, -1);
    const topicKey = topicParts.join("_");
    const topicLabel = topicParts.join(" ");
    return { timestamp, topicKey, topicLabel, prefix };
  };

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

  const { topicOptions, timestampsByTopic } = useMemo(() => {
    const byTopic = new Map();
    dataPrefixes.forEach((prefix) => {
      const { timestamp, topicKey, topicLabel } = parseDataPrefix(prefix);
      if (!topicKey) return;
      if (!byTopic.has(topicKey)) {
        byTopic.set(topicKey, { label: topicLabel || topicKey, timestamps: [] });
      }
      byTopic.get(topicKey).timestamps.push({ value: timestamp, label: timestamp, prefix });
    });

    const topicOptions = Array.from(byTopic.entries())
      .map(([value, info]) => ({
        value,
        label: info.label,
        topicType: depthTopicSet.has(normalizeTopicLabel(info.label)) ? "depth" : "breadth",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const timestampsByTopic = {};
    byTopic.forEach((info, key) => {
      const sorted = info.timestamps
        .sort((a, b) => b.value.localeCompare(a.value))
        .map(({ value, label, prefix }) => ({ value, label, prefix }));
      timestampsByTopic[key] = sorted;
    });

    return { topicOptions, timestampsByTopic };
  }, []);

  const filteredTopicOptions = useMemo(() => {
    if (selectedTopicType === "all") return topicOptions;
    return topicOptions.filter((option) => option.topicType === selectedTopicType);
  }, [selectedTopicType, topicOptions]);

  useEffect(() => {
    if (!selectedTopic && filteredTopicOptions.length > 0) {
      const { topicKey, timestamp } = parseDataPrefix(
        dataPrefixes.find((prefix) => parseDataPrefix(prefix).topicKey === filteredTopicOptions[0].value)
      );
      setSelectedTopic(topicKey);
      setSelectedTimestamp(timestamp);
    }
  }, [selectedTopic, filteredTopicOptions]);

  useEffect(() => {
    if (selectedDataPrefix && selectedModel && selectedVersion) {
      loadCsvData();
    }
  }, [selectedDataPrefix, selectedModel, selectedVersion]);

  useEffect(() => {
    if (hasAppliedQuery) return;
    const topicParam = searchParams.get("topic");
    const timestampParam = searchParams.get("timestamp");
    const modelParam = searchParams.get("model");
    const versionParam = searchParams.get("version");

    if (topicParam) {
      if (dataPrefixes.includes(topicParam)) {
        const { topicKey, timestamp } = parseDataPrefix(topicParam);
        setSelectedTopic(topicKey);
        setSelectedTimestamp(timestamp);
        setSelectedDataPrefix(topicParam);
      } else if (timestampsByTopic[topicParam]) {
        setSelectedTopic(topicParam);
        if (timestampParam) {
          const match = timestampsByTopic[topicParam].find((t) => t.value === timestampParam);
          if (match) {
            setSelectedTimestamp(match.value);
            setSelectedDataPrefix(match.prefix);
          }
        }
      }
    }
    if (modelParam && models.includes(modelParam)) {
      setSelectedModel(modelParam);
    }
    if (versionParam && versions.includes(versionParam)) {
      setSelectedVersion(versionParam);
    }

    if (topicParam || timestampParam || modelParam || versionParam) {
      setHasAppliedQuery(true);
    }
  }, [hasAppliedQuery, searchParams]);

  const event_filter = 'message_sent';

  const buildRoundData = (parsed, roundOrder) => {
    const roundRows = parsed.filter(
      (row) =>
        row.chat_round_order === roundOrder &&
        (row.event_type === "tweet" || row.event_type === event_filter)
    );

    const roundPairs = new Map();
    roundRows.forEach((row) => {
      if (row.sender_id && row.recipient_id) {
        const pairKey = [row.sender_id, row.recipient_id].sort().join("-");
        if (!roundPairs.has(pairKey)) {
          roundPairs.set(pairKey, new Set([row.sender_id, row.recipient_id]));
        }
      }
    });

    const roundPairArrays = Array.from(roundPairs.values()).map((set) =>
      Array.from(set)
    );
    const pair1Workers = roundPairArrays[0] || [];
    const pair2Workers = roundPairArrays[1] || [];

    const pair1Messages = roundRows
      .filter(
        (row) =>
          pair1Workers.includes(row.sender_id) ||
          pair1Workers.includes(row.recipient_id)
      )
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    const pair2Messages = roundRows
      .filter(
        (row) =>
          pair2Workers.includes(row.sender_id) ||
          pair2Workers.includes(row.recipient_id)
      )
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return { pair1: pair1Messages, pair2: pair2Messages };
  };

  const isTweet = (row) => row.event_type === "tweet";

  const mergeAndDedupeMessages = (messagesA, messagesB) => {
    const merged = [...messagesA, ...messagesB];
    const seen = new Set();
    const deduped = [];
    for (const msg of merged) {
      const key = [
        msg.worker_id || "",
        msg.time || "",
        msg.llm_text || msg.text || "",
        msg.event_type || "",
      ].join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(msg);
    }
    return deduped.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  };

  const buildWorkerMaps = (modelRows, humanRows) => {
    const allWorkerIds = [
      ...new Set(
        [...modelRows, ...humanRows]
          .map((r) => r.worker_id)
          .filter(Boolean)
      ),
    ].sort();
    const getWorkerColor = (idx) => `hsl(${(idx * 137) % 360}, 70%, 88%)`;
    const colorMap = {};
    const alignmentMap = {};
    const avatarMap = {};
    allWorkerIds.forEach((id, idx) => {
      colorMap[id] = getWorkerColor(idx);
      alignmentMap[id] = idx % 2 === 0 ? "left" : "right";
      avatarMap[id] = (idx % 5) + 1;
    });
    setWorkerColorMap(colorMap);
    setWorkerAlignmentMap(alignmentMap);
    setWorkerAvatarMap(avatarMap);
  };

  useEffect(() => {
    if (rawData.length > 0 || rawHumanData.length > 0) {
      buildWorkerMaps(rawData, rawHumanData);
    }
  }, [rawData, rawHumanData]);

  const normalizeRowsForSource = (rows, source) => {
    return rows.map((row) => {
      if (source === "human") {
        const preferredText = row.text || row.llm_text || "";
        return { ...row, text: preferredText, llm_text: "" };
      }
      const preferredText = row.llm_text || row.text || "";
      return { ...row, llm_text: preferredText };
    });
  };

  const loadCsvData = async () => {
    setLoading(true);
    try {
      const encodedPrefix = encodeURIComponent(selectedDataPrefix);
      const encodedModel = encodeURIComponent(selectedModel);
      const csvPath = `/result/eval_v3/validity/${encodedPrefix}/${encodedModel}/simulation-llm-${selectedVersion}.csv`;
      const response = await fetch(csvPath);
      
      if (!response.ok) {
        console.error("Failed to load CSV:", csvPath);
        setRawData([]);
        setInitialOpinions([]);
        setLoading(false);
        return;
      }

      const csvText = await response.text();
      const parsed = normalizeRowsForSource(parseCsv(csvText), "model");
      setRawData(parsed);
      
      // Debug: Check what columns and values we have
      console.log("First parsed row:", parsed[0]);
      console.log("Available columns:", Object.keys(parsed[0] || {}));
      console.log("Sample event_types:", [...new Set(parsed.slice(0, 20).map(r => r.event_type))]);
      console.log("Sample chat_round_order values:", [...new Set(parsed.slice(0, 20).map(r => r.chat_round_order))]);
      
      // Filter for Initial Opinion events
      const initialOps = parsed.filter(
        (row) => row.event_type === "Initial Opinion"
      ).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setInitialOpinions(initialOps);

      const postOps = parsed
        .filter((row) => row.event_type === "Post Opinion")
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setPostOpinions(postOps);

      setRound1Data(buildRoundData(parsed, "1.0"));
      setRound2Data(buildRoundData(parsed, "2.0"));
      setRound3Data(buildRoundData(parsed, "3.0"));
    } catch (error) {
      console.error("Error loading CSV:", error);
      setRawData([]);
      setInitialOpinions([]);
      setRound1Data({ pair1: [], pair2: [] });
      setRound2Data({ pair1: [], pair2: [] });
      setRound3Data({ pair1: [], pair2: [] });
      setPostOpinions([]);
    }
    setLoading(false);
  };

  const loadHumanCsvData = async () => {
    setLoadingHuman(true);
    try {
      const encodedPrefix = encodeURIComponent(selectedDataPrefix);
      const csvPath = `/result/eval_v3/validity/${encodedPrefix}/simulation-human.csv`;
      const response = await fetch(csvPath);

      if (!response.ok) {
        console.error("Failed to load human CSV:", csvPath);
        setRound1HumanData({ pair1: [], pair2: [] });
        setRound2HumanData({ pair1: [], pair2: [] });
        setRound3HumanData({ pair1: [], pair2: [] });
        setLoadingHuman(false);
        return;
      }

      const csvText = await response.text();
      const parsed = normalizeRowsForSource(parseCsv(csvText), "human");
      setRawHumanData(parsed);
      setRound1HumanData(buildRoundData(parsed, "1.0"));
      setRound2HumanData(buildRoundData(parsed, "2.0"));
      setRound3HumanData(buildRoundData(parsed, "3.0"));
      const postOps = parsed
        .filter((row) => row.event_type === "Post Opinion")
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setPostHumanOpinions(postOps);
    } catch (error) {
      console.error("Error loading human CSV:", error);
      setRound1HumanData({ pair1: [], pair2: [] });
      setRound2HumanData({ pair1: [], pair2: [] });
      setRound3HumanData({ pair1: [], pair2: [] });
      setPostHumanOpinions([]);
    }
    setLoadingHuman(false);
  };

  const parseCsv = (text) => {
    if (!text) return [];
    
    // Parse CSV properly handling newlines within quoted fields
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote ("")
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
        // Row separator (only when not in quotes)
        if (char === '\r') i++; // Skip \n in \r\n
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        // Regular character
        currentField += char;
      }
    }
    
    // Add last field and row
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim())) {
        rows.push(currentRow);
      }
    }
    
    if (rows.length < 2) return [];
    
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] ?? "";
      });
      return obj;
    });
    
    return data;
  };

  useEffect(() => {
    if (selectedDataPrefix) {
      loadHumanCsvData();
    }
  }, [selectedDataPrefix]);

  useEffect(() => {
    if (!selectedTopic) return;
    const timestamps = timestampsByTopic[selectedTopic] || [];
    if (!timestamps.length) return;
    const nextTimestamp = selectedTimestamp || timestamps[0].value;
    const match = timestamps.find((t) => t.value === nextTimestamp) || timestamps[0];
    if (match && match.prefix !== selectedDataPrefix) {
      setSelectedTimestamp(match.value);
      setSelectedDataPrefix(match.prefix);
    }
  }, [selectedTopic, selectedTimestamp, selectedDataPrefix, timestampsByTopic]);

  useEffect(() => {
    if (selectedTopicType === "all") return;
    const stillVisible = filteredTopicOptions.some((option) => option.value === selectedTopic);
    if (!stillVisible) {
      const next = filteredTopicOptions[0];
      if (next) {
        setSelectedTopic(next.value);
        setSelectedTimestamp("");
      }
    }
  }, [selectedTopicType, filteredTopicOptions, selectedTopic]);

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <ConversationExplorerHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <ConversationFilters
          topics={filteredTopicOptions}
          timestamps={timestampsByTopic[selectedTopic] || []}
          selectedTopic={selectedTopic}
          selectedTimestamp={selectedTimestamp}
          selectedTopicType={selectedTopicType}
          models={models}
          versions={versions}
          selectedModel={selectedModel}
          selectedVersion={selectedVersion}
          onTopicChange={(value) => {
            setSelectedTopic(value);
            setSelectedTimestamp("");
          }}
          onTimestampChange={(value) => setSelectedTimestamp(value)}
          onTopicTypeChange={setSelectedTopicType}
          onModelChange={setSelectedModel}
          onVersionChange={setSelectedVersion}
        />

        <div className="bg-white rounded-lg shadow p-6">
          {loading || loadingHuman ? (
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          ) : initialOpinions.length > 0 ? (
            <>
              <Title level={4} style={{ marginBottom: 16 }}>
                Initial Opinions
              </Title>
              <div
                style={{
                  backgroundColor: "#F5F5F5",
                  padding: "20px",
                  borderRadius: "8px",
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                <ChatDisplay
                  messages={initialOpinions}
                  workerColorMap={workerColorMap}
                  workerAlignmentMap={workerAlignmentMap}
                  workerAvatarMap={workerAvatarMap}
                  sourceType="model"
                />
              </div>

              {/* Round 1 Data */}
              {(round1Data.pair1.length > 0 || round1Data.pair2.length > 0) && (
                <div style={{ marginTop: 32 }}>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    Round 1 Debate
                  </Title>
                  
                  {/* Chatroom 1: First Pair */}
                  {round1Data.pair1.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Chatroom 1
                      </Title>
                      {mergeAndDedupeMessages(
                        round1HumanData.pair1.filter(isTweet),
                        round1Data.pair1.filter(isTweet)
                      ).length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                            Tweets
                          </Title>
                          <div
                            style={{
                              backgroundColor: "#F5F5F5",
                              padding: "20px",
                              borderRadius: "8px",
                              maxHeight: "60vh",
                              overflowY: "auto",
                            }}
                          >
                            <ChatDisplay
                              messages={mergeAndDedupeMessages(
                                round1HumanData.pair1.filter(isTweet).map((m) => ({ ...m, _source: "human" })),
                                round1Data.pair1.filter(isTweet).map((m) => ({ ...m, _source: "model" }))
                              )}
                              workerColorMap={workerColorMap}
                              workerAlignmentMap={workerAlignmentMap}
                              workerAvatarMap={workerAvatarMap}
                              staggered
                            />
                          </div>
                        </div>
                      )}
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Discussion
                      </Title>
                      <div className="flex flex-col gap-4 lg:flex-row">
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              position: "sticky",
                              top: 0,
                              background: "#F5F5F5",
                              zIndex: 1,
                              paddingTop: 4,
                            }}
                          >
                            Human Discussion
                          </Title>
                          <ChatDisplay
                            messages={round1HumanData.pair1.filter((row) => !isTweet(row))}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="human"
                            staggered
                          />
                        </div>
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              position: "sticky",
                              top: 0,
                              background: "#F5F5F5",
                              zIndex: 1,
                              paddingTop: 4,
                            }}
                          >
                            LLM Discussion
                          </Title>
                          <ChatDisplay
                            messages={round1Data.pair1.filter((row) => !isTweet(row))}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="model"
                            staggered
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chatroom 2: Second Pair */}
                  {round1Data.pair2.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Chatroom 2
                      </Title>
                      {mergeAndDedupeMessages(
                        round1HumanData.pair2.filter(isTweet),
                        round1Data.pair2.filter(isTweet)
                      ).length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                            Tweets
                          </Title>
                          <div
                            style={{
                              backgroundColor: "#F5F5F5",
                              padding: "20px",
                              borderRadius: "8px",
                              maxHeight: "60vh",
                              overflowY: "auto",
                            }}
                          >
                            <ChatDisplay
                              messages={mergeAndDedupeMessages(
                                round1HumanData.pair2.filter(isTweet).map((m) => ({ ...m, _source: "human" })),
                                round1Data.pair2.filter(isTweet).map((m) => ({ ...m, _source: "model" }))
                              )}
                              workerColorMap={workerColorMap}
                              workerAlignmentMap={workerAlignmentMap}
                              workerAvatarMap={workerAvatarMap}
                              staggered
                            />
                          </div>
                        </div>
                      )}
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Discussion
                      </Title>
                      <div className="flex flex-col gap-4 lg:flex-row">
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              position: "sticky",
                              top: 0,
                              background: "#F5F5F5",
                              zIndex: 1,
                              paddingTop: 4,
                            }}
                          >
                            Human Discussion
                          </Title>
                          <ChatDisplay
                            messages={round1HumanData.pair2.filter((row) => !isTweet(row))}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="human"
                            staggered
                          />
                        </div>
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              position: "sticky",
                              top: 0,
                              background: "#F5F5F5",
                              zIndex: 1,
                              paddingTop: 4,
                            }}
                          >
                            LLM Discussion
                          </Title>
                          <ChatDisplay
                            messages={round1Data.pair2.filter((row) => !isTweet(row))}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="model"
                            staggered
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Round 2 Data */}
              {(round2Data.pair1.length > 0 || round2Data.pair2.length > 0) && (
                <div style={{ marginTop: 32 }}>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    Round 2 Debate
                  </Title>
                  
                  {/* Chatroom 1: First Pair */}
                  {round2Data.pair1.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Chatroom 1
                      </Title>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Tweets & Conversation
                      </Title>
                      <div className="flex flex-col gap-4 lg:flex-row">
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              position: "sticky",
                              top: 0,
                              background: "#F5F5F5",
                              zIndex: 1,
                              paddingTop: 4,
                            }}
                          >
                            Human Discussion
                          </Title>
                          <ChatDisplay
                            messages={round2HumanData.pair1}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="human"
                            staggered
                          />
                        </div>
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              position: "sticky",
                              top: 0,
                              background: "#F5F5F5",
                              zIndex: 1,
                              paddingTop: 4,
                            }}
                          >
                            LLM Discussion
                          </Title>
                          <ChatDisplay
                            messages={round2Data.pair1}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="model"
                            staggered
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chatroom 2: Second Pair */}
                  {round2Data.pair2.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Chatroom 2
                      </Title>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Tweets & Conversation
                      </Title>
                      <div className="flex flex-col gap-4 lg:flex-row">
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              position: "sticky",
                              top: 0,
                              background: "#F5F5F5",
                              zIndex: 1,
                              paddingTop: 4,
                            }}
                          >
                            Human Discussion
                          </Title>
                          <ChatDisplay
                            messages={round2HumanData.pair2}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="human"
                            staggered
                          />
                        </div>
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              position: "sticky",
                              top: 0,
                              background: "#F5F5F5",
                              zIndex: 1,
                              paddingTop: 4,
                            }}
                          >
                            LLM Discussion
                          </Title>
                          <ChatDisplay
                            messages={round2Data.pair2}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="model"
                            staggered
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Round 3 Data */}
              {(round3Data.pair1.length > 0 || round3Data.pair2.length > 0) && (
                <div style={{ marginTop: 32 }}>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    Round 3 Debate
                  </Title>
                  
                  {/* Chatroom 1: First Pair */}
                  {round3Data.pair1.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Chatroom 1
                      </Title>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Tweets & Conversation
                      </Title>
                      <div className="flex flex-col gap-4 lg:flex-row">
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              position: "sticky",
                              top: 0,
                              background: "#F5F5F5",
                              zIndex: 1,
                              paddingTop: 4,
                            }}
                          >
                            Human Discussion
                          </Title>
                          <ChatDisplay
                            messages={round3HumanData.pair1}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="human"
                            staggered
                          />
                        </div>
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              position: "sticky",
                              top: 0,
                              background: "#F5F5F5",
                              zIndex: 1,
                              paddingTop: 4,
                            }}
                          >
                            LLM Discussion
                          </Title>
                          <ChatDisplay
                            messages={round3Data.pair1}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="model"
                            staggered
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chatroom 2: Second Pair */}
                  {round3Data.pair2.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Chatroom 2
                      </Title>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Tweets & Conversation
                      </Title>
                      <div className="flex flex-col gap-4 lg:flex-row">
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                            Human
                          </Title>
                          <ChatDisplay
                            messages={round3HumanData.pair2}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="human"
                            staggered
                          />
                        </div>
                        <div
                          style={{
                            backgroundColor: "#F5F5F5",
                            padding: "20px",
                            borderRadius: "8px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                            flex: 1,
                          }}
                        >
                          <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                            Model
                          </Title>
                          <ChatDisplay
                            messages={round3Data.pair2}
                            workerColorMap={workerColorMap}
                            workerAlignmentMap={workerAlignmentMap}
                            workerAvatarMap={workerAvatarMap}
                            sourceType="model"
                            staggered
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(postOpinions.length > 0 || postHumanOpinions.length > 0) && (
                <div style={{ marginTop: 32 }}>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    Post Opinions
                  </Title>
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div
                      style={{
                        backgroundColor: "#F5F5F5",
                        padding: "20px",
                        borderRadius: "8px",
                        maxHeight: "60vh",
                        overflowY: "auto",
                        flex: 1,
                      }}
                    >
                      <Title
                        level={5}
                        style={{
                          marginBottom: 12,
                          color: "#666",
                          position: "sticky",
                          top: 0,
                          background: "#F5F5F5",
                          zIndex: 1,
                          paddingTop: 4,
                        }}
                      >
                        Human Discussion
                      </Title>
                      <ChatDisplay
                        messages={postHumanOpinions}
                        workerColorMap={workerColorMap}
                        workerAlignmentMap={workerAlignmentMap}
                        workerAvatarMap={workerAvatarMap}
                        sourceType="human"
                      />
                    </div>
                    <div
                      style={{
                        backgroundColor: "#F5F5F5",
                        padding: "20px",
                        borderRadius: "8px",
                        maxHeight: "60vh",
                        overflowY: "auto",
                        flex: 1,
                      }}
                    >
                      <Title
                        level={5}
                        style={{
                          marginBottom: 12,
                          color: "#666",
                          position: "sticky",
                          top: 0,
                          background: "#F5F5F5",
                          zIndex: 1,
                          paddingTop: 4,
                        }}
                      >
                        LLM Discussion
                      </Title>
                      <ChatDisplay
                        messages={postOpinions}
                        workerColorMap={workerColorMap}
                        workerAlignmentMap={workerAlignmentMap}
                        workerAvatarMap={workerAvatarMap}
                        sourceType="model"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Title level={4} className="text-gray-400">
                {selectedDataPrefix && selectedModel && selectedVersion
                  ? "No initial opinions found in the selected data"
                  : "Select filters to view conversation data"}
              </Title>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ConversationExplorer() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 font-sans">
        <ConversationExplorerHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          </div>
        </div>
      </main>
    }>
      <ConversationExplorerContent />
    </Suspense>
  );
}
