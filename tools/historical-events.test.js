const test = require("node:test");
const assert = require("node:assert/strict");
const historicalEvents = [
  ...require("../calendar/data/historical-events-2023.json"),
  ...require("../calendar/data/historical-events.json")
];

test("historical attendance data has unique valid events and prices", () => {
  assert.equal(historicalEvents.length, 65);
  assert.equal(new Set(historicalEvents.map(event => event.id)).size, historicalEvents.length);
  assert.equal(historicalEvents.filter(event => event.status === "confirmed").length, 64);
  assert.equal(historicalEvents.filter(event => event.status === "pending").length, 1);

  for (const event of historicalEvents) {
    assert.ok(event.id && event.artist && event.venue, `${event.id}: required fields`);
    assert.match(event.concertDate, /^202[345]-\d{2}-\d{2}$/, `${event.id}: historical date`);
    assert.ok(Number.isInteger(event.price) && event.price > 0, `${event.id}: price`);
    assert.equal(event.priceCurrency, "KRW", `${event.id}: currency`);
    for (const tier of event.seatPrices || []) {
      assert.ok(tier.name, `${event.id}: tier name`);
      assert.ok(Number.isInteger(tier.price) && tier.price > 0, `${event.id}: tier price`);
      assert.equal(tier.priceCurrency, "KRW", `${event.id}: tier currency`);
    }
  }
});
