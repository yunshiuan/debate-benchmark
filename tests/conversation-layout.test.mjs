import test from "node:test";
import assert from "node:assert/strict";
import {roundChatrooms, stageRecords} from "../src/lib/conversationLayout.mjs";

test("chatrooms preserve every source record, including blanks and unpaired messages", () => {
  const human = [
    {participant:"p1",recipient:"p2",text:"human"},
    {participant:"p1",recipient:null,text:"public post"},
    {participant:"p3",recipient:null,text:"unpaired"},
  ];
  const model = [
    {participant:"p2",recipient:"p1",text:""},
    {participant:"p4",recipient:null,text:"only model"},
  ];
  const rooms = roundChatrooms(human, model);
  assert.deepEqual(rooms.map(room => room.key), ["p1:p2", "unpaired"]);
  assert.deepEqual(rooms[0].human, human.slice(0,2));
  assert.deepEqual(rooms.flatMap(room => room.human), human);
  assert.deepEqual(rooms.flatMap(room => room.model), model);
  assert.equal(rooms[0].model[0].text, "");
});

test("ambiguous pair membership never duplicates or invents a recipient", () => {
  const ambiguous = {participant:"p1",recipient:null,text:"original"};
  const human = [{participant:"p1",recipient:"p2"}, ambiguous];
  const model = [{participant:"p1",recipient:"p3"}];
  const rooms = roundChatrooms(human,model);
  assert.equal(rooms.find(room => room.key === "unpaired").human[0], ambiguous);
  assert.equal(rooms.flatMap(room => room.human).length, human.length);
  assert.equal(ambiguous.recipient, null);
});

test("stage and participant filters retain both sides of a selected participant's chat", () => {
  const rows = [
    {event:"Initial Opinion",round:0,participant:"p1"},
    {event:"tweet",round:1,participant:"p1",recipient:"p2"},
    {event:"message_sent",round:1,participant:"p2",recipient:"p1"},
    {event:"message_sent",round:1,participant:"p3",recipient:"p4"},
    {event:"Post Opinion",round:4,participant:"p1"},
  ];
  assert.deepEqual(stageRecords(rows,"1","p1"), rows.slice(1,3));
  assert.deepEqual(stageRecords(rows,"initial","p1"), rows.slice(0,1));
  assert.deepEqual(stageRecords(rows,"final","p1"), rows.slice(4));
});
