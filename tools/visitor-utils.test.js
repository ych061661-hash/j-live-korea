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
  assert.equal(visitor.ticketStatus({ ...base, ticketingStatus: "pending_announcement" }, now).label, "예매 일정 발표 대기");
  assert.equal(visitor.ticketStatus({ ...base, verification: { ticketing: { status: "pending_announcement" } } }, now).label, "예매 일정 발표 대기");
  assert.equal(visitor.ticketStatus({ ...base, ticketingStatus: "unverified" }, now).label, "예매 일정 미확인");
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-24", ticketingStatus: "unverified" }, now).label, "예매 일정 미확인");
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-24", verification: { ticketDate: { status: "unverified" } } }, now).label, "예매 일정 미확인");
});

test("ticket-time comparisons use Seoul time and do not assume a time for date-only notices", () => {
  const base = { status: "confirmed", concertDate: "2026-10-10", ticketingStatus: "confirmed" };
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-23", ticketTime: "오후 12:00" }, instant("2026-09-23T02:59:00Z")).label, "예매 오픈 예정");
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-23", ticketTime: "오후 12:00" }, instant("2026-09-23T03:00:00Z")).label, "예매 시작일 지남");
  assert.equal(visitor.ticketStatus({ ...base, ticketDate: "2026-09-23" }, instant("2026-09-23T02:00:00Z")).label, "예매일 오늘 · 시간 미확인");
});

test("ticket schedule and current stock are separate; stock requires official evidence and ended shows are not current sales", () => {
  const base = { status: "confirmed", concertDate: "2026-10-10", ticketAvailability: "in_stock", ticketingStatus: "confirmed" };
  const checked = { ...base, ticketStatusVerifiedAt: "2026-09-22T01:00:00+09:00", ticketStatusSource: "https://tickets.example/show" };
  assert.equal(visitor.ticketStatus(checked, instant("2026-09-23T02:00:00Z")).label, "예매 일정 미확인");
  assert.equal(visitor.ticketAvailability(checked, instant("2026-09-23T02:00:00Z")).label, "판매 중");
  assert.equal(visitor.ticketAvailability({ ...base, ticketStatusVerifiedAt: "2026-09-22T01:00:00+09:00" }, instant("2026-09-23T02:00:00Z")).label, "현재 판매 상태는 공식 예매처에서 확인");
  assert.equal(visitor.ticketAvailability(checked, instant("2026-09-23T02:00:00Z")).note, "확인 시점 기준 2026-09-22");
  assert.equal(visitor.ticketAvailability({ ...checked, concertDate: "2026-09-22" }, instant("2026-09-23T02:00:00Z")).label, "공연 종료");
});

test("Vaundy-style pending announcement stays a ticket-schedule state and never implies sales status", () => {
  const event = { status: "confirmed", concertDate: "2026-10-10", ticketingStatus: "pending_announcement" };
  const now = instant("2026-09-23T02:00:00Z");
  assert.equal(visitor.ticketStatus(event, now).label, "예매 일정 발표 대기");
  assert.equal(visitor.ticketAvailability(event, now).label, "현재 판매 상태는 공식 예매처에서 확인");
});

test("verification dates never borrow the body edit date or an unverified stock timestamp", () => {
  const dates = visitor.verificationDates({
    verifiedAt: "2026-09-20",
    priceVerifiedAt: "2026-09-21",
    ticketAvailability: "sold_out",
    ticketStatusVerifiedAt: "2026-09-22T01:00:00+09:00"
  });
  assert.deepEqual(dates, { schedule: "2026-09-20", price: "2026-09-21", availability: "", article: "" });
  assert.equal(visitor.priceStatus({ verification: { price: { status: "pending_announcement" } } }).label, "가격 발표 대기");
  assert.equal(visitor.priceStatus({ ticketingStatus: "pending_announcement" }).label, "가격 미확인");
});

test("verification summary omits an unrecorded body edit date and includes only a real one", () => {
  const event = { scheduleVerifiedAt: "2026-09-20", priceVerifiedAt: "2026-09-21" };
  assert.equal(visitor.verificationSummary(event), "일정 확인 2026-09-20 · 가격 확인 2026-09-21 · 판매 상태 확인 미확인");
  assert.equal(visitor.verificationSummary({ ...event, articleUpdatedAt: "2026-09-22" }), "일정 확인 2026-09-20 · 가격 확인 2026-09-21 · 판매 상태 확인 미확인 · 본문 수정 2026-09-22");
});
