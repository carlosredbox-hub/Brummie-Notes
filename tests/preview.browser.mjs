import { chromium } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: fs.existsSync("/usr/bin/chromium")
    ? "/usr/bin/chromium"
    : undefined,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  offline: true,
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await context.route("https://preview.test/", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: '<iframe title="Prévia" sandbox="allow-scripts allow-downloads" style="width:100%;height:900px;border:0"></iframe>',
    }),
  );
  await page.goto("https://preview.test/");
  await page.evaluate(
    (html) => (document.querySelector("iframe").srcdoc = html),
    fs.readFileSync("dist/index.html", "utf8"),
  );
  const frame = page.frameLocator("iframe");
  await frame
    .getByText("Seus documentos anteriores são o ponto de partida do próximo.")
    .waitFor();
  await frame
    .getByRole("status")
    .filter({ hasText: "Modo de prévia" })
    .waitFor();
  await frame
    .getByRole("button", { name: "Novo documento", exact: true })
    .click();
  await frame.getByLabel("Nome do cliente / Empresa").fill("Cliente prévia");
  await frame.getByLabel("Preço unitário").fill("400");
  await frame
    .getByRole("button", { name: "Gerar documento", exact: true })
    .click();
  await frame
    .getByRole("heading", { name: "Seu documento está pronto", exact: true })
    .waitFor();
  const pending = page.waitForEvent("download");
  await frame.getByRole("button", { name: "Baixar PDF", exact: true }).click();
  const download = await pending;
  const bytes = fs.readFileSync(await download.path());
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  await frame.getByLabel("Nome para salvar modelo").fill("Modelo prévia");
  await frame
    .getByRole("button", { name: "Salvar modelo", exact: true })
    .click();
  await frame.getByRole("button", { name: "Fechar", exact: true }).click();
  await frame
    .getByRole("button", { name: "Meus modelos", exact: true })
    .click();
  await frame
    .getByRole("heading", { name: "Modelo prévia", exact: true })
    .waitFor();
  const backup = page.waitForEvent("download");
  await frame
    .getByRole("button", { name: "Exportar backup", exact: true })
    .click();
  const saved = await backup;
  const data = JSON.parse(fs.readFileSync(await saved.path()));
  assert.equal(data.documents.length, 1);
  assert.ok(data.records.some((r) => r.name === "Modelo prévia"));
  assert.deepEqual(errors, []);
  console.log(
    "Opaque sandbox preview passed: storage unavailable, UUID fallback, generation, PDF download, templates and backup.",
  );
} finally {
  await browser.close();
}
