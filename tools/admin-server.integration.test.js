const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jlive-admin-"));
const eventsFile = path.join(tempDir, "events.json");
fs.writeFileSync(eventsFile, "[]\n", "utf8");
process.env.JLIVE_EVENTS_FILE = eventsFile;
process.env.JLIVE_SKIP_GENERATE = "1";
const { start } = require("./admin-server");

const complete = {
  id: "test-artist-2026-10-01",
  artist: "Test Artist",
  genre: "J-POP",
  concertDate: "2026-10-01",
  time: "오후 7:00",
  venue: "테스트 공연장",
  presaleDate: "",
  presaleTime: "",
  ticketDate: "2026-08-10",
  ticketTime: "오후 8:00",
  vendor: "YES24 티켓",
  vendorUrl: "https://ticket.yes24.com/test",
  youtubeChannel: "@test",
  songs: [1, 2, 3].map(number => [`Song ${number}`, "", `https://www.youtube.com/watch?v=test${number}`]),
  sources: ["https://ticket.yes24.com/test"],
  verifiedAt: "2026-08-08",
  status: "pending"
};

test("creates, edits, approves, and cancels an event through the API", async t => {
  const server = start(0);
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (method, body) => {
    const response = await fetch(method === "POST" ? `${base}/api/events` : `${base}/api/events/${complete.id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.ok(response.ok, await response.text());
  };

  await request("POST", complete);
  await request("PUT", { ...complete, venue: "수정 공연장", status: "pending" });
  await request("PUT", { ...complete, venue: "수정 공연장", status: "confirmed" });
  await request("PUT", { ...complete, venue: "수정 공연장", status: "cancelled", cancellationReason: "주최사 공식 취소" });

  const [saved] = JSON.parse(fs.readFileSync(eventsFile, "utf8"));
  assert.equal(saved.venue, "수정 공연장");
  assert.equal(saved.status, "cancelled");
  assert.equal(saved.cancellationReason, "주최사 공식 취소");
});
