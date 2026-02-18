"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Radio,
  Select,
  Slider,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import PersonaExplorerHeader from "../../components/PersonaExplorerHeader";
import ChatDisplay from "../../components/ChatDisplay";
import { dataPrefixes, models, versions } from "../../lib/explorerOptions";

const { Title, Text } = Typography;
const { CheckableTag } = Tag;

const GENDER_OPTIONS = [
  "female",
  "male",
  "non-binary",
  "prefer not to answer",
];

// const RESIDENCY_OPTIONS = [
//   "Albania",
//   "American Samoa",
//   "Andorra",
//   "Anguilla",
//   "Georgia",
//   "Other",
//   "Prefer not to answer",
//   "United Arab Emirates",
//   "United Kingdom of Great Britain and Northern Ireland",
//   "United States Minor Outlying Islands",
//   "United States of America",
//   "Viet Nam",
// ];

const RESIDENCY_OPTIONS = ["United States of America"];

const ORIGIN_OPTIONS = [
  "American Samoa",
  "Andorra",
  "Antigua and Barbuda",
  "Belarus",
  "Brazil",
  "Canada",
  "China",
  "Cuba",
  "Côte d'Ivoire",
  "Dominican Republic",
  "El Salvador",
  "France",
  "Georgia",
  "Germany",
  "Greece",
  "Guatemala",
  "Honduras",
  "Hungary",
  "India",
  "Indonesia",
  "Iraq",
  "Ireland",
  "Italy",
  "Japan",
  "Kazakhstan",
  "Lebanon",
  "Mexico",
  "Morocco",
  "Nigeria",
  "Norway",
  "Other",
  "Philippines",
  "Poland",
  "Portugal",
  "Puerto Rico",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Serbia",
  "South Africa",
  "South Korea",
  "Sweden",
  "Taiwan",
  "Ukraine",
  "United Kingdom",
  "United States",
  "Venezuela",
];

const EDUCATION_OPTIONS = [
  "associate",
  "bachelor",
  "high-school",
  "master-doctoral",
  "prefer not to answer",
  "professional",
  "some-college",
];

const RACE_OPTIONS = [
  "asian",
  "black",
  "hispanic",
  "native-american",
  "white",
  "other",
  "prefer not to answer",
];

const INCOME_RANGES = {
  "less-25k": [0, 25000],
  "25k-50k": [25000, 50000],
  "50k-75k": [50000, 75000],
  "75k-100k": [75000, 100000],
  "100k-150k": [100000, 150000],
  "150k-200k": [150000, 200000],
  "over-200k": [200000, 1000000],
};

const INCOME_MARKS = {
  0: "0",
  25000: "25k",
  50000: "50k",
  75000: "75k",
  100000: "100k",
  125000: "125k",
  150000: "150k",
  175000: "175k",
  200000: "200k",
  225000: "225k",
  250000: "250k",
};

const POLITICAL_VIEWS_OPTIONS = [
  "conservative",
  "dont-know",
  "liberal",
  "moderate",
  "prefer not to answer",
  "very-conservative",
  "very-liberal",
];

const LEANING_OPTIONS = ["democratic", "neither", "republican"];

const MARITAL_OPTIONS = [
  "divorced",
  "living-partner",
  "married",
  "never-married",
  "prefer not to answer",
  "separated",
  "widowed",
];

const CHILDREN_SCHOOL_OPTIONS = [
  "no-children",
  "home",
  "public",
  "private",
  "university",
  "out-of-school",
  "prefer not to answer",
];

const RESIDENCE_OPTIONS = [
  "dont-know",
  "prefer not to answer",
  "rural",
  "suburban",
  "urban",
];

const BIBLE_BELIEF_OPTIONS = [
  "ancient-book",
  "inspired",
  "literal",
  "prefer not to answer",
];

const EVANGELICAL_OPTIONS = [
  "dont-know",
  "no",
  "prefer not to answer",
  "yes",
];

const RELIGION_OPTIONS = [
  "dont-know",
  "jewish",
  "mormon",
  "muslim",
  "no-religion",
  "other-christian",
  "other-non-christian",
  "prefer not to answer",
  "protestant",
  "roman-catholic",
];

