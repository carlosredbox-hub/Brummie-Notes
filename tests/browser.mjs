import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const validation =
  process.env.VALIDATION_DIR || join(process.cwd(), "test-results");
const tmp = mkdtempSync(join(tmpdir(), "brummie-browser-"));
const server = spawn(process.execPath, ["server.js"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: "3013",
    DB_PATH: join(tmp, "db.sqlite"),
  },
  stdio: "pipe",
});
await new Promise((resolve, reject) => {
  server.stdout.on(
    "data",
    (d) => d.toString().includes("listening") && resolve(),
  );
  server.on("error", reject);
});
let browser;
try {
  browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3013");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Seu nome").fill("Equipe de teste");
  await page.getByLabel("Nome da empresa").fill("Brummie Lines");
  await page.getByLabel("E-mail", { exact: true }).fill("browser@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("Testpassword123");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByText("Uma visão completa").waitFor();
  await page.getByRole("button", { name: "Motoristas", exact: true }).click();
  await page.getByRole("button", { name: "Novo cadastro" }).first().click();
  await page.getByLabel("Nome", { exact: true }).fill("Motorista bilíngue");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await page.getByRole("heading", { name: "Motorista bilíngue" }).waitFor();
  await page.getByRole("button", { name: "Frota", exact: true }).click();
  await page.getByRole("button", { name: "Novo cadastro" }).first().click();
  await page.getByLabel("Modelo / Nome").fill("Sedan executivo");
  await page.getByLabel("Placa", { exact: true }).fill("ABC1D23");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await page.getByRole("heading", { name: "Sedan executivo" }).waitFor();
  await page
    .getByRole("button", { name: "Documentos", exact: false })
    .first()
    .click();
  await page.getByRole("button", { name: "Novo documento" }).click();
  await page.getByLabel("Nome do cliente / Empresa").fill("Cliente de exemplo");
  await page.getByLabel("Preço unitário").fill("400");
  await page.getByLabel("Origem", { exact: true }).fill("Aeroporto GIG");
  await page.getByLabel("Destino", { exact: true }).fill("Copacabana");
  await page
    .getByLabel("Motorista", { exact: true })
    .selectOption({ index: 1 });
  await page
    .getByLabel("Veículo", { exact: true })
    .selectOption({ label: "Sedan executivo • ABC1D23" });
  await page.getByRole("button", { name: "Gerar documento" }).click();
  await page
    .getByRole("heading", { name: "Seu documento está pronto" })
    .waitFor();
  const dl = page.waitForEvent("download");
  await page.getByRole("link", { name: "Baixar PDF" }).click();
  const download = await dl;
  fs.mkdirSync(validation, { recursive: true });
  await download.saveAs(join(validation, "invoice.pdf"));
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Visão geral" }).click();
  await page.screenshot({
    path: join(validation, "dashboard.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    animations: "disabled",
    path: join(validation, "mobile.png"),
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  const otherContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await otherContext.addCookies(await page.context().cookies());
  const otherDevice = await otherContext.newPage();
  await otherDevice.goto("http://127.0.0.1:3013");
  await otherDevice.bringToFront();
  await otherDevice.locator("td .badge").getByText("Emitido").waitFor();
  const state = await (
    await page.request.get("http://127.0.0.1:3013/api/state")
  ).json();
  const change = await page.request.patch(
    "http://127.0.0.1:3013/api/documents/" + state.documents[0].id,
    { data: { status: "Pago" } },
  );
  assert.equal(change.status(), 200);
  await otherDevice
    .locator("td .badge")
    .getByText("Pago")
    .waitFor({ timeout: 16000 });
  await otherContext.close();
  assert.deepEqual(errors, []);
  console.log(
    "Browser smoke passed: register, driver, vehicle, invoice, PDF, desktop, mobile and cross-device synchronization.",
  );
} finally {
  await browser?.close();
  server.kill();
  await new Promise((r) => server.once("exit", r));
  fs.rmSync(tmp, { recursive: true, force: true });
}
