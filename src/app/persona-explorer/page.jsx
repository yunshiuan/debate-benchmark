"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, Space, Spin, Typography, Tag } from "antd";
import PersonaExplorerHeader from "../../components/PersonaExplorerHeader";
import ConversationFilters from "../../components/ConversationFilters";
import ChatDisplay from "../../components/ChatDisplay";
import { dataPrefixes, models, versions } from "../../lib/explorerOptions";

const { Title, Text } = Typography;

export default function PersonaExplorer() {
  const [selectedDataPrefix, setSelectedDataPrefix] = useState(dataPrefixes[0]);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);
  const [rawData, setRawData] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [loading, setLoading] = useState(false);

  const eventFilter = "message_sent";

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
        setPersonas([]);
        setSelectedPersona(null);
        setLoading(false);
        return;
      }

      const csvText = await response.text();
      const parsed = parseCsv(csvText);
      setRawData(parsed);

      const personaIds = [
        ...new Set(
          parsed
            .flatMap((row) => [row.worker_id, row.sender_id])
            .filter(Boolean)
        ),
      ].sort();

      setPersonas(personaIds);
      if (!selectedPersona || !personaIds.includes(selectedPersona)) {
        setSelectedPersona(personaIds[0] ?? null);
      }
    } catch (error) {
      console.error("Error loading CSV:", error);
      setRawData([]);
      setPersonas([]);
      setSelectedPersona(null);
    }
    setLoading(false);
  };

  const parseCsv = (text) => {
    if (!text) return [];

    const rows = [];
    let currentRow = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        currentRow.push(currentField);
        currentField = "";
      } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !inQuotes) {
        if (char === "\r") i++;
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some((f) => f.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.some((f) => f.trim())) {
        rows.push(currentRow);
      }
    }

    if (rows.length < 2) return [];

    const headers = rows[0];
    return rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] ?? "";
      });
      return obj;
    });
  };

  const personaMessages = useMemo(() => {
    if (!selectedPersona) return [];
    return rawData.filter(
      (row) => row.sender_id === selectedPersona || row.worker_id === selectedPersona
    );
  }, [rawData, selectedPersona]);

  const initialOpinions = useMemo(() => {
    return personaMessages
      .filter((row) => row.event_type === "Initial Opinion")
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [personaMessages]);

  const roundMessages = useMemo(() => {
    const filterRound = (round) =>
      personaMessages
        .filter(
          (row) =>
            row.chat_round_order === round &&
            (row.event_type === "tweet" || row.event_type === eventFilter)
        )
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    return {
      round1: filterRound("1.0"),
      round2: filterRound("2.0"),
      round3: filterRound("3.0"),
    };
  }, [eventFilter, personaMessages]);

  const messageCount = useMemo(() => {
    return personaMessages.filter(
      (row) => row.event_type === "tweet" || row.event_type === eventFilter
    ).length;
  }, [eventFilter, personaMessages]);

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <PersonaExplorerHeader />

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
          ) : personas.length > 0 ? (
            <>
              <Space direction="vertical" size="middle" style={{ width: "100%", marginBottom: 20 }}>
                <div>
                  <Text strong style={{ display: "block", marginBottom: 8 }}>
                    Persona:
                  </Text>
                  <Select
                    style={{ width: "100%", maxWidth: 400 }}
                    placeholder="Select persona"
                    value={selectedPersona}
                    onChange={setSelectedPersona}
                    options={personas.map((persona) => ({
                      label: persona,
                      value: persona,
                    }))}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>

                <Space size="small" wrap>
                  <Tag color="blue">Personas: {personas.length}</Tag>
                  <Tag color="green">Messages: {messageCount}</Tag>
                  <Tag color="purple">Initial Opinions: {initialOpinions.length}</Tag>
                </Space>
              </Space>

              <Title level={4} style={{ marginBottom: 16 }}>
                Initial Opinion
              </Title>
              <div
                style={{
                  backgroundColor: "#F5F5F5",
                  padding: "20px",
                  borderRadius: "8px",
                  maxHeight: "50vh",
                  overflowY: "auto",
                  marginBottom: 24,
                }}
              >
                <ChatDisplay messages={initialOpinions} />
              </div>

              {(roundMessages.round1.length > 0 ||
                roundMessages.round2.length > 0 ||
                roundMessages.round3.length > 0) && (
                <>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    Debate Contributions
                  </Title>

                  {roundMessages.round1.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Round 1
                      </Title>
                      <div
                        style={{
                          backgroundColor: "#F5F5F5",
                          padding: "20px",
                          borderRadius: "8px",
                          maxHeight: "50vh",
                          overflowY: "auto",
                        }}
                      >
                        <ChatDisplay messages={roundMessages.round1} />
                      </div>
                    </div>
                  )}

                  {roundMessages.round2.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Round 2
                      </Title>
                      <div
                        style={{
                          backgroundColor: "#F5F5F5",
                          padding: "20px",
                          borderRadius: "8px",
                          maxHeight: "50vh",
                          overflowY: "auto",
                        }}
                      >
                        <ChatDisplay messages={roundMessages.round2} />
                      </div>
                    </div>
                  )}

                  {roundMessages.round3.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Round 3
                      </Title>
                      <div
                        style={{
                          backgroundColor: "#F5F5F5",
                          padding: "20px",
                          borderRadius: "8px",
                          maxHeight: "50vh",
                          overflowY: "auto",
                        }}
                      >
                        <ChatDisplay messages={roundMessages.round3} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Title level={4} className="text-gray-400">
                {selectedDataPrefix && selectedModel && selectedVersion
                  ? "No personas found in the selected data"
                  : "Select filters to view persona data"}
              </Title>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