const OCCUPATION_OPTIONS = [
  "agriculture",
  "arts",
  "cleaning",
  "construction",
  "education",
  "engineering",
  "finance",
  "government",
  "health-care",
  "insurance",
  "law",
  "maintenance",
  "manufacturing",
  "media",
  "mining",
  "non-profit",
  "other",
  "personal-care",
  "prefer not to answer",
  "real-estate",
  "research",
  "restaurant",
  "sales",
  "transportation",
  "wholesale",
];

function parseArrayField(value) {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return [];
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];
  return inner
    .split(",")
    .map((item) => item.trim())
    .map((item) => item.replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function MultiTagSelect({ options, value, onChange }) {
  return (
    <Space size={[8, 8]} wrap>
      {options.map((option) => (
        <CheckableTag
          key={option}
          checked={value.includes(option)}
          onChange={(checked) => {
            const next = checked
              ? [...value, option]
              : value.filter((item) => item !== option);
            onChange(next);
          }}
        >
          {option}
        </CheckableTag>
      ))}
    </Space>
  );
}

function SingleBrickSelect({ options, value, onChange }) {
  return (
    <Space align="center" size="middle" wrap>
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <Radio.Button key={option} value={option}>
            {option}
          </Radio.Button>
        ))}
      </Radio.Group>
      <Button size="small" onClick={() => onChange(null)} disabled={!value}>
        Clear
      </Button>
    </Space>
  );
}

