"use client";

import { Select, Space, Typography } from "antd";

const { Text } = Typography;

// Mapping from data prefix folder names to human-readable topics
const topicLabelsByPrefix = {
  '20250307_012440_A_"body_cleanse,"_in_which_you_consume_only_particular_kinds_of_nutrients_over_1-3_days,_helps_your_body_to_eliminate_toxins_01JNQ1111QV26WKRF8M8GPVRJZ':
    'A "body cleanse," in which you consume only particular kinds of nutrients over 1-3 days, helps your body to eliminate toxins.',
  "20250307_013238_Regular_fasting_will_improve_your_health_01JNQ1NDBZDSN1FMS20MZGSZF0":
    "Regular fasting will improve your health.",
  "20250330_032118_Angels_are_real_01JQJFH2BS7DSH4TZ9CR6C7H91":
    "Angels are real.",
  "20250411_023437_The_position_of_the_planets_at_the_time_of_your_birth_can_influence_your_personality_01JRH95VHB1MXGP96QMB69XKQW":
    "The position of the planets at the time of your birth can influence your personality.",
  "20250419_025125_The_US_deficit_increased_after_President_Obama_was_elected_01JS5W9QG0PC5KRJRM42S2JDJS":
    "The U.S. deficit increased after President Obama was elected.",
};

export default function ConversationFilters({
  dataPrefixes,
  models,
  versions,
  selectedDataPrefix,
  selectedModel,
  selectedVersion,
  onDataPrefixChange,
  onModelChange,
  onVersionChange,
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Topic:
          </Text>
          <Select
            style={{ width: "100%", maxWidth: 600 }}
            placeholder="Select topic"
            value={selectedDataPrefix}
            onChange={onDataPrefixChange}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={dataPrefixes.map((prefix) => ({
              label: topicLabelsByPrefix[prefix] ?? prefix,
              value: prefix,
            }))}
          />
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Model:
          </Text>
          <Select
            style={{ width: "100%", maxWidth: 400 }}
            placeholder="Select model"
            value={selectedModel}
            onChange={onModelChange}
            options={models.map((model) => ({
              label: model,
              value: model,
            }))}
          />
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Version:
          </Text>
          <Select
            style={{ width: "100%", maxWidth: 400 }}
            placeholder="Select version"
            value={selectedVersion}
            onChange={onVersionChange}
            options={versions.map((version) => ({
              label: version,
              value: version,
            }))}
          />
        </div>
      </Space>
    </div>
  );
}
