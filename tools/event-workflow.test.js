const test = require("node:test");
const assert = require("node:assert/strict");
const { buildRecheckQueue, hostingState, meaningfulChanges, readiness, validateWorkflow } = require("./event-workflow");

const base = { id: "artist-2026-10-01", artist: "Artist", concertDate: "2026-10-01", venue: "Hall", status: "pending" };

test("개최 확인 전 후보와 예매 발표 대기 상태를 구분한다", () => {
  assert.equal(readiness(base), "candidate");
  const hosting = { ...base, status: "confirmed", hostingStatus: "confirmed", ticketingStatus: "pending_announcement", verifiedAt: "2026-09-10", sources: ["https://example.com/official"] };
  assert.equal(hostingState(hosting), "confirmed");
  assert.equal(readiness(hosting), "hosting_confirmed");
});

test("출처 충돌 공연은 공개 승인 검증에서 보류한다", () => {
  const conflict = { ...base, status: "confirmed", hostingStatus: "conflict" };
  assert.match(validateWorkflow(conflict).join(" "), /출처 충돌/);
});

test("같은 공연의 재확인만으로는 의미 있는 변경을 만들지 않는다", () => {
  assert.deepEqual(meaningfulChanges({ ...base, verifiedAt: "2026-09-01" }, { ...base, verifiedAt: "2026-09-10", updatedAt: "2026-09-10T00:00:00Z" }), []);
});

test("재확인 큐는 오래된 검증·임박 일정·미확인 예매 정보를 구분한다", () => {
  const queue = buildRecheckQueue([{ ...base, status: "confirmed", verifiedAt: "2026-08-01" }], { asOf: "2026-09-10" });
  assert.equal(queue.length, 1);
  assert.ok(queue[0].reasons.includes("확인일 오래됨"));
  assert.ok(queue[0].reasons.includes("예매 세부정보 미확인"));
});
