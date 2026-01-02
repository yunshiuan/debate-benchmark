"use client";

import { Table, Typography, Divider } from "antd";

const { Title } = Typography;

/**
 * sections: Array<{
 *   id: string;
 *   levelLabel: string; // e.g. "Round Level Metrics" or "Message Level Metrics"
 *   subsections: Array<{
 *     id: string;
 *     versionLabel: string; // e.g. "Simulation Mode 1: ... (v2)"
 *     columns: Antd column definitions
 *     data: Antd dataSource rows
 *   }>
 * }>
 */
export default function LeaderboardTable({ sections }) {
  if (!sections || sections.length === 0) {
    return (
      <div className="text-center text-gray-400">
        <Title level={4} className="text-gray-400">
          No leaderboard data available.
        </Title>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <div key={section.id} className="bg-white rounded-lg shadow p-6">
          <Title level={3} style={{ margin: 0, marginBottom: 24 }}>
            {section.levelLabel}
          </Title>

          <div className="space-y-8">
            {section.subsections && section.subsections.map((subsection) => (
              <div key={subsection.id}>
                <Title level={5} style={{ margin: 0, marginBottom: 12, color: "#666" }}>
                  {subsection.versionLabel}
                </Title>
                <Table
                  size="small"
                  columns={subsection.columns}
                  dataSource={subsection.data}
                  pagination={false}
                  scroll={{ x: "max-content" }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
