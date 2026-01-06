"use client";

import { useState, useEffect } from "react";
import { Typography, Spin, Tabs } from "antd";
import ConversationExplorerHeader from "../../components/ConversationExplorerHeader";
import ConversationFilters from "../../components/ConversationFilters";
import ChatDisplay from "../../components/ChatDisplay";

const { Title } = Typography;

// Available options - customize these based on your data
const dataPrefixes = [
  '20250307_012440_A_"body_cleanse,"_in_which_you_consume_only_particular_kinds_of_nutrients_over_1-3_days,_helps_your_body_to_eliminate_toxins_01JNQ1111QV26WKRF8M8GPVRJZ',
  "20250307_013238_Regular_fasting_will_improve_your_health_01JNQ1NDBZDSN1FMS20MZGSZF0",
  "20250330_032118_Angels_are_real_01JQJFH2BS7DSH4TZ9CR6C7H91",
  "20250411_023437_The_position_of_the_planets_at_the_time_of_your_birth_can_influence_your_personality_01JRH95VHB1MXGP96QMB69XKQW",
  "20250419_025125_The_US_deficit_increased_after_President_Obama_was_elected_01JS5W9QG0PC5KRJRM42S2JDJS",
];
const models = [
  "gpt-4o-mini-2024-07-18",
  "Llama-3.1-Tulu-3-8B-SFT",
  "Llama-3.1-8B-Instruct",
  "Llama-3.1-70B-Instruct",
  "Mistral-7B-Instruct-v0.3",
  "Qwen2.5-32B-Instruct",
];
const versions = ["v0", "v1", "v2"];

export default function ConversationExplorer() {
  const [selectedDataPrefix, setSelectedDataPrefix] = useState(dataPrefixes[0]);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);
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
                 (row.event_type === "tweet" || row.event_type === "message_sent")
      );
      
      console.log("Total Round 1 messages:", round1.length);
      console.log("Sample Round 1 row:", round1[0]);
      
      // Get unique worker_ids in round 1
      const round1Workers = [...new Set(round1.map(r => r.worker_id))];
      console.log("Round 1 workers:", round1Workers);
      
      // Split workers into 2 pairs (first 2 and last 2)
      const pair1Workers = round1Workers.slice(0, 2);
      const pair2Workers = round1Workers.slice(2, 4);
      
      console.log("Pair 1 workers:", pair1Workers);
      console.log("Pair 2 workers:", pair2Workers);
      
      // Filter messages for each pair, then sort by time
      const pair1Messages = round1
        .filter(row => pair1Workers.includes(row.worker_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      
      const pair2Messages = round1
        .filter(row => pair2Workers.includes(row.worker_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      

    console.log("Pair 1 messages:", pair1Messages);
      setRound1Data({ pair1: pair1Messages, pair2: pair2Messages });

      // Filter for Round 2 data
      const round2 = parsed.filter(
        (row) => row.chat_round_order === "2.0" && 
                 (row.event_type === "tweet" || row.event_type === "message_sent")
      );
      const round2Workers = [...new Set(round2.map(r => r.worker_id))];
      const round2Pair1 = round2
        .filter(row => round2Workers.slice(0, 2).includes(row.worker_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      const round2Pair2 = round2
        .filter(row => round2Workers.slice(2, 4).includes(row.worker_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setRound2Data({ pair1: round2Pair1, pair2: round2Pair2 });

      // Filter for Round 3 data
      const round3 = parsed.filter(
        (row) => row.chat_round_order === "3.0" && 
                 (row.event_type === "tweet" || row.event_type === "message_sent")
      );
      const round3Workers = [...new Set(round3.map(r => r.worker_id))];
      const round3Pair1 = round3
        .filter(row => round3Workers.slice(0, 2).includes(row.worker_id))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      const round3Pair2 = round3
        .filter(row => round3Workers.slice(2, 4).includes(row.worker_id))
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
                  
                  {/* Subround 1: First Pair */}
                  {round1Data.pair1.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Subround 1
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

                  {/* Subround 2: Second Pair */}
                  {round1Data.pair2.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Subround 2
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
                  
                  {/* Subround 1: First Pair */}
                  {round2Data.pair1.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Subround 1
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

                  {/* Subround 2: Second Pair */}
                  {round2Data.pair2.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Subround 2
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
                  
                  {/* Subround 1: First Pair */}
                  {round3Data.pair1.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Subround 1
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

                  {/* Subround 2: Second Pair */}
                  {round3Data.pair2.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Subround 2
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
