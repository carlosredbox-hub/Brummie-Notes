import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: fs.existsSync("/usr/bin/chromium")
    ? "/usr/bin/chromium"
    : undefined,
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 780 },
    isMobile: true,
    hasTouch: true,
    offline: true,
  });
  await context.route("https://guided.test/", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: fs.readFileSync("dist/index.html", "utf8"),
    }),
  );
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("https://guided.test/");
  await page
    .getByRole("navigation", { name: "Navegação do celular" })
    .getByRole("button", { name: "Criar", exact: true })
    .click();
  fs.mkdirSync("test-results/guided", { recursive: true });
  await page.screenshot({ path: "test-results/guided/01-escolher.png" });
  await page.getByRole("button", { name: /Preparar um orçamento/ }).click();
  await page.getByRole("button", { name: "Continuar para serviços" }).click();
  assert.equal(
    await page
      .getByText("O que será oferecido ao cliente?", { exact: true })
      .count(),
    0,
    "Empty client must not advance",
  );
  await page
    .getByLabel("Nome do cliente", { exact: true })
    .fill("Cliente Demonstração");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.screenshot({ path: "test-results/guided/02-cliente.png" });
  await page.getByRole("button", { name: "Continuar para serviços" }).click();
  await page
    .getByLabel("Nome do serviço", { exact: true })
    .fill("Airport transfer");
  await page.getByLabel("Valor por serviço (R$)").fill("450");
  await page
    .getByLabel("Foto do serviço ou veículo (opcional)")
    .setInputFiles("src/assets/example-sedan.png");
  await page
    .getByRole("button", { name: "+ Adicionar outro serviço", exact: true })
    .click();
  await page
    .getByLabel("Nome do serviço", { exact: true })
    .nth(1)
    .fill("City tour");
  await page.getByLabel("Valor por serviço (R$)").nth(1).fill("900");
  await page
    .getByLabel("Foto do serviço ou veículo (opcional)")
    .nth(1)
    .setInputFiles("src/assets/example-van.jpeg");
  await page.screenshot({ path: "test-results/guided/04-servicos.png" });
  await page
    .getByRole("button", { name: "Conferir documento", exact: true })
    .click();
  await page.getByText(/Página 1 de/).waitFor({ timeout: 60000 });
  await page
    .getByRole("status")
    .filter({ hasText: "Renderizando página…" })
    .waitFor({ state: "hidden" });
  await page.screenshot({ path: "test-results/guided/03-conferir.png" });
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  assert.equal(
    await page
      .getByLabel("Nome do serviço", { exact: true })
      .nth(1)
      .inputValue(),
    "City tour",
  );
  await page
    .getByRole("button", { name: "Conferir documento", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Finalizar documento", exact: true })
    .click();
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).waitFor();
  await page.getByText(/Página 1 de/).waitFor();
  const saved = await page.evaluate(async () => {
    const name = (await indexedDB.databases())[0].name;
    return await new Promise((resolve, reject) => {
      const r = indexedDB.open(name);
      r.onsuccess = () => {
        const tx = r.result.transaction("workspace");
        const q = tx.objectStore("workspace").getAll();
        q.onsuccess = () => resolve(q.result);
        q.onerror = reject;
      };
      r.onerror = reject;
    });
  });
  assert.ok(JSON.stringify(saved).includes("City tour"));
  assert.ok(
    saved[0].documents
      .at(-1)
      .items.every((x) => x.image?.startsWith("data:image/")),
  );
  assert.ok(JSON.stringify(saved).includes('"language":"en"'));
  assert.deepEqual(errors, []);
  console.log(
    "Guided creation: client validation, English choice, two services, actual PDF preview, back without loss, save offline passed.",
  );
} finally {
  await browser.close();
}
