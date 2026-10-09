import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate, validateDoc } from "../domain.js";
test("helipcopter invoice includes both services and attendance", () => {
  const r = calculate(
    [
      { description: "Helicóptero", quantity: 2, price: 20000, extra: 9600 },
      { description: "Bagagens", quantity: 1, price: 1200 },
    ],
    0,
  );
  assert.equal(r.total, 50800);
});
test("meet and greet charges per passenger", () => {
  assert.equal(
    calculate([
      { description: "Meet", quantity: 1, price: 750 },
      { description: "Meet", quantity: 2, price: 1300 },
    ]).total,
    3350,
  );
});
test("rounds and applies discount", () => {
  assert.equal(
    calculate([{ description: "Transfer", quantity: 3, price: 0.1 }], 0.1)
      .total,
    0.2,
  );
});
test("rejects negative values, excessive discounts, invalid dates and unpaid receipts", () => {
  assert.throws(() =>
    calculate([{ description: "Test", quantity: -1, price: 100 }]),
  );
  assert.throws(() =>
    calculate([{ description: "Test", quantity: 1, price: 100 }], 101),
  );
  const d = {
    type: "recibo",
    language: "pt",
    currency: "BRL",
    client: "Cliente",
    date: "2026-10-09",
    due: "2026-10-10",
    items: [{ description: "Transfer", quantity: 1, price: 100 }],
    status: "Emitido",
  };
  assert.throws(() => validateDoc(d));
  assert.throws(() =>
    validateDoc({ ...d, type: "invoice", due: "2026-10-01" }),
  );
  assert.equal(validateDoc({ ...d, status: "Pago" }).total, 100);
});
