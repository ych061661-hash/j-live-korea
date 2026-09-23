"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const visitor = require("../calendar/visitor-utils");

const instant = value => new Date(value);

test("ticket states distinguish verified future/past dates from announcement and unknown", () => {
  const now = instant("2026-09-23T02:00:00Z");
  const base = { status: "confirmed", concertDate: "2026-10-10", ticketingStatus: "confirmed" };
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-24" }, now).label, "예매 오픈 예정");
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-22" }, now).label, "예매 시작일 지남");
  assert.equal(visitor.ticketStatus({ ...base, ticketingStatus: "pending_announcement" }, now).label, "공식 발표 대기");
  assert.equal(visitor.ticketStatus({ ...base, ticketingStatus: "unverified" }, now).label, "정보 미확인");
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-24", ticketingStatus: "unverified" }, now).label, "정보 미확인");
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-24", verification: { ticketDate: { status: "unverified" } } }, now).label, "정보 미확인");
});

test("ticket-time comparisons use Seoul time and do not assume a time for date-only notices", () => {
  const base = { status: "confirmed", concertDate: "2026-10-10", ticketingStatus: "confirmed" };
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-23", ticketTime: "오후 12:00" }, instant("2026-09-23T02:59:00Z")).label, "예매 오픈 예정");
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-23", ticketTime: "오후 12:00" }, instant("2026-09-23T03:00:00Z")).label, "예매 시작일 지남");
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-23" }, instant("2026-09-23T02:00:00Z")).label, "예매일 오늘 · 시간 미확인");
});

test("stock status requires an official source and timestamp, and an ended show is not presented as currently on sale", () => {
  const base = { status: "confirmed", concertDate: "2026-10-10", ticketAvailability: "in_stock", ticketingStatus: "confirmed" };
  assert.equal(visitor.ticketStatus({ ...base, ticketStatusVerifiedAt: "2026-09-22T01:00:00+09:00", ticketStatusSource: "https://tickets.example/show" }).label, "판매 중");
  assert.equal(visitor.ticketStatus({ ...base, ticketStatusVerifiedAt: "2026-09-22T01:00:00+09:00" }).label, "정보 미확인");
  assert.equal(visitor.ticketStatus({ ...base, concertDate: "2026-09-22", ticketStatusVerifiedAt: "2026-09-22T01:00:00+09:00", ticketStatusSource: "https://tickets.example/show" }, instant("2026-09-23T02:00:00Z")).label, "공연 종료");
});
