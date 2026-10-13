import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDoc, calculateOption } from "../src/editorial-document.js";
const selection = {
  type: "proposta",
  language: "en",
  currency: "BRL",
  brand: "realestate",
  client: "Example",
  status: "Emitido",
  date: "2026-10-13",
  due: "2026-10-13",
  proposal: {
    title: "Property Selection",
    layout: "property-selection",
    options: [
      { title: "Premium", rooms: 12, nights: 3, nightlyRate: 1120 },
      {
        title: "Executive",
        rooms: 12,
        nights: 3,
        priceMode: "total",
        totalPrice: 70500,
      },
    ],
  },
};
test("property selection keeps independent prices and never sums alternatives", () => {
  const d = validateDoc(selection);
  assert.equal(d.total, 0);
  assert.equal(d.selection, true);
  assert.deepEqual(
    d.proposal.options.map((o) => o.total),
    [40320, 70500],
  );
  assert.equal(d.cardFee, 0);
});
test("property option validation rejects incomplete, negative and fractional counts", () => {
  for (const patch of [
    { rooms: 1.5 },
    { nights: 0 },
    { nightlyRate: -1 },
    { priceMode: "unknown" },
    { title: "" },
  ])
    assert.throws(() =>
      calculateOption({ ...selection.proposal.options[0], ...patch }),
    );
  assert.throws(() => validateDoc({ ...selection, cardFeePct: 5 }));
  assert.throws(() =>
    validateDoc({
      ...selection,
      proposal: { ...selection.proposal, options: [] },
    }),
  );
});
