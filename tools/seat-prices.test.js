const test = require("node:test");
const assert = require("node:assert/strict");
const events = require("../calendar/data/events.json");

test("stored seat prices use valid KRW amounts and match the event minimum", () => {
  const priced = events.filter(event => Array.isArray(event.seatPrices) && event.seatPrices.length);
  assert.ok(priced.length > 0);

  for (const event of priced) {
    for (const tier of event.seatPrices) {
      assert.ok(String(tier.name || "").trim(), `${event.id}: seat name`);
      assert.ok(Number.isInteger(tier.price) && tier.price > 0, `${event.id}: seat price`);
      assert.equal(tier.priceCurrency, "KRW", `${event.id}: currency`);
    }
    assert.equal(event.price, Math.min(...event.seatPrices.map(tier => tier.price)), `${event.id}: minimum price`);
    assert.equal(event.priceCurrency, "KRW", `${event.id}: event currency`);
    assert.match(event.priceVerifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${event.id}: verification date`);
  }
});
