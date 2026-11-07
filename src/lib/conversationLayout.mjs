export const conversationStages = [
  {key: "initial", label: "Initial private opinions"},
  {key: "1", label: "Round 1"},
  {key: "2", label: "Round 2"},
  {key: "3", label: "Round 3"},
  {key: "final", label: "Final private opinions"},
];

export function stageRecords(rows, stage, person) {
  return rows.filter((row) => {
    const inStage = stage === "initial" ? row.event === "Initial Opinion"
      : stage === "final" ? row.event === "Post Opinion"
      : row.round === Number(stage) && ["tweet", "message_sent"].includes(row.event);
    return inStage && (!person || row.participant === person || row.recipient === person);
  });
}

// Use recorded pair identities on both sides. A row without a recipient can be
// assigned only when that participant has exactly one recorded pair this round.
// Keep ambiguous/unpaired rows visible rather than dropping or duplicating them.
export function roundChatrooms(human, model) {
  const pairKey = (row) => row.recipient && row.recipient !== row.participant
    ? [row.participant, row.recipient].sort().join(":") : null;
  const pairs = [...new Set([...human, ...model].map(pairKey).filter(Boolean))].sort();
  const rooms = new Map(pairs.map((key) => [key, {key, participants: key.split(":"), human: [], model: []}]));
  for (const [source, rows] of [["human", human], ["model", model]]) {
    for (const row of rows) {
      const candidates = pairs.filter((key) => key.split(":").includes(row.participant));
      const key = pairKey(row) || (candidates.length === 1 ? candidates[0] : "unpaired");
      if (!rooms.has(key)) rooms.set(key, {key, participants: [], human: [], model: []});
      rooms.get(key)[source].push(row);
    }
  }
  return [...rooms.values()].filter((room) => room.human.length || room.model.length);
}
