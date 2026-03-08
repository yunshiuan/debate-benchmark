"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
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

const VERSION_LABELS = {
  v0: "Full Conversation Simulation",
  v1: "Tweet-guided Conversation Simulation",
  v2: "Next Message Prediction",
};

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

const POLITICAL_IDENTITY_OPTIONS = [
  "strong-republican",
  "republican",
  "independent",
  "democrat",
  "strong-democrat",
  "other",
  "prefer not to answer",
];

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
  const [selectedInitialOpinion, setSelectedInitialOpinion] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [rawHumanData, setRawHumanData] = useState([]);
  const [loadingDemographics, setLoadingDemographics] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingHumanConversation, setLoadingHumanConversation] = useState(false);
  const [loadingInitialOpinions, setLoadingInitialOpinions] = useState(false);
  const [initialOpinionOptions, setInitialOpinionOptions] = useState([]);

  const [ageValue, setAgeValue] = useState(null);
  const [gender, setGender] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [education, setEducation] = useState(null);
  const [raceSelections, setRaceSelections] = useState([]);
  const [incomeValue, setIncomeValue] = useState(null);
  const [politicalViews, setPoliticalViews] = useState(null);
  const [politicalIdentity, setPoliticalIdentity] = useState(null);
  const [maritalStatus, setMaritalStatus] = useState(null);
  const [childrenSchoolSelections, setChildrenSchoolSelections] = useState([]);
  const [residence, setResidence] = useState(null);
  const [bibleBelief, setBibleBelief] = useState(null);
  const [evangelical, setEvangelical] = useState(null);
  const [religion, setReligion] = useState(null);
  const [occupation, setOccupation] = useState(null);

  const hasDemographicFilters =
    ageValue !== null ||
    gender ||
    origin ||
    education ||
    raceSelections.length > 0 ||
    incomeValue !== null ||
    politicalViews ||
    politicalIdentity ||
    maritalStatus ||
    childrenSchoolSelections.length > 0 ||
    residence ||
    bibleBelief ||
    evangelical ||
    religion ||
    occupation;

  const eventFilter = "message_sent";
  const getWorkerColor = (idx) => `hsl(${(idx * 137) % 360}, 70%, 88%)`;
  const initialOpinionIndexRef = useRef(new Map());
  const initialOpinionCacheRef = useRef(new Map());

  const clearDemographicFilters = () => {
    setAgeValue(null);
    setGender(null);
    setOrigin(null);
    setEducation(null);
    setRaceSelections([]);
    setIncomeValue(null);
    setPoliticalViews(null);
    setPoliticalIdentity(null);
    setMaritalStatus(null);
    setChildrenSchoolSelections([]);
    setResidence(null);
    setBibleBelief(null);
    setEvangelical(null);
    setReligion(null);
    setOccupation(null);
  };

  const parseDataPrefix = (prefix) => {
    const parts = String(prefix || "").split("_");
    if (parts.length < 4) {
      return { topicLabel: prefix || "" };
    }
    const topicParts = parts.slice(2, -1);
    return { topicLabel: topicParts.join(" ") };
  };

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
        const encodedPrefix = encodeURIComponent(selectedDataPrefix);
        const encodedModel = encodeURIComponent(selectedModel);
        const apiPath = `/api/conversation-csv?dataPrefix=${encodedPrefix}&model=${encodedModel}&version=${selectedVersion}`;
        const response = await fetch(apiPath);

        if (!response.ok) {
          console.error("Failed to load conversation data:", apiPath);
          setRawData([]);
          setLoadingConversation(false);
          return;
        }

        const payload = await response.json();
        const parsed = normalizeRowsForSource(Array.isArray(payload.data) ? payload.data : [], "model");
        setRawData(parsed);
      } catch (error) {
        console.error("Error loading conversation data:", error);
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
        const encodedPrefix = encodeURIComponent(selectedDataPrefix);
        const apiPath = `/api/conversation-human?dataPrefix=${encodedPrefix}`;
        const response = await fetch(apiPath);

        if (!response.ok) {
          console.error("Failed to load human conversation data:", apiPath);
          setRawHumanData([]);
          setLoadingHumanConversation(false);
          return;
        }

        const payload = await response.json();
        const parsed = normalizeRowsForSource(Array.isArray(payload.data) ? payload.data : [], "human");
        setRawHumanData(parsed);
      } catch (error) {
        console.error("Error loading human conversation data:", error);
        setRawHumanData([]);
      }
      setLoadingHumanConversation(false);
    };

    loadHumanCsvData();
  }, [selectedDataPrefix]);

  const filteredDemographicsBase = useMemo(() => {
    return demographics
      .filter((row) => dataPrefixes.includes(row.data_prefix))
      .filter((row) => {
        if (gender && row.gender !== gender) return false;
        if (origin && row.origin !== origin) return false;
        if (education && row.education !== education) return false;
        if (politicalViews && row.politicalViews !== politicalViews) return false;
        if (politicalIdentity && row.politicalIdentity !== politicalIdentity) return false;
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
    demographics,
    gender,
    origin,
    education,
    politicalViews,
    politicalIdentity,
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

  const filteredDemographics = useMemo(() => {
    if (ageValue === null) return filteredDemographicsBase;
    if (!Array.isArray(ageValue)) return filteredDemographicsBase;
    const [minAge, maxAge] = ageValue;
    return filteredDemographicsBase.filter((row) => {
      const age = Number(row.age);
      if (!Number.isFinite(age)) return false;
      return age >= minAge && age <= maxAge;
    });
  }, [ageValue, filteredDemographicsBase]);

  const personaOptions = useMemo(() => {
    const ids = new Set();
    filteredDemographics.forEach((row) => {
      if (row.worker_id) ids.add(row.worker_id);
    });
    return Array.from(ids).sort();
  }, [filteredDemographics]);

  const ageBounds = useMemo(() => {
    const ages = filteredDemographicsBase
      .map((row) => Number(row.age))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (ages.length === 0) {
      return { min: 0, max: 100 };
    }
    return { min: Math.min(...ages), max: Math.max(...ages) };
  }, [filteredDemographicsBase]);

  const ageMedian = useMemo(() => {
    const ages = filteredDemographicsBase
      .map((row) => Number(row.age))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);
    if (ages.length === 0) return null;
    const mid = Math.floor(ages.length / 2);
    if (ages.length % 2 === 1) return ages[mid];
    return Math.round((ages[mid - 1] + ages[mid]) / 2);
  }, [filteredDemographicsBase]);

  const clampAge = (value) => {
    if (value === null || value === undefined) return value;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;
    return Math.min(ageBounds.max, Math.max(ageBounds.min, numeric));
  };

  const clampAgeRange = (range) => {
    if (!Array.isArray(range) || range.length !== 2) return range;
    const start = clampAge(range[0]);
    const end = clampAge(range[1]);
    if (start === null || end === null) return range;
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    return [min, max];
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialOpinions = async () => {
      const prefixes = [
        ...new Set(
          filteredDemographics.map((row) => row.data_prefix).filter(Boolean)
        ),
      ];

      if (prefixes.length === 0 || !selectedModel || !selectedVersion) {
        setInitialOpinionOptions([]);
        initialOpinionIndexRef.current = new Map();
        setLoadingInitialOpinions(false);
        return;
      }

      setLoadingInitialOpinions(true);
      const options = [];
      const index = new Map();

      for (const prefix of prefixes) {
        const cacheKey = `${prefix}::${selectedModel}::${selectedVersion}`;
        let cacheEntry = initialOpinionCacheRef.current.get(cacheKey);

        if (!cacheEntry) {
          try {
            const encodedPrefix = encodeURIComponent(prefix);
            const encodedModel = encodeURIComponent(selectedModel);
            const apiPath = `/api/conversation-csv?dataPrefix=${encodedPrefix}&model=${encodedModel}&version=${selectedVersion}`;
            const response = await fetch(apiPath);
            if (!response.ok) {
              console.error("Failed to load initial opinions:", apiPath);
              continue;
            }
            const payload = await response.json();
            const rows = normalizeRowsForSource(
              Array.isArray(payload.data) ? payload.data : [],
              "model"
            );
            const initialOpinionByWorker = new Map();
            rows.forEach((row) => {
              if (row.event_type !== "Initial Opinion") return;
              const workerId = row.worker_id || row.sender_id;
              if (!workerId) return;
              const existing = initialOpinionByWorker.get(workerId);
              if (!existing || new Date(row.time) < new Date(existing.time)) {
                initialOpinionByWorker.set(workerId, row);
              }
            });
            cacheEntry = { initialOpinionByWorker };
            initialOpinionCacheRef.current.set(cacheKey, cacheEntry);
          } catch (error) {
            console.error("Error loading initial opinions:", error);
            continue;
          }
        }

        const initialOpinionByWorker = cacheEntry.initialOpinionByWorker || new Map();
        const demographicRows = filteredDemographics.filter(
          (row) => row.data_prefix === prefix
        );
        const topicLabel = parseDataPrefix(prefix).topicLabel;

        demographicRows.forEach((row) => {
          const workerId = row.worker_id;
          if (!workerId) return;
          const opinionRow = initialOpinionByWorker.get(workerId);
          if (!opinionRow) return;
          const rawText = (opinionRow.llm_text || opinionRow.text || "").replace(/\s+/g, " ").trim();
          if (!rawText) return;
          const labelPredRaw =
            opinionRow.label_pred ??
            opinionRow.llm_label_pred ??
            opinionRow.human_label_pred ??
            "";
          const labelPred = String(labelPredRaw).trim() || "Unknown";
          const label = `${workerId}: ${labelPred} - ${topicLabel || "Unknown topic"}`;
          const value = `${prefix}::${workerId}`;
          options.push({ label, value });
          index.set(value, { workerId, dataPrefix: prefix, fullText: rawText, label, labelPred });
        });
      }

      if (cancelled) return;
      options.sort((a, b) => a.label.localeCompare(b.label));
      setInitialOpinionOptions(options);
      initialOpinionIndexRef.current = index;
      setLoadingInitialOpinions(false);
    };

    loadInitialOpinions();

    return () => {
      cancelled = true;
    };
  }, [filteredDemographics, selectedModel, selectedVersion]);

  useEffect(() => {
    if (!selectedInitialOpinion) return;
    if (!initialOpinionIndexRef.current.has(selectedInitialOpinion)) {
      setSelectedInitialOpinion(null);
      setSelectedPersona(null);
      setSelectedDataPrefix(null);
      setRawData([]);
      setRawHumanData([]);
    }
  }, [initialOpinionOptions, selectedInitialOpinion]);

  useEffect(() => {
    if (selectedInitialOpinion) return;
    if (initialOpinionOptions.length === 0) return;
    const first = initialOpinionOptions[0];
    setSelectedInitialOpinion(first.value);
    const info = initialOpinionIndexRef.current.get(first.value);
    if (info) {
      setSelectedPersona(info.workerId);
      setSelectedDataPrefix(info.dataPrefix);
    }
  }, [initialOpinionOptions, selectedInitialOpinion]);

  useEffect(() => {
    if (!selectedPersona) return;
    if (!personaOptions.includes(selectedPersona)) {
      setSelectedPersona(null);
      setSelectedDataPrefix(null);
      setRawData([]);
    }
  }, [personaOptions, selectedPersona]);

  useEffect(() => {
    if (ageValue === null) return;
    if (!Array.isArray(ageValue)) return;
    const clamped = clampAgeRange(ageValue);
    if (!Array.isArray(clamped)) return;
    if (clamped[0] !== ageValue[0] || clamped[1] !== ageValue[1]) {
      setAgeValue(clamped);
    }
  }, [ageBounds, ageValue]);

  useEffect(() => {
    if (!selectedPersona) {
      setSelectedDataPrefix(null);
      return;
    }
    const row = demographics.find((item) => item.worker_id === selectedPersona);
    setSelectedDataPrefix(row?.data_prefix ?? null);
  }, [demographics, selectedPersona]);

  const selectedPersonaRow = useMemo(() => {
    if (!selectedPersona) return null;
    return demographics.find((item) => item.worker_id === selectedPersona) || null;
  }, [demographics, selectedPersona]);

  const selectedInitialOpinionText = useMemo(() => {
    if (!selectedInitialOpinion) return "";
    const info = initialOpinionIndexRef.current.get(selectedInitialOpinion);
    return info?.fullText || "";
  }, [selectedInitialOpinion]);

  const selectedInitialOpinionLabelPred = useMemo(() => {
    if (!selectedInitialOpinion) return "Unknown";
    const info = initialOpinionIndexRef.current.get(selectedInitialOpinion);
    return info?.labelPred || "Unknown";
  }, [selectedInitialOpinion]);

  const initialOpinionDisplay = useMemo(() => {
    if (loadingInitialOpinions) return "Loading...";
    if (selectedInitialOpinionText) return selectedInitialOpinionText;
    if (!selectedInitialOpinion) return "None";
    const info = initialOpinionIndexRef.current.get(selectedInitialOpinion);
    return info?.label || "None";
  }, [loadingInitialOpinions, selectedInitialOpinion, selectedInitialOpinionText]);

  const selectedPersonaSummary = useMemo(() => {
    if (!selectedPersonaRow) return "";
    const fields = [
      { key: "age", label: "Age" },
      { key: "gender", label: "Gender" },
      { key: "ethnicity", label: "Ethnicity" },
      { key: "education", label: "Education" },
      { key: "income", label: "Income" },
      { key: "politicalViews", label: "Political Views" },
      { key: "politicalIdentity", label: "Political Identity" },
      { key: "maritalStatus", label: "Marital Status" },
      { key: "childrenSchool", label: "Children School" },
      { key: "residence", label: "Residence" },
      { key: "bibleBelief", label: "Bible Belief" },
      { key: "evangelical", label: "Evangelical" },
      { key: "religion", label: "Religion" },
      { key: "occupation", label: "Occupation" },
      { key: "occupation-other", label: "Occupation Other" },
      { key: "origin", label: "Origin" },
      { key: "leaning", label: "Leaning" },
      { key: "residency", label: "Residency" },
    ];
    const parts = fields
      .map(({ key, label }) => {
        const value = selectedPersonaRow[key];
        if (!value || !String(value).trim()) return null;
        return `${label} = ${value}`;
      })
      .filter(Boolean);
    return parts.join(", ");
  }, [selectedPersonaRow]);

  const personaMessages = useMemo(() => {
    if (!selectedPersona) return [];
    return rawData.filter(
      (row) => row.sender_id === selectedPersona || row.worker_id === selectedPersona
    );
  }, [rawData, selectedPersona]);

  const workerMaps = useMemo(() => {
    const workerIds = [
      ...new Set(
        [...rawData, ...rawHumanData].map((row) => row.worker_id).filter(Boolean)
      ),
    ];
    const colorMap = {};
    const alignmentMap = {};
    const avatarMap = {};
    workerIds.forEach((id, idx) => {
      colorMap[id] = getWorkerColor(idx);
      alignmentMap[id] = idx % 2 === 0 ? "left" : "right";
      avatarMap[id] = (idx % 5) + 1;
    });
    return { colorMap, alignmentMap, avatarMap };
  }, [rawData, rawHumanData]);

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

  const postHumanOpinions = useMemo(() => {
    if (!selectedPersona) return [];
    return rawHumanData
      .filter(
        (row) =>
          row.event_type === "Post Opinion" &&
          (row.sender_id === selectedPersona || row.worker_id === selectedPersona)
      )
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [rawHumanData, selectedPersona]);

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

  const messageCount = useMemo(() => {
    return personaMessages.filter(
      (row) => row.event_type === "tweet" || row.event_type === eventFilter
    ).length;
  }, [eventFilter, personaMessages]);

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <PersonaExplorerHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <style jsx global>{`
          .persona-initial-opinion-select .ant-select-item-option-content,
          .persona-initial-opinion-select .ant-select-selection-item {
            white-space: normal;
            word-break: break-word;
          }
          .persona-initial-opinion-select.ant-select-single .ant-select-selector {
            height: auto;
            min-height: 32px;
          }
          .persona-initial-opinion-select.ant-select-single .ant-select-selector .ant-select-selection-item {
            height: auto;
            line-height: 1.3;
            padding: 4px 0;
            white-space: normal;
          }
        `}</style>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <Space orientation="vertical" size="middle" style={{ width: "100%", marginBottom: 20 }}>
            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Persona & Initial Opinion
              </Text>
              <Select
                className="persona-initial-opinion-select"
                style={{ width: "100%" }}
                placeholder="Select initial opinion"
                value={selectedInitialOpinion}
                onChange={(value) => {
                  setSelectedInitialOpinion(value);
                  if (!value) {
                    setSelectedPersona(null);
                    setSelectedDataPrefix(null);
                    return;
                  }
                  const info = initialOpinionIndexRef.current.get(value);
                  if (info) {
                    setSelectedPersona(info.workerId);
                    setSelectedDataPrefix(info.dataPrefix);
                  }
                }}
                options={initialOpinionOptions}
                loading={loadingInitialOpinions}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
              {selectedPersonaSummary && (
                <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                  The persona you selected: {selectedPersonaSummary}
                </Text>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Text strong>Human v.s. Model:</Text>
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

            <div className="flex flex-wrap items-center gap-3">
              <Text strong>Version:</Text>
              {versions.length <= 1 ? (
                <Text>
                  {VERSION_LABELS[selectedVersion] ?? selectedVersion ?? "Full Conversation Simulation"}
                </Text>
              ) : (
                <Select
                  style={{ width: "100%", maxWidth: 400 }}
                  placeholder="Select version"
                  value={selectedVersion}
                  onChange={setSelectedVersion}
                  options={versions.map((version) => ({
                    label: VERSION_LABELS[version] ?? version,
                    value: version,
                  }))}
                />
              )}
            </div>

            <Tag color="geekblue" style={{ alignSelf: "flex-start" }}>
              <Text strong style={{ fontSize: 20 }}>
                Topic: {selectedDataPrefix ? parseDataPrefix(selectedDataPrefix).topicLabel : "None"}
              </Text>
            </Tag>
            <Tag color="geekblue" style={{ alignSelf: "flex-start" }}>
              <Text
                strong
                style={{ fontSize: 16, display: "block", whiteSpace: "normal", wordBreak: "break-word" }}
              >
                {(selectedPersona || "Unknown")}&apos;s Initial Private Opinion[
                <span
                  style={{
                    backgroundColor: "#FEF3C7",
                    color: "#92400E",
                    padding: "0 6px",
                    borderRadius: 6,
                    marginLeft: 2,
                    marginRight: 2,
                    display: "inline-block",
                  }}
                >
                  {selectedInitialOpinionLabelPred}
                </span>
                ]: {initialOpinionDisplay}
              </Text>
            </Tag>
            <div className="flex flex-wrap items-center gap-3">
              <Text type="secondary">Scroll down below to see full conversation.</Text>
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  const target = document.getElementById("persona-conversation-section");
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              >
                Scroll to Conversation
              </Button>
            </div>
          </Space>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div
            className="flex flex-wrap items-center justify-between gap-3 mb-4"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              background: "white",
              paddingTop: 4,
              paddingBottom: 4,
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Text strong>Demographics Filters</Text>
              <Tag color="blue">Filtered personas: {personaOptions.length}</Tag>
            </div>
            <Button size="small" onClick={clearDemographicFilters} disabled={!hasDemographicFilters}>
              Clear all
            </Button>
          </div>
          {loadingDemographics ? (
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Age</Text>
                  <div className="flex flex-wrap items-center gap-3">
                    <Slider
                      min={ageBounds.min}
                      max={ageBounds.max}
                      range
                      value={ageValue ?? [ageBounds.min, ageBounds.max]}
                      onChange={(value) => setAgeValue(clampAgeRange(value))}
                      style={{ flex: "1 1 160px" }}
                      marks={{
                        [ageBounds.min]: String(ageBounds.min),
                        ...(ageMedian !== null ? { [ageMedian]: "Median" } : {}),
                        [ageBounds.max]: String(ageBounds.max),
                      }}
                    />
                    <Text type="secondary">
                      {ageValue === null
                        ? "Any"
                        : `${ageValue[0]} - ${ageValue[1]}`}
                    </Text>
                    <Button size="small" onClick={() => setAgeValue(null)} disabled={ageValue === null}>
                      Clear
                    </Button>
                  </div>
                  <img
                    src="/demo_age_fig.svg"
                    alt="Age distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Gender</Text>
                  <SingleBrickSelect
                    options={GENDER_OPTIONS}
                    value={gender}
                    onChange={setGender}
                  />
                  <img
                    src="/demo_gender_fig.svg"
                    alt="Gender distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Country/Region of Origin</Text>
                  <Select
                    style={{ width: "100%" }}
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
                  <div className="flex justify-end">
                    <Button size="small" onClick={() => setOrigin(null)} disabled={origin === null}>
                      Clear
                    </Button>
                  </div>
                  <img
                    src="/demo_origin_fig.svg"
                    alt="Country/Region of Origin distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Highest Level of Education Completed</Text>
                  <SingleBrickSelect
                    options={EDUCATION_OPTIONS}
                    value={education}
                    onChange={setEducation}
                  />
                  <img
                    src="/demo_education_fig.svg"
                    alt="Education distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Race/Ethnicity</Text>
                  <MultiTagSelect
                    options={RACE_OPTIONS}
                    value={raceSelections}
                    onChange={setRaceSelections}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="small"
                      onClick={() => setRaceSelections([])}
                      disabled={raceSelections.length === 0}
                    >
                      Clear
                    </Button>
                  </div>
                  <img
                    src="/demo_ethnicity_fig.svg"
                    alt="Race/Ethnicity distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Household Annual Income</Text>
                  <div className="flex flex-wrap items-center gap-3">
                    <Slider
                      min={0}
                      max={250000}
                      step={25000}
                      dots
                      marks={INCOME_MARKS}
                      value={incomeValue ?? 0}
                      onChange={setIncomeValue}
                      style={{ flex: "1 1 200px" }}
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
                  <img
                    src="/demo_income_fig.svg"
                    alt="Household income distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Political Views</Text>
                  <SingleBrickSelect
                    options={POLITICAL_VIEWS_OPTIONS}
                    value={politicalViews}
                    onChange={setPoliticalViews}
                  />
                  <img
                    src="/demo_political_view_fig.svg"
                    alt="Political views distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Political Identity</Text>
                  <SingleBrickSelect
                    options={POLITICAL_IDENTITY_OPTIONS}
                    value={politicalIdentity}
                    onChange={setPoliticalIdentity}
                  />
                  <img
                    src="/demo_political_party_fig.svg"
                    alt="Political identity distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Marital Status</Text>
                  <SingleBrickSelect
                    options={MARITAL_OPTIONS}
                    value={maritalStatus}
                    onChange={setMaritalStatus}
                  />
                  <img
                    src="/demo_marriage_fig.svg"
                    alt="Marital status distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Children School</Text>
                  <MultiTagSelect
                    options={CHILDREN_SCHOOL_OPTIONS}
                    value={childrenSchoolSelections}
                    onChange={setChildrenSchoolSelections}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="small"
                      onClick={() => setChildrenSchoolSelections([])}
                      disabled={childrenSchoolSelections.length === 0}
                    >
                      Clear
                    </Button>
                  </div>
                  <img
                    src="/demo_children_fig.svg"
                    alt="Children school distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Residence</Text>
                  <SingleBrickSelect
                    options={RESIDENCE_OPTIONS}
                    value={residence}
                    onChange={setResidence}
                  />
                  <img
                    src="/demo_residence_fig.svg"
                    alt="Residence distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Bible Belief</Text>
                  <SingleBrickSelect
                    options={BIBLE_BELIEF_OPTIONS}
                    value={bibleBelief}
                    onChange={setBibleBelief}
                  />
                  <img
                    src="/demo_bible_fig.svg"
                    alt="Bible belief distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Evangelical</Text>
                  <SingleBrickSelect
                    options={EVANGELICAL_OPTIONS}
                    value={evangelical}
                    onChange={setEvangelical}
                  />
                  <img
                    src="/demo_evangelical_fig.svg"
                    alt="Evangelical distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Religion</Text>
                  <SingleBrickSelect
                    options={RELIGION_OPTIONS}
                    value={religion}
                    onChange={setReligion}
                  />
                  <img
                    src="/demo_religion_fig.svg"
                    alt="Religion distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>

              <Card className="shadow-sm" size="small">
                <div className="flex flex-col gap-3">
                  <Text strong>Occupation</Text>
                  <Select
                    style={{ width: "100%" }}
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
                  <div className="flex justify-end">
                    <Button size="small" onClick={() => setOccupation(null)} disabled={occupation === null}>
                      Clear
                    </Button>
                  </div>
                  <img
                    src="/demo_occupuation_fig.svg"
                    alt="Occupation distribution"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {loadingConversation || loadingHumanConversation ? (
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          ) : selectedPersona && rawData.length > 0 ? (
            <>
              <Title level={4} style={{ marginBottom: 16 }}>
                Initial Private Opinion of the person you chose (ID={selectedPersona})
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
                  workerAvatarMap={workerMaps.avatarMap}
                  sourceType="model"
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
                          <ChatDisplay messages={roundMessages.round1} sourceType="model" />
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
                          <ChatDisplay messages={roundMessages.round2} sourceType="model" />
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
                          <ChatDisplay messages={roundMessages.round3} sourceType="model" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              */}

              {(fullRoundData.round1.length > 0 ||
                fullRoundData.round2.length > 0 ||
                fullRoundData.round3.length > 0) && (
                <div id="persona-conversation-section">
                  <Title level={4} style={{ marginBottom: 16 }}>
                    {selectedPersona}&apos;s Chatroom Conversation
                  </Title>

                  {fullRoundData.round1.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Round 1
                      </Title>
                      {mergeAndDedupeMessages(
                        fullRoundDataHuman.round1.filter(isTweet).map((m) => ({ ...m, _source: "human" })),
                        fullRoundData.round1.filter(isTweet).map((m) => ({ ...m, _source: "model" }))
                      ).length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                            Public Tweet-like Posts
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
                                fullRoundDataHuman.round1.filter(isTweet).map((m) => ({ ...m, _source: "human" })),
                                fullRoundData.round1.filter(isTweet).map((m) => ({ ...m, _source: "model" }))
                              )}
                              workerColorMap={workerMaps.colorMap}
                              workerAlignmentMap={workerMaps.alignmentMap}
                              workerAvatarMap={workerMaps.avatarMap}
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
                            messages={fullRoundDataHuman.round1.filter((row) => !isTweet(row))}
                            workerColorMap={workerMaps.colorMap}
                            workerAlignmentMap={workerMaps.alignmentMap}
                            workerAvatarMap={workerMaps.avatarMap}
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
                            messages={fullRoundData.round1.filter((row) => !isTweet(row))}
                            workerColorMap={workerMaps.colorMap}
                            workerAlignmentMap={workerMaps.alignmentMap}
                            workerAvatarMap={workerMaps.avatarMap}
                            sourceType="model"
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
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Public Tweet-like Posts & Conversation
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
                            messages={fullRoundDataHuman.round2}
                            workerColorMap={workerMaps.colorMap}
                            workerAlignmentMap={workerMaps.alignmentMap}
                            workerAvatarMap={workerMaps.avatarMap}
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
                            messages={fullRoundData.round2}
                            workerColorMap={workerMaps.colorMap}
                            workerAlignmentMap={workerMaps.alignmentMap}
                            workerAvatarMap={workerMaps.avatarMap}
                            sourceType="model"
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
                      <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
                        Public Tweet-like Posts & Conversation
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
                            messages={fullRoundDataHuman.round3}
                            workerColorMap={workerMaps.colorMap}
                            workerAlignmentMap={workerMaps.alignmentMap}
                            workerAvatarMap={workerMaps.avatarMap}
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
                            messages={fullRoundData.round3}
                            workerColorMap={workerMaps.colorMap}
                            workerAlignmentMap={workerMaps.alignmentMap}
                            workerAvatarMap={workerMaps.avatarMap}
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
                <>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    Post-discussion Private Opinion
                  </Title>
                  <div className="flex flex-col gap-4 lg:flex-row" style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        backgroundColor: "#F5F5F5",
                        padding: "20px",
                        borderRadius: "8px",
                        maxHeight: "50vh",
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
                        workerColorMap={workerMaps.colorMap}
                        workerAlignmentMap={workerMaps.alignmentMap}
                        workerAvatarMap={workerMaps.avatarMap}
                        sourceType="human"
                      />
                    </div>
                    <div
                      style={{
                        backgroundColor: "#F5F5F5",
                        padding: "20px",
                        borderRadius: "8px",
                        maxHeight: "50vh",
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
                        workerColorMap={workerMaps.colorMap}
                        workerAlignmentMap={workerMaps.alignmentMap}
                        workerAvatarMap={workerMaps.avatarMap}
                        sourceType="model"
                      />
                    </div>
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
