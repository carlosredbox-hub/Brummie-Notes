import { test } from "node:test";
import assert from "node:assert/strict";
import { applyReferencePack } from "../src/reference-pack.js";
import { reuseDocument } from "../src/reuse-document.js";
const source = {
  type: "invoice",
  language: "pt",
  currency: "BRL",
  client: "Cliente de referência",
  date: "2026-10-17",
  due: "2026-10-17",
  status: "Rascunho",
  items: [
    {
      description: "Ida",
      quantity: 1,
      price: 20000,
      extra: 4800,
      date: "2026-10-17",
    },
    {
      description: "Volta",
      quantity: 1,
      price: 20000,
      extra: 4800,
      date: "2026-10-31",
    },
  ],
};
test("reference import is additive, idempotent and preserves source PDFs exactly", async () => {
  const data = {
    records: [{ id: "existing", kind: "client", name: "Existing" }],
    company: { name: "Minha empresa", phone: "meu telefone", website: "" },
  };
  const original = "%PDF-fixture";
  const pack = {
    schema: 1,
    id: "pack1",
    company: { phone: "telefone histórico", website: "example.test" },
    records: [
      {
        id: "pdf1",
        kind: "archive",
        name: "original.pdf",
        source: { type: "application/pdf", base64: btoa(original) },
      },
      { id: "model1", kind: "template", content: source },
    ],
  };
  applyReferencePack(data, pack);
  applyReferencePack(data, pack);
  assert.equal(data.records.length, 3);
  assert.equal(await data.records[1].source.text(), original);
  assert.equal(data.company.phone, "meu telefone");
  assert.equal(data.company.website, "example.test");
  data.records.pop();
  applyReferencePack(data, pack);
  assert.equal(data.records.length, 2, "deleted templates do not reappear");
});
test("reuse preserves itinerary intervals while updating emission date", () => {
  const copy = reuseDocument(source, "2026-11-03");
  assert.deepEqual(
    copy.items.map((i) => i.date),
    ["2026-11-03", "2026-11-17"],
  );
  assert.equal(source.items[0].date, "2026-10-17");
  assert.equal(copy.status, "Emitido");
});
