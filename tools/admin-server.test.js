const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeEvent, validateEvent } = require("./admin-server");

const valid = {
  id: "artist-2026-10-01",
  artist: "Artist",
  concertDate: "2026-10-01",
  time: "오후 7:00",
  venue: "공연장",
  ticketDate: "2026-08-10",
  ticketTime: "오후 8:00",
  presaleDate: "",
  presaleTime: "",
  vendor: "YES24 티켓",
  vendorUrl: "https://ticket.yes24.com/example",
  youtubeChannel: "@artist",
  songs: [1, 2, 3].map(number => [`Song ${number}`, "", `https://www.youtube.com/watch?v=video${number}`]),
  sources: ["https://ticket.yes24.com/example"],
  verifiedAt: "2026-08-08",
  status: "confirmed"
};

test("accepts a complete confirmed event", () => {
  assert.deepEqual(validateEvent(normalizeEvent(valid)), []);
});

test("preserves supported presale status values and clears unsupported values", () => {
  assert.equal(normalizeEvent({ ...valid, presaleStatus: "none" }).presaleStatus, "none");
  assert.equal(normalizeEvent({ ...valid, presaleStatus: "checking" }).presaleStatus, "checking");
  assert.equal(normalizeEvent({ ...valid, presaleStatus: "unknown" }).presaleStatus, "");
});

test("blocks incomplete approval and duplicate concerts", () => {
  const event = normalizeEvent({ ...valid, songs: [], ticketTime: "" });
  const errors = validateEvent(event, [{ ...event, id: "duplicate" }]);
  assert.ok(errors.some(error => error.includes("일반예매")));
  assert.ok(errors.some(error => error.includes("대표곡")));
  assert.ok(errors.some(error => error.includes("이미 있습니다")));
});

test("requires a cancellation reason", () => {
  const event = normalizeEvent({ ...valid, status: "cancelled", cancellationReason: "" });
  assert.ok(validateEvent(event).some(error => error.includes("취소 사유")));
});

test("partial edits preserve prices, songs, structured sources and verification dates", () => {
  const previous = { ...valid, price: 88000, priceCurrency: "KRW", seatPrices: [{ name: "전석", price: 88000, priceCurrency: "KRW" }], sources: [{ label: "공식", url: valid.sources[0] }], priceVerifiedAt: "2026-08-08", verification: { price: { status: "confirmed", verifiedAt: "2026-08-08", sources: valid.sources } } };
  const result = normalizeEvent({ genre: "J-POP" }, previous);
  for (const key of ["price", "priceCurrency", "seatPrices", "songs", "sources", "verification", "verifiedAt", "priceVerifiedAt"]) assert.deepEqual(result[key], previous[key]);
  assert.deepEqual(validateEvent(result), []);
});

test("new seat tiers and field verification are accepted without erasing unrelated evidence", () => {
  const seatPrices = [{ name: "R석", price: 110000, priceCurrency: "KRW" }];
  const previous = { ...valid, verification: { artist: { status: "confirmed", verifiedAt: "2026-08-08", sources: valid.sources } } };
  const result = normalizeEvent({ seatPrices, price: 110000, priceVerifiedAt: "2026-09-21", verification: { price: { status: "confirmed", verifiedAt: "2026-09-21", sources: valid.sources } } }, previous);
  assert.deepEqual(result.seatPrices, seatPrices);
  assert.deepEqual(result.verification.artist, previous.verification.artist);
  assert.equal(result.priceVerifiedAt, "2026-09-21");
  assert.equal(result.verifiedAt, previous.verifiedAt);
  assert.deepEqual(validateEvent(result), []);
});

test("invalid seat prices and deceptive YouTube hosts are rejected", () => {
  const result = normalizeEvent({ ...valid, seatPrices: [{ name: "R", price: "10000", priceCurrency: "KRW" }], songs: [["fake", "", "https://evil.example/youtube.com/watch?v=x"], ...valid.songs.slice(1)] });
  assert.match(validateEvent(result).join(" "), /좌석 등급/);
  assert.match(validateEvent(result).join(" "), /YouTube/);
});

test("postponements require a reason and conflicts can be saved pending", () => {
  assert.deepEqual(validateEvent(normalizeEvent({ ...valid, status: "postponed", changeReason: "공식 일정 연기" })), []);
  assert.match(validateEvent(normalizeEvent({ ...valid, status: "postponed" })).join(" "), /연기 사유/);
  assert.deepEqual(validateEvent(normalizeEvent({ ...valid, status: "pending", hostingStatus: "conflict" })), []);
});
