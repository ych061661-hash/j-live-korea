const fs = require("node:fs");
const path = require("node:path");

const FIELD_NAMES = ["artist", "concertDate", "venue", "ticketDate", "presaleDate", "price", "ticketConditions", "availability"];
const HOSTING_STATES = new Set(["unverified", "confirmed", "conflict"]);
const TICKETING_STATES = new Set(["unverified", "confirmed", "pending_announcement", "conflict"]);

function asDate(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? null : date;
}

function sourcesFor(event, field) {
  const record = event?.verification?.[field];
  return Array.isArray(record?.sources) ? record.sources.filter(Boolean) : [];
}

function fieldStatus(event, field) {
  const explicit = event?.verification?.[field]?.status;
  if (explicit) return explicit;
  if (["artist", "concertDate", "venue"].includes(field)) {
    return event.status === "confirmed" && event.verifiedAt && event.sources?.length ? "confirmed" : "unverified";
  }
  if (field === "price") return event.priceVerifiedAt ? "confirmed" : (event.price == null ? "unverified" : "unverified");
  if (field === "availability") return event.ticketStatusVerifiedAt ? "confirmed" : "unverified";
  return event[field] ? "unverified" : "unverified";
}

function hostingState(event) {
  if (event?.verification?.hosting?.status) return event.verification.hosting.status;
  if (event?.hostingStatus) return event.hostingStatus;
  if (["artist", "concertDate", "venue"].some(field => fieldStatus(event, field) === "conflict")) return "conflict";
  return event.status === "confirmed" ? "confirmed" : "unverified";
}

function ticketingState(event) {
  if (event?.verification?.ticketing?.status) return event.verification.ticketing.status;
  if (event?.ticketingStatus) return event.ticketingStatus;
  if (["ticketDate", "presaleDate", "price", "ticketConditions", "availability"].some(field => fieldStatus(event, field) === "conflict")) return "conflict";
  return event.ticketingStatus || "unverified";
}

function readiness(event) {
  const hosting = hostingState(event);
  const ticketing = ticketingState(event);
  if (hosting === "conflict" || ticketing === "conflict") return "conflict";
  if (hosting !== "confirmed") return "candidate";
  return ticketing === "confirmed" ? "confirmed" : "hosting_confirmed";
}

function seriesKey(event) {
  return String(event.seriesId || `${event.artist || ""}|${event.venue || ""}|${event.vendorUrl || event.vendor || ""}`).trim();
}

function meaningfulChanges(before = {}, after = {}) {
  const fields = ["artist", "concertDate", "time", "venue", "ticketDate", "ticketTime", "presaleDate", "presaleTime", "price", "vendor", "vendorUrl", "status", "ticketAvailability"];
  return fields.filter(field => (before[field] ?? null) !== (after[field] ?? null)).map(field => ({ field, before: before[field] ?? null, after: after[field] ?? null }));
}

function validateWorkflow(event, existing = [], { mode = "add" } = {}) {
  const errors = [];
  if (!event?.id || !/^[a-z0-9][a-z0-9-]*$/.test(event.id)) errors.push("id는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.");
  for (const field of ["artist", "concertDate", "venue"]) if (!String(event[field] || "").trim()) errors.push(`${field} 값이 필요합니다.`);
  if (event.concertDate && !/^\d{4}-\d{2}-\d{2}$/.test(event.concertDate)) errors.push("concertDate는 YYYY-MM-DD 형식이어야 합니다.");
  if (existing.some(item => item.id !== event.id && item.artist === event.artist && item.concertDate === event.concertDate && item.venue === event.venue)) errors.push("같은 아티스트·공연일·공연장의 일정이 이미 있습니다.");
  if (hostingState(event) === "conflict" || ticketingState(event) === "conflict") errors.push("공식 출처 충돌 상태는 보류 후 확인해야 합니다.");
  if (event.status === "confirmed" && readiness(event) === "candidate") errors.push("공개 승인 전 아티스트·날짜·공연장 개최 확인이 필요합니다.");
  return errors;
}

function buildRecheckQueue(events, { asOf = new Date().toISOString().slice(0, 10), staleDays = 14, soonDays = 14 } = {}) {
  const now = asDate(`${asOf}T00:00:00Z`);
  const result = [];
  for (const event of events.filter(item => !["cancelled", "rejected"].includes(item.status))) {
    const reasons = [];
    const concert = asDate(`${event.concertDate}T00:00:00Z`);
    if (concert && (concert - now) / 86400000 >= 0 && (concert - now) / 86400000 <= soonDays) reasons.push("공연 임박");
    const ticket = event.ticketDate ? asDate(`${event.ticketDate}T00:00:00Z`) : null;
    if (ticket && (ticket - now) / 86400000 >= 0 && (ticket - now) / 86400000 <= soonDays) reasons.push("예매 임박");
    const verified = asDate(event.verifiedAt);
    if (!verified || (now - verified) / 86400000 >= staleDays) reasons.push("확인일 오래됨");
    if (["ticketDate", "presaleDate", "price"].some(field => fieldStatus(event, field) === "unverified")) reasons.push("예매 세부정보 미확인");
    if (hostingState(event) === "conflict" || ticketingState(event) === "conflict") reasons.push("출처 충돌");
    if (reasons.length && (!concert || concert >= now)) result.push({ id: event.id, artist: event.artist, concertDate: event.concertDate, reasons: [...new Set(reasons)] });
  }
  return result.sort((a, b) => a.concertDate.localeCompare(b.concertDate) || a.id.localeCompare(b.id));
}

function readEvents(file = path.join(__dirname, "..", "calendar", "data", "events.json")) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

if (require.main === module) {
  const [, , command = "recheck", ...args] = process.argv;
  const asOfIndex = args.indexOf("--as-of");
  const asOf = asOfIndex >= 0 ? args[asOfIndex + 1] : undefined;
  if (command === "recheck") console.log(JSON.stringify(buildRecheckQueue(readEvents(), { asOf }), null, 2));
  else {
    console.error("사용법: node tools/event-workflow.js recheck [--as-of YYYY-MM-DD]");
    process.exitCode = 2;
  }
}

module.exports = { FIELD_NAMES, buildRecheckQueue, fieldStatus, hostingState, meaningfulChanges, readiness, seriesKey, ticketingState, validateWorkflow };
