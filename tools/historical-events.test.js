const test = require("node:test");
const assert = require("node:assert/strict");
const historicalEvents = [
  ...require("../calendar/data/historical-events-2023.json"),
  ...require("../calendar/data/historical-events.json")
];

test("historical attendance data has unique valid events and prices", () => {
  assert.ok(historicalEvents.length >= 65);
  assert.equal(new Set(historicalEvents.map(event => event.id)).size, historicalEvents.length);
  assert.ok(historicalEvents.some(event => event.status === "confirmed"));

  for (const event of historicalEvents) {
    assert.ok(event.id && event.artist && event.venue, `${event.id}: required fields`);
    assert.match(event.concertDate, /^20\d{2}-\d{2}-\d{2}$/, `${event.id}: historical date`);
    assert.ok(event.concertDate < new Date().toISOString().slice(0, 10), `${event.id}: past event`);
    assert.ok(["confirmed", "pending"].includes(event.status), `${event.id}: status`);
    assert.ok(Number.isInteger(event.price) && event.price > 0, `${event.id}: price`);
    assert.equal(event.priceCurrency, "KRW", `${event.id}: currency`);
    for (const tier of event.seatPrices || []) {
      assert.ok(tier.name, `${event.id}: tier name`);
      assert.ok(Number.isInteger(tier.price) && tier.price > 0, `${event.id}: tier price`);
      assert.equal(tier.priceCurrency, "KRW", `${event.id}: tier currency`);
    }
  }
});
