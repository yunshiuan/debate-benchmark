"use client";

import { Typography, Avatar } from "antd";

const { Text } = Typography;

// Color palette for different workers
const workerColors = [
  "#DCF8C6", // Light green (WhatsApp sender)
  "#E3F2FD", // Light blue
  "#FFF9C4", // Light yellow
  "#F3E5F5", // Light purple
];

const getAvatarUrl = (workerId) => {
  if (!workerId) return null;
  const seed = encodeURIComponent(workerId);
  return `https://robohash.org/${seed}?set=set2`;
};

export default function ChatDisplay({ messages, workerColorMap: externalColorMap, workerAlignmentMap: externalAlignmentMap, staggered = false }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No messages to display
      </div>
    );
  }
 
  // Filter out messages with blank text content
  const filteredMessages = messages.filter(msg => {
    const text = msg.llm_text || msg.text || "";
    return text.trim().length > 0;
  });

  if (filteredMessages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No messages to display
      </div>
    );
  }

  // Use external maps if provided, otherwise create local maps
  let workerColorMap = externalColorMap;
  let workerAlignmentMap = externalAlignmentMap;
  
  if (!externalColorMap || !externalAlignmentMap) {
    // Fallback: create local maps
    const workerIds = [...new Set(filteredMessages.map((m) => m.worker_id))];
    workerColorMap = {};
    workerAlignmentMap = {};
    workerIds.forEach((id, idx) => {
      workerColorMap[id] = workerColors[idx % workerColors.length];
      workerAlignmentMap[id] = idx % 2 === 0 ? "left" : "right";
    });
  }

  // If staggered mode, create local alignment map for this subround
  if (staggered) {
    const localWorkerIds = [...new Set(filteredMessages.map((m) => m.worker_id))];
    workerAlignmentMap = {};
    localWorkerIds.forEach((id, idx) => {
      workerAlignmentMap[id] = idx % 2 === 0 ? "left" : "right";
    });
  }

  return (
    <div className="space-y-4">
      {filteredMessages.map((message, idx) => {
        const bgColor = workerColorMap[message.worker_id] || "#F0F0F0";
        const alignment = workerAlignmentMap[message.worker_id] || "left";
        const isRight = alignment === "right";
        const isTweet = message.event_type === "tweet";
        
        return (
          <div
            key={idx}
            className="flex gap-3 items-start"
            style={{
              flexDirection: isRight ? "row-reverse" : "row",
            }}
          >
            <Avatar
              src={getAvatarUrl(message.worker_id)}
              style={{
                backgroundColor: bgColor,
                color: "#333",
                fontWeight: "600",
                border: "2px solid #ddd",
                flexShrink: 0,
              }}
            >
              {message.worker_id?.substring(0, 2).toUpperCase() || "??"}
            </Avatar>
            
            <div className="flex-1" style={{ display: "flex", justifyContent: isRight ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  backgroundColor: bgColor,
                  padding: isTweet ? "16px 18px" : "12px 16px",
                  borderRadius: isTweet ? "12px" : "8px",
                  maxWidth: "80%",
                  boxShadow: isTweet ? "0 2px 6px rgba(0,0,0,0.1)" : "0 1px 2px rgba(0,0,0,0.1)",
                  border: isTweet ? "3px solid #C5050C" : "none",
                  position: isTweet ? "relative" : "static",
                }}
              >
                {isTweet && (
                  <img
                    src="/uw-crest-color-web-digital.svg"
                    alt="UW Crest"
                    width={24}
                    height={24}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                    }}
                  />
                )}
                <Text strong style={{ display: "block", marginBottom: 4, fontSize: isTweet ? "14px" : "13px" }}>
                  Worker {message.worker_id}
                </Text>
                <Text style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                  {message.llm_text || message.text}
                </Text>
                {!isTweet && message.event_type && message.event_type !== "message_sent" && (
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      marginTop: 8,
                      fontSize: "11px",
                      fontStyle: "italic",
                    }}
                  >
                    {message.event_type}
                  </Text>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
