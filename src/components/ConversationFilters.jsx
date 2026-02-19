"use client";

import { Select, Space, Typography } from "antd";
<<<<<<< HEAD
import { topicLabelsByPrefix } from "@/lib/explorerOptions";
=======
>>>>>>> ce80d8b7 (Polished conversation explorer.)

const { Text } = Typography;

export default function ConversationFilters({
  topics,
  timestamps,
  selectedTopic,
  selectedTimestamp,
  selectedTopicType,
  models,
  versions,
  selectedModel,
  selectedVersion,
  onTopicChange,
  onTimestampChange,
  onTopicTypeChange,
  onModelChange,
  onVersionChange,
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text strong>Topic:</Text>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              {[
                { value: "all", label: "All" },
                { value: "depth", label: "Depth" },
                { value: "breadth", label: "Breadth" },
              ].map((option) => {
                const isActive = selectedTopicType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onTopicTypeChange(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } rounded-md`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Select
            style={{ width: "100%", maxWidth: 600, marginTop: 8 }}
            placeholder="Select topic"
            value={selectedTopic}
            onChange={onTopicChange}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={topics}
          />
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Group ID:
          </Text>
          <Select
            style={{ width: "100%", maxWidth: 400 }}
            placeholder="Select run timestamp"
            value={selectedTimestamp}
            onChange={onTimestampChange}
            options={timestamps}
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