export default function PersonaExplorer() {
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);
  const [demographics, setDemographics] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [selectedDataPrefix, setSelectedDataPrefix] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [rawHumanData, setRawHumanData] = useState([]);
  const [loadingDemographics, setLoadingDemographics] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingHumanConversation, setLoadingHumanConversation] = useState(false);

  const [ageValue, setAgeValue] = useState(null);
  const [gender, setGender] = useState(null);
  const [residency, setResidency] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [education, setEducation] = useState(null);
  const [raceSelections, setRaceSelections] = useState([]);
  const [incomeValue, setIncomeValue] = useState(null);
  const [politicalViews, setPoliticalViews] = useState(null);
  const [leaning, setLeaning] = useState(null);
  const [maritalStatus, setMaritalStatus] = useState(null);
  const [childrenSchoolSelections, setChildrenSchoolSelections] = useState([]);
  const [residence, setResidence] = useState(null);
  const [bibleBelief, setBibleBelief] = useState(null);
  const [evangelical, setEvangelical] = useState(null);
  const [religion, setReligion] = useState(null);
  const [occupation, setOccupation] = useState(null);

  const eventFilter = "message_sent";
  const workerColors = ["#DCF8C6", "#E3F2FD", "#FFF9C4", "#F3E5F5"];

  const parseDataPrefix = (prefix) => {
    const parts = String(prefix || "").split("_");
    if (parts.length < 4) {
      return { topicLabel: prefix || "" };
    }
    const topicParts = parts.slice(2, -1);
    return { topicLabel: topicParts.join(" ") };
  };

  useEffect(() => {
    const loadDemographics = async () => {
      setLoadingDemographics(true);
      try {
        const response = await fetch("/api/demographics");
        if (!response.ok) {
          console.error("Failed to load demographics");
          setDemographics([]);
          setLoadingDemographics(false);
          return;
        }
        const payload = await response.json();
        setDemographics(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        console.error("Error loading demographics:", error);
        setDemographics([]);
      }
      setLoadingDemographics(false);
    };

    loadDemographics();
  }, []);

  useEffect(() => {
    if (!selectedDataPrefix || !selectedModel || !selectedVersion) return;
    const loadCsvData = async () => {
      setLoadingConversation(true);
      try {
        const csvPath = `/api/conversation-csv?dataPrefix=${selectedDataPrefix}&model=${encodeURIComponent(
          selectedModel
        )}&version=${selectedVersion}`;
        const response = await fetch(csvPath);

        if (!response.ok) {
          console.error("Failed to load CSV:", csvPath);
          setRawData([]);
          setLoadingConversation(false);
          return;
        }

        const csvText = await response.text();
        const parsed = parseCsv(csvText);
        setRawData(parsed);
      } catch (error) {
        console.error("Error loading CSV:", error);
        setRawData([]);
      }
      setLoadingConversation(false);
    };

    loadCsvData();
  }, [selectedDataPrefix, selectedModel, selectedVersion]);

  useEffect(() => {
    if (!selectedDataPrefix) return;
    const loadHumanCsvData = async () => {
      setLoadingHumanConversation(true);
      try {
        const csvPath = `/api/conversation-human?dataPrefix=${selectedDataPrefix}`;
        const response = await fetch(csvPath);

        if (!response.ok) {
          console.error("Failed to load human CSV:", csvPath);
          setRawHumanData([]);
          setLoadingHumanConversation(false);
          return;
        }

        const csvText = await response.text();
        const parsed = parseCsv(csvText);
        setRawHumanData(parsed);
      } catch (error) {
        console.error("Error loading human CSV:", error);
        setRawHumanData([]);
      }
      setLoadingHumanConversation(false);
    };

    loadHumanCsvData();
  }, [selectedDataPrefix]);

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

  const filteredDemographics = useMemo(() => {
    return demographics
      .filter((row) => dataPrefixes.includes(row.data_prefix))
      .filter((row) => {
        if (ageValue !== null && Number(row.age) !== ageValue) return false;
        if (gender && row.gender !== gender) return false;
        if (origin && row.origin !== origin) return false;
        if (education && row.education !== education) return false;
        if (politicalViews && row.politicalViews !== politicalViews) return false;
        if (leaning && row.leaning !== leaning) return false;
        if (maritalStatus && row.maritalStatus !== maritalStatus) return false;
        if (residence && row.residence !== residence) return false;
        if (bibleBelief && row.bibleBelief !== bibleBelief) return false;
        if (evangelical && row.evangelical !== evangelical) return false;
        if (religion && row.religion !== religion) return false;
        if (occupation) {
          const occupationMatch =
            row.occupation === occupation || row["occupation-other"] === occupation;
          if (!occupationMatch) return false;
        }

        if (raceSelections.length > 0) {
          const ethnicity = parseArrayField(row.ethnicity);
          const allMatch = raceSelections.every((race) => ethnicity.includes(race));
          if (!allMatch) return false;
        }

        if (childrenSchoolSelections.length > 0) {
          const children = parseArrayField(row.childrenSchool);
          const allMatch = childrenSchoolSelections.every((child) => children.includes(child));
          if (!allMatch) return false;
        }

        if (incomeValue !== null) {
          const range = INCOME_RANGES[row.income];
          if (!range) return false;
          if (incomeValue < range[0] || incomeValue > range[1]) return false;
        }

        return true;
      });
  }, [
    ageValue,
    demographics,
    gender,
    origin,
    education,
    politicalViews,
    leaning,
    maritalStatus,
    residence,
    bibleBelief,
    evangelical,
    religion,
    occupation,
    raceSelections,
    childrenSchoolSelections,
    incomeValue,
  ]);

  const personaOptions = useMemo(() => {
    const ids = new Set();
    filteredDemographics.forEach((row) => {
      if (row.worker_id) ids.add(row.worker_id);
    });
    return Array.from(ids).sort();
  }, [filteredDemographics]);

  useEffect(() => {
    if (!selectedPersona) return;
    if (!personaOptions.includes(selectedPersona)) {
      setSelectedPersona(null);
      setSelectedDataPrefix(null);
      setRawData([]);
    }
  }, [personaOptions, selectedPersona]);

  useEffect(() => {
    if (!selectedPersona) {
      setSelectedDataPrefix(null);
      return;
    }
    const row = demographics.find((item) => item.worker_id === selectedPersona);
    setSelectedDataPrefix(row?.data_prefix ?? null);
  }, [demographics, selectedPersona]);

  const personaMessages = useMemo(() => {
    if (!selectedPersona) return [];
    return rawData.filter(
      (row) => row.sender_id === selectedPersona || row.worker_id === selectedPersona
    );
  }, [rawData, selectedPersona]);

  const workerMaps = useMemo(() => {
    const workerIds = [...new Set(rawData.map((row) => row.worker_id).filter(Boolean))];
    const colorMap = {};
    const alignmentMap = {};
    workerIds.forEach((id, idx) => {
      colorMap[id] = workerColors[idx % workerColors.length];
      alignmentMap[id] = idx % 2 === 0 ? "left" : "right";
    });
    return { colorMap, alignmentMap };
  }, [rawData]);

  const workerMapsHuman = useMemo(() => {
    const workerIds = [...new Set(rawHumanData.map((row) => row.worker_id).filter(Boolean))];
    const colorMap = {};
    const alignmentMap = {};
    workerIds.forEach((id, idx) => {
      colorMap[id] = workerColors[idx % workerColors.length];
      alignmentMap[id] = idx % 2 === 0 ? "left" : "right";
    });
    return { colorMap, alignmentMap };
  }, [rawHumanData]);

  const initialOpinions = useMemo(() => {
    return personaMessages
      .filter((row) => row.event_type === "Initial Opinion")
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [personaMessages]);

  const postOpinions = useMemo(() => {
    return personaMessages
      .filter((row) => row.event_type === "Post Opinion")
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

  const fullRoundData = useMemo(() => {
    const buildRound = (round) => {
      if (!selectedPersona) return [];
      const roundRows = rawData
        .filter(
          (row) =>
            row.chat_round_order === round &&
            (row.event_type === "tweet" || row.event_type === eventFilter)
        )
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      if (roundRows.length === 0) return [];

      let pairWorkers = null;
      for (const row of roundRows) {
        if (!row.sender_id || !row.recipient_id) continue;
        if (row.sender_id === selectedPersona || row.recipient_id === selectedPersona) {
          pairWorkers = new Set([row.sender_id, row.recipient_id]);
          break;
        }
      }

      if (!pairWorkers) return [];
      return roundRows.filter(
        (row) =>
          pairWorkers.has(row.sender_id) ||
          pairWorkers.has(row.recipient_id) ||
          pairWorkers.has(row.worker_id)
      );
    };

    return {
      round1: buildRound("1.0"),
      round2: buildRound("2.0"),
      round3: buildRound("3.0"),
    };
  }, [eventFilter, rawData, selectedPersona]);

  const fullRoundDataHuman = useMemo(() => {
    const buildRound = (round) => {
      if (!selectedPersona) return [];
      const roundRows = rawHumanData
        .filter(
          (row) =>
            row.chat_round_order === round &&
            (row.event_type === "tweet" || row.event_type === eventFilter)
        )
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      if (roundRows.length === 0) return [];

      let pairWorkers = null;
      for (const row of roundRows) {
        if (!row.sender_id || !row.recipient_id) continue;
        if (row.sender_id === selectedPersona || row.recipient_id === selectedPersona) {
          pairWorkers = new Set([row.sender_id, row.recipient_id]);
          break;
        }
      }

      if (!pairWorkers) return [];
      return roundRows.filter(
        (row) =>
          pairWorkers.has(row.sender_id) ||
          pairWorkers.has(row.recipient_id) ||
          pairWorkers.has(row.worker_id)
      );
    };

    return {
      round1: buildRound("1.0"),
      round2: buildRound("2.0"),
      round3: buildRound("3.0"),
    };
  }, [eventFilter, rawHumanData, selectedPersona]);

  const messageCount = useMemo(() => {
    return personaMessages.filter(
      (row) => row.event_type === "tweet" || row.event_type === eventFilter
    ).length;
  }, [eventFilter, personaMessages]);

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <PersonaExplorerHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {loadingDemographics ? (
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div className="flex flex-wrap items-center gap-3">
                <Text strong className="min-w-[120px]">
                  Age
                </Text>
                <Slider
                  min={0}
                  max={100}
                  value={ageValue ?? 0}
                  onChange={setAgeValue}
                  style={{ width: 280 }}
                />
                <Text type="secondary">{ageValue === null ? "Any" : ageValue}</Text>
                <Button size="small" onClick={() => setAgeValue(null)} disabled={ageValue === null}>
                  Clear
                </Button>
              </div>

              <div>
                <Text strong>Gender</Text>
                <div style={{ marginTop: 8 }}>
                  <SingleBrickSelect
                    options={GENDER_OPTIONS}
                    value={gender}
                    onChange={setGender}
                  />
                </div>
              </div>

              <div>
                <Text strong>Country/Region of Residency</Text>
                <div style={{ marginTop: 8 }}>
                  <Select
                    style={{ width: "100%", maxWidth: 520 }}
                    placeholder="Select residency"
                    value={residency}
                    onChange={setResidency}
                    allowClear
                    showSearch
                    options={RESIDENCY_OPTIONS.map((option) => ({
                      label: option,
                      value: option,
                    }))}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>
              </div>

              <div>
                <Text strong>Country/Region of Origin</Text>
                <div style={{ marginTop: 8 }}>
                  <Select
                    style={{ width: "100%", maxWidth: 520 }}
                    placeholder="Select origin"
                    value={origin}
                    onChange={setOrigin}
                    allowClear
                    showSearch
                    options={ORIGIN_OPTIONS.map((option) => ({
                      label: option,
                      value: option,
                    }))}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>
              </div>

              <div>
                <Text strong>Highest Level of Education Completed</Text>
                <div style={{ marginTop: 8 }}>
                  <SingleBrickSelect
                    options={EDUCATION_OPTIONS}
                    value={education}
                    onChange={setEducation}
                  />
                </div>
              </div>

              <div>
                <Text strong>Race/Ethnicity</Text>
                <div style={{ marginTop: 8 }}>
                  <MultiTagSelect
                    options={RACE_OPTIONS}
                    value={raceSelections}
                    onChange={setRaceSelections}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Text strong className="min-w-[200px]">
                  Household Annual Income
                </Text>
                <Slider
                  min={0}
                  max={250000}
                  step={25000}
                  dots
                  marks={INCOME_MARKS}
                  value={incomeValue ?? 0}
                  onChange={setIncomeValue}
                  style={{ width: 360 }}
                />
                <Text type="secondary">
                  {incomeValue === null ? "Any" : `$${incomeValue.toLocaleString()}`}
                </Text>
                <Button
                  size="small"
                  onClick={() => setIncomeValue(null)}
                  disabled={incomeValue === null}
                >
                  Clear
                </Button>
              </div>

              <div>
                <Text strong>Political Views</Text>
                <div style={{ marginTop: 8 }}>
                  <SingleBrickSelect
                    options={POLITICAL_VIEWS_OPTIONS}
                    value={politicalViews}
                    onChange={setPoliticalViews}
                  />
                </div>
              </div>

              <div>
                <Text strong>Leaning</Text>
                <div style={{ marginTop: 8 }}>
                  <SingleBrickSelect
                    options={LEANING_OPTIONS}
                    value={leaning}
                    onChange={setLeaning}
                  />
                </div>
              </div>

              <div>
                <Text strong>Marital Status</Text>
                <div style={{ marginTop: 8 }}>
                  <SingleBrickSelect
                    options={MARITAL_OPTIONS}
                    value={maritalStatus}
                    onChange={setMaritalStatus}
                  />
                </div>
              </div>

              <div>
                <Text strong>Children School</Text>
                <div style={{ marginTop: 8 }}>
                  <MultiTagSelect
                    options={CHILDREN_SCHOOL_OPTIONS}
                    value={childrenSchoolSelections}
                    onChange={setChildrenSchoolSelections}
                  />
                </div>
              </div>

              <div>
                <Text strong>Residence</Text>
                <div style={{ marginTop: 8 }}>
                  <SingleBrickSelect
                    options={RESIDENCE_OPTIONS}
                    value={residence}
                    onChange={setResidence}
                  />
                </div>
              </div>

              <div>
                <Text strong>Bible Belief</Text>
                <div style={{ marginTop: 8 }}>
                  <SingleBrickSelect
                    options={BIBLE_BELIEF_OPTIONS}
                    value={bibleBelief}
                    onChange={setBibleBelief}
                  />
                </div>
              </div>

              <div>
                <Text strong>Evangelical</Text>
                <div style={{ marginTop: 8 }}>
                  <SingleBrickSelect
                    options={EVANGELICAL_OPTIONS}
                    value={evangelical}
                    onChange={setEvangelical}
                  />
                </div>
              </div>

              <div>
                <Text strong>Religion</Text>
                <div style={{ marginTop: 8 }}>
                  <SingleBrickSelect
                    options={RELIGION_OPTIONS}
                    value={religion}
                    onChange={setReligion}
                  />
                </div>
              </div>

              <div>
                <Text strong>Occupation</Text>
                <div style={{ marginTop: 8 }}>
                  <Select
                    style={{ width: "100%", maxWidth: 520 }}
                    placeholder="Select occupation"
                    value={occupation}
                    onChange={setOccupation}
                    allowClear
                    showSearch
                    options={OCCUPATION_OPTIONS.map((option) => ({
                      label: option,
                      value: option,
                    }))}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>
              </div>
            </Space>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Space direction="vertical" size="middle" style={{ width: "100%", marginBottom: 20 }}>
            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Persona (worker_id)
              </Text>
              <Select
                style={{ width: "100%", maxWidth: 400 }}
                placeholder="Select persona"
                value={selectedPersona}
                onChange={setSelectedPersona}
                options={personaOptions.map((persona) => ({
                  label: persona,
                  value: persona,
                }))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Model
              </Text>
              <Select
                style={{ width: "100%", maxWidth: 400 }}
                placeholder="Select model"
                value={selectedModel}
                onChange={setSelectedModel}
                options={models.map((model) => ({
                  label: model,
                  value: model,
                }))}
              />
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Version
              </Text>
              <Select
                style={{ width: "100%", maxWidth: 400 }}
                placeholder="Select version"
                value={selectedVersion}
                onChange={setSelectedVersion}
                options={versions.map((version) => ({
                  label: version,
                  value: version,
                }))}
              />
            </div>

            <Space size="small" wrap>
              <Tag color="blue">Filtered personas: {personaOptions.length}</Tag>
              <Tag color="green">Messages: {messageCount}</Tag>
              <Tag color="purple">Initial Opinions: {initialOpinions.length}</Tag>
              <Tag color="geekblue">
                Topic: {selectedDataPrefix ? parseDataPrefix(selectedDataPrefix).topicLabel : "None"}
              </Tag>
            </Space>
          </Space>

          {loadingConversation || loadingHumanConversation ? (
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          ) : selectedPersona && rawData.length > 0 ? (
            <>
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
                <ChatDisplay
                  messages={initialOpinions}
                  workerColorMap={workerMaps.colorMap}
                  workerAlignmentMap={workerMaps.alignmentMap}
                />
              </div>

              {/*
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
              */}

              {(fullRoundData.round1.length > 0 ||
                fullRoundData.round2.length > 0 ||
                fullRoundData.round3.length > 0) && (
                <>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    {selectedPersona}&apos;s Chatroom Conversation
                  </Title>

                  {fullRoundData.round1.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Round 1
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
                            messages={fullRoundDataHuman.round1}
                            workerColorMap={workerMapsHuman.colorMap}
                            workerAlignmentMap={workerMapsHuman.alignmentMap}
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
                            messages={fullRoundData.round1}
                            workerColorMap={workerMaps.colorMap}
                            workerAlignmentMap={workerMaps.alignmentMap}
                            staggered
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {fullRoundData.round2.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Round 2
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
                            messages={fullRoundDataHuman.round2}
                            workerColorMap={workerMapsHuman.colorMap}
                            workerAlignmentMap={workerMapsHuman.alignmentMap}
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
                            messages={fullRoundData.round2}
                            workerColorMap={workerMaps.colorMap}
                            workerAlignmentMap={workerMaps.alignmentMap}
                            staggered
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {fullRoundData.round3.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Round 3
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
                            messages={fullRoundDataHuman.round3}
                            workerColorMap={workerMapsHuman.colorMap}
                            workerAlignmentMap={workerMapsHuman.alignmentMap}
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
                            messages={fullRoundData.round3}
                            workerColorMap={workerMaps.colorMap}
                            workerAlignmentMap={workerMaps.alignmentMap}
                            staggered
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {postOpinions.length > 0 && (
                <>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    Post Opinion
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
                    <ChatDisplay
                      messages={postOpinions}
                      workerColorMap={workerMaps.colorMap}
                      workerAlignmentMap={workerMaps.alignmentMap}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Title level={4} className="text-gray-400">
                {selectedPersona
                  ? "No conversation data found for the selected persona"
                  : "Select demographics and a persona to view conversation data"}
              </Title>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
