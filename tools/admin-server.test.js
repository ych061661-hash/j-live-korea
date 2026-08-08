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
