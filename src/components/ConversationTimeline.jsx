"use client";

import {Avatar, Empty, Tag, Typography} from "antd";
import {conversationStages, roundChatrooms, stageRecords} from "@/lib/conversationLayout.mjs";
import styles from "./ConversationTimeline.module.css";

const {Title, Text} = Typography;
const participantColor = (id) => `hsl(${((Number(id.slice(1)) - 1) * 137) % 360}, 70%, 88%)`;

function Records({rows, source, participants = []}) {
  if (!rows.length) return <Empty description="No records for this stage and participant selection." image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  return <div className={styles.messages}>{rows.map((row, index) => {
    const color = participantColor(row.participant);
    const isPost = row.event === "tweet";
    const isRight = participants.indexOf(row.participant) % 2 === 1;
    return <article key={index} className={`${styles.message} ${isRight ? styles.reverse : ""}`} data-participant={row.participant} data-source={source}>
      <Avatar size={48} src={`/avatars/${row.participant.slice(1)}.png`} alt="" style={{background: color, border: `3px ${source === "human" ? "solid" : "dashed"} ${color}`, flexShrink: 0}}>{row.participant.slice(1)}</Avatar>
      <div className={`${styles.bubble} ${isPost ? styles.post : ""}`} style={{background: color}}>
        {isPost && <img src="/bookmark.png" alt="" width={40} height={40} className={styles.bookmark} />}
        <Text strong className={styles.participant}>Participant {row.participant.slice(1)}{row.recipient ? ` → Participant ${row.recipient.slice(1)}` : ""}</Text>
        {row.conditioned && <Tag color="blue">Human-conditioned input</Tag>}
        <p className={`conversation-message-text ${styles.text}`}>{row.text.trim() ? row.text : <em>{source === "model" ? (row.conditioned ? "Human input supplied as context; no separate model text recorded." : "No generated response recorded.") : "No response recorded."}</em>}</p>
        <div className={styles.messageType}>{isPost ? "Public post" : row.event === "message_sent" ? "Chat message" : "Private opinion"}</div>
        <div className={styles.labels}>
          {row.stance !== null && <Tag>{row.stance >= 1 && row.stance <= 6 ? `Judge stance: ${row.stance}/6` : `Cached stance outside scale: ${row.stance}`}{row.stance_label ? ` · ${row.stance_label}` : ""}</Tag>}
          {row.participant_rating !== null && row.participant_rating >= 1 && row.participant_rating <= 6 && <Tag>Self-report: {row.participant_rating}/6</Tag>}
          {row.validity === "INVALID" && <Tag color="orange">Excluded by cached validity label</Tag>}
          {row.validity && !["VALID", "INVALID"].includes(row.validity) && <Tag>Validity: {row.validity}</Tag>}
        </div>
      </div>
    </article>;
  })}</div>;
}

function Comparison({human, model, modelLabel, hasRun, participants}) {
  return <div className="grid gap-4 lg:grid-cols-2">
    <section aria-label="Human conversation" className={styles.source}><Title level={5} className={styles.sourceHeading}>Human conversation</Title><Records rows={human} source="human" participants={participants} /></section>
    <section aria-label={modelLabel} className={styles.source}><Title level={5} className={styles.sourceHeading}>{modelLabel}</Title>{hasRun ? <Records rows={model} source="model" participants={participants} /> : <Empty description="No model output for this selection." image={Empty.PRESENTED_IMAGE_SIMPLE} />}</section>
  </div>;
}

export default function ConversationTimeline({payload, modelLabel, hasRun, person}) {
  return <>
    <nav aria-label="Conversation stages" className={styles.navigation}>
      <span>Jump to:</span>
      {conversationStages.map(({key, label}) => <a key={key} href={`#conversation-stage-${key}`}>{label}</a>)}
    </nav>
    <div className="space-y-8">{conversationStages.map(({key, label}) => {
      const human = stageRecords(payload.humanData, key, person);
      const model = stageRecords(payload.data, key, person);
      const rooms = ["initial", "final"].includes(key) ? null : roundChatrooms(human, model);
      return <section key={key} id={`conversation-stage-${key}`} aria-labelledby={`conversation-heading-${key}`} className={styles.stage}>
        <Title level={4} id={`conversation-heading-${key}`}>{label}</Title>
        {rooms?.length ? rooms.map((room, index) => <div key={room.key} className="mb-6" data-chatroom={room.key}>
          <Title level={5} style={{color: "#595959", marginBottom: 12}}>{room.key === "unpaired" ? "Other messages" : `Chatroom ${index + 1} · Participants ${room.participants.map(id => id.slice(1)).join(" and ")}`}</Title>
          <Comparison human={room.human} model={room.model} modelLabel={modelLabel} hasRun={hasRun} participants={room.participants} />
        </div>) : <Comparison human={human} model={model} modelLabel={modelLabel} hasRun={hasRun} />}
      </section>;
    })}</div>
  </>;
}
