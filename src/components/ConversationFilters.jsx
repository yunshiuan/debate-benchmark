"use client";

import { Select, Space, Typography } from "antd";
import { topicLabelsByPrefix } from "../lib/explorerOptions";

const { Text } = Typography;

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
