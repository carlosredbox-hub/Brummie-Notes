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
import { calculateOvertime, calculateStay } from "../domain.js";
import { guideSections, documentPresets } from "../src/presets.js";
const day = (lines) => ({ days: [{ date: "2025-11-08", lines }] });
test("overtime: 10% da diária por hora acima de 10h, arredondando para cima", () => {
  const r = calculateOvertime(
    day([
      { vehicle: "A", dailyRate: 12000, start: "10:00", end: "22:00" },
      { vehicle: "B", dailyRate: 1900, start: "10:30", end: "22:00" },
    ]),
  );
  assert.equal(r.days[0].lines[0].amount, 2400);
  assert.equal(r.days[0].lines[1].extraHours, 2);
  assert.equal(r.total, 2780);
});
test("overtime: horas manuais prevalecem e ficam sinalizadas; centavos preservados", () => {
  const r = calculateOvertime(
    day([
      {
        vehicle: "C",
        dailyRate: 1905.5,
        start: "06:30",
        end: "23:30",
        extraHours: 8,
      },
    ]),
  );
  const l = r.days[0].lines[0];
  assert.equal(l.computedHours, 7);
  assert.equal(l.overridden, true);
  assert.equal(l.amount, 1524.4);
});
test("stay: noites, total, pago e saldo; rejeita pagamento maior que o total", () => {
  const s = {
    hotelName: "Hotel",
    checkIn: "2026-02-13",
    checkOut: "2026-02-17",
    rooms: [{ description: "Standard", quantity: 1, nightlyRate: 4750 }],
    payments: [{ amount: 19000 }],
  };
  const r = calculateStay(s);
  assert.deepEqual(
    [r.nights, r.total, r.paid, r.balance],
    [4, 19000, 19000, 0],
  );
  assert.throws(() =>
    calculateStay({ ...s, payments: [{ amount: 19000.01 }] }),
  );
  assert.throws(() => calculateStay({ ...s, checkOut: "2026-02-13" }));
});
test("guia valida sem cliente nem preço; documentos antigos sem brand continuam válidos", () => {
  const g = validateDoc({
    type: "guia",
    language: "pt",
    brand: "realestate",
    guide: { title: "Guia", address: "Rua X", sections: guideSections },
  });
  assert.equal(g.guide.layout, "a4");
  assert.throws(() =>
    validateDoc({ ...g, guide: { ...g.guide, sections: [] } }),
  );
  assert.throws(() => validateDoc({ ...g, brand: "x" }));
  assert.equal(
    validateDoc({
      type: "invoice",
      language: "pt",
      currency: "BRL",
      status: "Rascunho",
      client: "C",
      date: "2026-01-01",
      due: "2026-01-02",
      items: [{ description: "T", quantity: 1, price: 10, group: "SP" }],
    }).groups.SP,
    10,
  );
});
test("presets sem credenciais e com tipos conhecidos", () => {
  for (const p of documentPresets) assert.ok(p.content.type === p.type);
  assert.ok(!JSON.stringify(guideSections).match(/senha|password|\d{4}\*/i));
});
