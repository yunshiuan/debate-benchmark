"use client";

import { Typography, Avatar } from "antd";

const { Text } = Typography;

const getWorkerColor = (idx) => `hsl(${(idx * 137) % 360}, 70%, 88%)`;

const AVATAR_COUNT = 5;

const getAvatarUrl = (avatarIndex) => {
  if (!avatarIndex) return null;
  return `/avatars/${avatarIndex}.png`;
};

export default function ChatDisplay({
  messages,
  workerColorMap: externalColorMap,
  workerAlignmentMap: externalAlignmentMap,
  workerAvatarMap: externalAvatarMap,
  staggered = false,
  sourceType = "model",
}) {
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
  let workerAvatarMap = externalAvatarMap || null;
  
  if (!externalColorMap || !externalAlignmentMap) {
    // Fallback: create local maps
    const workerIds = [...new Set(filteredMessages.map((m) => m.worker_id))];
    workerColorMap = {};
    workerAlignmentMap = {};
    workerIds.forEach((id, idx) => {
      workerColorMap[id] = getWorkerColor(idx);
      workerAlignmentMap[id] = idx % 2 === 0 ? "left" : "right";
    });
  }

  if (!workerAvatarMap) {
    const workerIds = [...new Set(filteredMessages.map((m) => m.worker_id).filter(Boolean))];
    workerAvatarMap = {};
    workerIds.forEach((id, idx) => {
      const avatarIndex = (idx % AVATAR_COUNT) + 1;
      workerAvatarMap[id] = avatarIndex;
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
        const messageSource = message._source || sourceType;
        const avatarBorderStyle =
          messageSource === "human"
            ? `3px solid ${bgColor}`
            : `3px dashed ${bgColor}`;
        
        return (
          <div
            key={idx}
            className="flex gap-3 items-start"
            style={{
              flexDirection: isRight ? "row-reverse" : "row",
            }}
          >
            <Avatar
              src={getAvatarUrl(workerAvatarMap[message.worker_id])}
              style={{
                backgroundColor: bgColor,
                color: "#333",
                fontWeight: "600",
                border: avatarBorderStyle,
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
                    src="/bookmark.png"
                    alt="Bookmark"
                    width={40}
                    height={40}
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
