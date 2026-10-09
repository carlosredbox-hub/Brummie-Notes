import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { join, resolve } from "node:path";
const output = resolve("test-results");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  acceptDownloads: true,
  offline: true,
});
const page = await context.newPage();
const errors = [],
  network = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url()) && r.url() !== "https://brummie-offline.test/")
    network.push(r.url());
});
try {
  await context.route("https://brummie-offline.test/**", (route) =>
    route.request().url() === "https://brummie-offline.test/"
      ? route.fulfill({
          contentType: "text/html",
          body: fs.readFileSync("dist/index.html", "utf8"),
        })
      : route.abort(),
  );
  await page.goto("https://brummie-offline.test/");
  await page
    .getByText("Seus documentos anteriores são o ponto de partida do próximo.")
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Entrar", exact: true }).count(),
    0,
  );
  await page
    .getByRole("button", { name: "Novo documento", exact: true })
    .click();
  await page.getByLabel("Nome do cliente / Empresa").fill("Cliente offline");
  await page.getByLabel("Preço unitário").fill("400");
  await page.getByLabel("Origem", { exact: true }).fill("Aeroporto GIG");
  await page.getByLabel("Destino", { exact: true }).fill("Copacabana");
  await page.getByRole("button", { name: "Gerar documento" }).click();
  await page
    .getByRole("heading", { name: "Seu documento está pronto" })
    .waitFor();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
  const dl = await pending;
  await dl.saveAs(join(output, "invoice-offline.pdf"));
  const bytes = fs.readFileSync(join(output, "invoice-offline.pdf"));
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok(bytes.length > 5000);
  await page.getByLabel("Nome para salvar modelo").fill("Transfer recorrente");
  await page.getByRole("button", { name: "Salvar modelo" }).click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Meus modelos", exact: true }).click();
  await page
    .getByRole("heading", { name: "Transfer recorrente", exact: true })
    .waitFor();
  await page
    .locator(".template-card")
    .filter({
      has: page.getByRole("heading", {
        name: "Transfer recorrente",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Usar modelo" })
    .click();
  assert.equal(
    await page.getByLabel("Nome do cliente / Empresa").inputValue(),
    "Cliente offline",
  );
  assert.equal(await page.getByLabel("Preço unitário").inputValue(), "400");
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page
    .getByRole("button", { name: "Importar PDF anterior", exact: true })
    .click();
  await page
    .getByLabel("PDF anterior (até 25 MB)")
    .setInputFiles(join(output, "invoice-offline.pdf"));
  await page.getByLabel("Cliente (revise)").waitFor();
  await page.getByLabel("Cliente (revise)").fill("Cliente importado");
  await page.getByLabel("Nome do modelo").fill("Meu PDF anterior");
  assert.equal(
    await page.getByLabel("Valor sugerido (revise)").inputValue(),
    "400",
  );
  await page.getByRole("button", { name: "Guardar PDF e modelo" }).click();
  await page.getByRole("heading", { name: "Meu PDF anterior" }).waitFor();
  await page
    .getByRole("button", { name: "Biblioteca de PDFs", exact: true })
    .click();
  await page.getByText("invoice-offline.pdf", { exact: true }).waitFor();
  const original = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar original" }).click();
  const originalDl = await original;
  const originalPath = join(output, "original.pdf");
  await originalDl.saveAs(originalPath);
  assert.deepEqual(fs.readFileSync(originalPath), bytes);
  const backup = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar backup" }).click();
  const backupDl = await backup;
  const backupPath = join(output, "backup.json");
  await backupDl.saveAs(backupPath);
  const payload = JSON.parse(fs.readFileSync(backupPath));
  assert.equal(payload.schema, 1);
  assert.equal(payload.documents.length, 1);
  assert.ok(payload.records.find((r) => r.kind === "archive").source._blob);
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await page.screenshot({
    path: join(output, "offline-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: join(output, "offline-mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  // A second browser profile has independent data; backup transfers it without a server.
  const other = await browser.newContext({ offline: true });
  const second = await other.newPage();
  await other.route("https://brummie-offline.test/**", (route) =>
    route.request().url() === "https://brummie-offline.test/"
      ? route.fulfill({
          contentType: "text/html",
          body: fs.readFileSync("dist/index.html", "utf8"),
        })
      : route.abort(),
  );
  await second.goto("https://brummie-offline.test/");
  await second
    .getByText("Seus documentos anteriores são o ponto de partida do próximo.")
    .waitFor();
  second.once("dialog", (d) => d.accept());
  await second.locator(".restore-label input").setInputFiles(backupPath);
  await second
    .getByRole("button", { name: "Meus modelos", exact: true })
    .click();
  await second.getByRole("heading", { name: "Meu PDF anterior" }).waitFor();
  await other.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  console.log(
    "Offline smoke passed: no network/login, generation, PDF, persisted templates, import/extraction, exact original PDF, backup transfer and responsive UI.",
  );
} finally {
  await browser.close();
}
