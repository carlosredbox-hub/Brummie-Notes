import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
const b = await chromium.launch({
  executablePath: fs.existsSync("/usr/bin/chromium")
    ? "/usr/bin/chromium"
    : undefined,
  args: ["--no-sandbox"],
});
const c = await b.newContext({ offline: true, acceptDownloads: true });
await c.route("https://itinerary.test/", (r) =>
  r.fulfill({
    contentType: "text/html",
    body: fs.readFileSync("dist/index.html", "utf8"),
  }),
);
const p = await c.newPage();
await p.goto("https://itinerary.test/");
await p.getByRole("button", { name: "Novo documento", exact: true }).click();
await p
  .getByRole("button", {
    name: "Exemplo completo: Roteiro de viagem",
    exact: true,
  })
  .click();
await p.getByRole("button", { name: "Reutilizar", exact: true }).click();
await p
  .getByLabel("Estilo do roteiro", { exact: true })
  .selectOption("schedule");
await p
  .getByLabel("Período da viagem (texto livre)", { exact: true })
  .fill("Datas a confirmar — sem ano informado");
await p
  .getByLabel("Tema do dia da atividade 1", { exact: true })
  .fill("Experiência editada");
await p.getByLabel("Período da atividade 1", { exact: true }).fill("MANHÃ");
await p
  .getByLabel("Texto da seção 1", { exact: true })
  .fill(
    "VISITA EDITADA. " +
      "Orientação detalhada para o cliente; verificar horários e disponibilidade. ".repeat(
        50,
      ) +
      " FIM DA ATIVIDADE.",
  );
await p
  .getByLabel("Texto da nota concierge 1", { exact: true })
  .fill("NOTA EDITADA — veículo sujeito a confirmação.");
await p.getByRole("button", { name: "Gerar documento", exact: true }).click();
await p
  .getByRole("heading", { name: "Seu documento está pronto", exact: true })
  .waitFor();
const pending = p.waitForEvent("download");
await p.getByRole("button", { name: "Baixar PDF", exact: true }).click();
fs.mkdirSync("test-results", { recursive: true });
const f = "test-results/itinerary-edited.pdf";
await (await pending).saveAs(f);
const task = getDocument({
  data: new Uint8Array(fs.readFileSync(f)),
  isEvalSupported: false,
});
const doc = await task.promise;
let text = "";
for (let n = 1; n <= doc.numPages; n++)
  text += (await (await doc.getPage(n)).getTextContent()).items
    .map((x) => x.str)
    .join(" ");
for (const token of [
  "Experiência editada",
  "FIM DA ATIVIDADE",
  "NOTA EDITADA",
  "Datas a confirmar",
])
  assert.ok(text.includes(token), token);
assert.ok(!text.includes("R$"));
await task.destroy();
const htmlDownload = p.waitForEvent("download");
await p
  .getByRole("button", { name: "Baixar guia para celular (HTML)", exact: true })
  .click();
await (await htmlDownload).saveAs("test-results/itinerary-edited.html");
const mobile = fs.readFileSync("test-results/itinerary-edited.html", "utf8");
for (const token of [
  "Experiência editada",
  "Datas a confirmar",
  "NOTA EDITADA",
  "MANHÃ",
])
  assert.ok(mobile.includes(token), `mobile guide: ${token}`);

await p.getByRole("button", { name: "Reutilizar", exact: true }).click();
assert.equal(
  await p
    .getByLabel("Tema do dia da atividade 1", { exact: true })
    .inputValue(),
  "Experiência editada",
);
assert.equal(
  await p.getByLabel("Texto da nota concierge 1", { exact: true }).inputValue(),
  "NOTA EDITADA — veículo sujeito a confirmação.",
);
assert.equal(
  await p
    .getByLabel("Tema do dia da atividade 2", { exact: true })
    .inputValue(),
  "Experiência editada",
);
await b.close();
console.log(
  "Itinerary: editable day, period, travel label and concierge notes persist; long text fully exported offline.",
);
