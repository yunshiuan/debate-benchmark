"use client";

import { useState, useEffect, Suspense } from "react";
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
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);
  const [hasAppliedQuery, setHasAppliedQuery] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [initialOpinions, setInitialOpinions] = useState([]);
  const [round1Data, setRound1Data] = useState({ pair1: [], pair2: [] });
  const [round2Data, setRound2Data] = useState({ pair1: [], pair2: [] });
  const [round3Data, setRound3Data] = useState({ pair1: [], pair2: [] });
  const [loading, setLoading] = useState(false);
  const [workerColorMap, setWorkerColorMap] = useState({});
  const [workerAlignmentMap, setWorkerAlignmentMap] = useState({});

  useEffect(() => {
    if (selectedDataPrefix && selectedModel && selectedVersion) {
      loadCsvData();
    }
  }, [selectedDataPrefix, selectedModel, selectedVersion]);

  useEffect(() => {
    if (hasAppliedQuery) return;
    const topicParam = searchParams.get("topic");
    const modelParam = searchParams.get("model");
    const versionParam = searchParams.get("version");

    if (topicParam && dataPrefixes.includes(topicParam)) {
      setSelectedDataPrefix(topicParam);
    }
    if (modelParam && models.includes(modelParam)) {
      setSelectedModel(modelParam);
    }
    if (versionParam && versions.includes(versionParam)) {
      setSelectedVersion(versionParam);
    }

    if (topicParam || modelParam || versionParam) {
      setHasAppliedQuery(true);
    }
  }, [hasAppliedQuery, searchParams]);

  const event_filter = 'message_sent';

  const loadCsvData = async () => {
    setLoading(true);
    try {
      const csvPath = `/api/conversation-csv?dataPrefix=${selectedDataPrefix}&model=${encodeURIComponent(selectedModel)}&version=${selectedVersion}`;
      const response = await fetch(csvPath);
      
      if (!response.ok) {
        console.error("Failed to load CSV:", csvPath);
        setRawData([]);
        setInitialOpinions([]);
        setLoading(false);
        return;
      }

      const csvText = await response.text();
      const parsed = parseCsv(csvText);
      setRawData(parsed);
      
      // Create global worker color/alignment maps
      const allWorkerIds = [...new Set(parsed.map(r => r.worker_id).filter(Boolean))];
      const colors = [
        "#DCF8C6", // Light green
        "#E3F2FD", // Light blue
        "#FFF9C4", // Light yellow
        "#F3E5F5", // Light purple
      ];
      const colorMap = {};
      const alignmentMap = {};
      allWorkerIds.forEach((id, idx) => {
        colorMap[id] = colors[idx % colors.length];
        alignmentMap[id] = idx % 2 === 0 ? "left" : "right";
      });
      setWorkerColorMap(colorMap);
      setWorkerAlignmentMap(alignmentMap);
      
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

      // Filter for Round 1 data
      const round1 = parsed.filter(
        (row) => row.chat_round_order === "1.0" && 
                 (row.event_type === "tweet" || row.event_type === event_filter)
      );
      
      // Identify pairs based on sender_id and recipient_id
      const round1Pairs = new Map(); // Map of pair key to worker IDs
      round1.forEach(row => {
        if (row.sender_id && row.recipient_id) {
          const pairKey = [row.sender_id, row.recipient_id].sort().join('-');
          if (!round1Pairs.has(pairKey)) {
            round1Pairs.set(pairKey, new Set([row.sender_id, row.recipient_id]));
          }
        }
      });
      
      const round1PairArrays = Array.from(round1Pairs.values()).map(set => Array.from(set));
      const pair1Workers = round1PairArrays[0] || [];
      const pair2Workers = round1PairArrays[1] || [];
      
      // Filter messages for each pair, then sort by time
      const pair1Messages = round1
        .filter(row => pair1Workers.includes(row.sender_id) || pair1Workers.includes(row.recipient_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      
      const pair2Messages = round1
        .filter(row => pair2Workers.includes(row.sender_id) || pair2Workers.includes(row.recipient_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      setRound1Data({ pair1: pair1Messages, pair2: pair2Messages });

      // Filter for Round 2 data
      const round2 = parsed.filter(
        (row) => row.chat_round_order === "2.0" && 
                 (row.event_type === "tweet" || row.event_type === event_filter)
      );
      
      const round2Pairs = new Map();
      round2.forEach(row => {
        if (row.sender_id && row.recipient_id) {
          const pairKey = [row.sender_id, row.recipient_id].sort().join('-');
          if (!round2Pairs.has(pairKey)) {
            round2Pairs.set(pairKey, new Set([row.sender_id, row.recipient_id]));
          }
        }
      });
      
      const round2PairArrays = Array.from(round2Pairs.values()).map(set => Array.from(set));
      const round2Pair1Workers = round2PairArrays[0] || [];
      const round2Pair2Workers = round2PairArrays[1] || [];
      
      const round2Pair1 = round2
        .filter(row => round2Pair1Workers.includes(row.sender_id) || round2Pair1Workers.includes(row.recipient_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      const round2Pair2 = round2
        .filter(row => round2Pair2Workers.includes(row.sender_id) || round2Pair2Workers.includes(row.recipient_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setRound2Data({ pair1: round2Pair1, pair2: round2Pair2 });

      // Filter for Round 3 data
      const round3 = parsed.filter(
        (row) => row.chat_round_order === "3.0" && 
                 (row.event_type === "tweet" || row.event_type === event_filter)
      );
      
      const round3Pairs = new Map();
      round3.forEach(row => {
        if (row.sender_id && row.recipient_id) {
          const pairKey = [row.sender_id, row.recipient_id].sort().join('-');
          if (!round3Pairs.has(pairKey)) {
            round3Pairs.set(pairKey, new Set([row.sender_id, row.recipient_id]));
          }
        }
      });
      
      const round3PairArrays = Array.from(round3Pairs.values()).map(set => Array.from(set));
      const round3Pair1Workers = round3PairArrays[0] || [];
      const round3Pair2Workers = round3PairArrays[1] || [];
      
      const round3Pair1 = round3
        .filter(row => round3Pair1Workers.includes(row.sender_id) || round3Pair1Workers.includes(row.recipient_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      const round3Pair2 = round3
        .filter(row => round3Pair2Workers.includes(row.sender_id) || round3Pair2Workers.includes(row.recipient_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setRound3Data({ pair1: round3Pair1, pair2: round3Pair2 });
    } catch (error) {
      console.error("Error loading CSV:", error);
      setRawData([]);
      setInitialOpinions([]);
      setRound1Data({ pair1: [], pair2: [] });
      setRound2Data({ pair1: [], pair2: [] });
      setRound3Data({ pair1: [], pair2: [] });
    }
    setLoading(false);
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

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <ConversationExplorerHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <ConversationFilters
          dataPrefixes={dataPrefixes}
          models={models}
          versions={versions}
          selectedDataPrefix={selectedDataPrefix}
          selectedModel={selectedModel}
          selectedVersion={selectedVersion}
          onDataPrefixChange={setSelectedDataPrefix}
          onModelChange={setSelectedModel}
          onVersionChange={setSelectedVersion}
        />

        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
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
                <ChatDisplay messages={initialOpinions} workerColorMap={workerColorMap} workerAlignmentMap={workerAlignmentMap} />
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
                      <div
                        style={{
                          backgroundColor: "#F5F5F5",
                          padding: "20px",
                          borderRadius: "8px",
                          maxHeight: "60vh",
                          overflowY: "auto",
                        }}
                      >
                        <ChatDisplay messages={round1Data.pair1} workerColorMap={workerColorMap} workerAlignmentMap={workerAlignmentMap} staggered />
                      </div>
                    </div>
                  )}

                  {/* Chatroom 2: Second Pair */}
                  {round1Data.pair2.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Chatroom 2
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
                        <ChatDisplay messages={round1Data.pair2} workerColorMap={workerColorMap} workerAlignmentMap={workerAlignmentMap} staggered />
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
                      <div
                        style={{
                          backgroundColor: "#F5F5F5",
                          padding: "20px",
                          borderRadius: "8px",
                          maxHeight: "60vh",
                          overflowY: "auto",
                        }}
                      >
                        <ChatDisplay messages={round2Data.pair1} workerColorMap={workerColorMap} workerAlignmentMap={workerAlignmentMap} staggered />
                      </div>
                    </div>
                  )}

                  {/* Chatroom 2: Second Pair */}
                  {round2Data.pair2.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Chatroom 2
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
                        <ChatDisplay messages={round2Data.pair2} workerColorMap={workerColorMap} workerAlignmentMap={workerAlignmentMap} staggered />
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
                      <div
                        style={{
                          backgroundColor: "#F5F5F5",
                          padding: "20px",
                          borderRadius: "8px",
                          maxHeight: "60vh",
                          overflowY: "auto",
                        }}
                      >
                        <ChatDisplay messages={round3Data.pair1} workerColorMap={workerColorMap} workerAlignmentMap={workerAlignmentMap} staggered />
                      </div>
                    </div>
                  )}

                  {/* Chatroom 2: Second Pair */}
                  {round3Data.pair2.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Chatroom 2
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
                        <ChatDisplay messages={round3Data.pair2} workerColorMap={workerColorMap} workerAlignmentMap={workerAlignmentMap} staggered />
                      </div>
                    </div>
                  )}
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
