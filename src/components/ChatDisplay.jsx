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
  allLeft = false,
  largeMode = false,
}) {
  // Size configurations based on largeMode
  const sizes = largeMode
    ? {
        avatarSize: 56,
        gap: 20,
        padding: "24px 28px",
        tweetPadding: "28px 32px",
        workerFontSize: "18px",
        tweetWorkerFontSize: "19px",
        textFontSize: "18px",
        labelFontSize: "15px",
        spaceClass: "space-y-8",
      }
    : {
        avatarSize: 48,
        gap: 16,
        padding: "20px 24px",
        tweetPadding: "24px 28px",
        workerFontSize: "16px",
        tweetWorkerFontSize: "17px",
        textFontSize: "16px",
        labelFontSize: "13px",
        spaceClass: "space-y-6",
      };
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

  // If allLeft mode, force all avatars to the left
  if (allLeft) {
    const localWorkerIds = [...new Set(filteredMessages.map((m) => m.worker_id))];
    workerAlignmentMap = {};
    localWorkerIds.forEach((id) => {
      workerAlignmentMap[id] = "left";
    });
  }

  return (
    <div className={sizes.spaceClass}>
      {filteredMessages.map((message, idx) => {
        const bgColor = workerColorMap[message.worker_id] || "#F0F0F0";
        const alignment = workerAlignmentMap[message.worker_id] || "left";
        const isRight = alignment === "right";
        const isTweet = message.event_type === "tweet";
        const labelPredRaw =
          message.label_pred ?? message.llm_label_pred ?? message.human_label_pred ?? "";
        const labelPred = String(labelPredRaw).trim();
        const showLabelPred =
          labelPred &&
          (message.event_type === "Initial Opinion" || message.event_type === "Post Opinion");
        const messageSource = message._source || sourceType;
        const avatarBorderStyle =
          messageSource === "human"
            ? `3px solid ${bgColor}`
            : `3px dashed ${bgColor}`;
        
        return (
          <div
            key={idx}
            className="flex items-start"
            style={{
              flexDirection: isRight ? "row-reverse" : "row",
              gap: sizes.gap,
            }}
          >
            <Avatar
              size={sizes.avatarSize}
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
                  padding: isTweet ? sizes.tweetPadding : sizes.padding,
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
                    width={largeMode ? 48 : 40}
                    height={largeMode ? 48 : 40}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                    }}
                  />
                )}
                <Text strong style={{ display: "block", marginBottom: 4, fontSize: isTweet ? sizes.tweetWorkerFontSize : sizes.workerFontSize }}>
                  Worker {message.worker_id}
                </Text>
                <Text style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", fontSize: sizes.textFontSize }}>
                  {message.llm_text || message.text}
                </Text>
                {isTweet && labelPred && (
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      marginTop: largeMode ? 12 : 8,
                      fontSize: sizes.labelFontSize,
                      fontStyle: "italic",
                    }}
                  >
                    Tweet{" "}
                    <span
                      style={{
                        backgroundColor: "#FEF3C7",
                        color: "#92400E",
                        padding: "0 6px",
                        borderRadius: 6,
                        marginLeft: 6,
                        display: "inline-block",
                        fontStyle: "normal",
                      }}
                    >
                      <span style={{ color: "#000000", fontWeight: 700 }}>[</span>
                      Stance label = {labelPred}
                      <span style={{ color: "#000000", fontWeight: 700 }}>]</span>
                    </span>
                  </Text>
                )}
                {!isTweet && message.event_type && message.event_type !== "message_sent" && (
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      marginTop: largeMode ? 12 : 8,
                      fontSize: sizes.labelFontSize,
                      fontStyle: "italic",
                    }}
                  >
                    {message.event_type}
                    {showLabelPred && (
                      <span
                        style={{
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          padding: "0 6px",
                          borderRadius: 6,
                          marginLeft: 6,
                          display: "inline-block",
                          fontStyle: "normal",
                        }}
                      >
                        <span style={{ color: "#000000", fontWeight: 700 }}>[</span>
                        Stance label = {labelPred}
                        <span style={{ color: "#000000", fontWeight: 700 }}>]</span>
                      </span>
                    )}
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
