"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const attendance = require("../calendar/attendance");

function memoryStorage(initial = null) {
  let value = initial;
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

test("stores seat-level spending and removes legacy fees", () => {
  const storage = memoryStorage();
  const records = attendance.write([{ id: "one", eventId: "show-1", artist: "Band", seat: "R석 A구역", unitPrice: 138000.4, quantity: 2, fees: -3000 }], storage);
  assert.equal(records[0].unitPrice, 138000);
  assert.equal(records[0].quantity, 2);
  assert.equal("fees" in records[0], false);
  assert.deepEqual(attendance.read(storage), records);
});

test("summarizes unique shows, tickets and total spending", () => {
  const records = [
    { id: "one", eventId: "show-1", seat: "R석", unitPrice: 100000, quantity: 2, fees: 4000 },
    { id: "two", eventId: "show-1", seat: "시야제한석", unitPrice: 70000, quantity: 1 },
    { id: "three", eventId: "show-2", seat: "스탠딩", unitPrice: 90000, quantity: 1, fees: 2000 }
  ];
  assert.deepEqual(attendance.summarize(records), { shows: 2, tickets: 4, total: 360000 });
});

test("updates and removes a record by id", () => {
  const first = attendance.upsert([], { id: "one", eventId: "show-1", seat: "R석", unitPrice: 100000 });
  const updated = attendance.upsert(first, { ...first[0], seat: "S석", unitPrice: 80000 });
  assert.equal(updated.length, 1);
  assert.equal(updated[0].seat, "S석");
  assert.deepEqual(attendance.remove(updated, "one"), []);
});
