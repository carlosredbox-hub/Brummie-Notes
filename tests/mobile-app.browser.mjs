import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: fs.existsSync("/usr/bin/chromium")
    ? "/usr/bin/chromium"
    : undefined,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 360, height: 640 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
  offline: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await context.route("https://mobile.test/", (r) =>
  r.fulfill({
    contentType: "text/html",
    body: fs.readFileSync("dist/index.html", "utf8"),
  }),
);
const back = () =>
  page.evaluate(() => {
    const e = new Event("brummie-back", { cancelable: true });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  });
const fits = async () =>
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "No horizontal page overflow at phone width",
  );
try {
  await page.goto("https://mobile.test/");
  const nav = page.getByRole("navigation", { name: "Navegação do celular" });
  await nav.waitFor();
  await page
    .getByRole("button", { name: "Biblioteca e backup", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Exportar backup", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Biblioteca e backup", exact: true })
    .click();
  const navBox = await nav.boundingBox();
  assert.ok(
    navBox.height <= 84,
    "Phone navigation must fit in one compact bottom row",
  );
  await nav.getByRole("button", { name: "Criar", exact: true }).click();
  await fits();
  await page.getByRole("button", { name: "Abrir menu de navegação" }).click();
  await page.locator("aside.open").waitFor();
  assert.equal(await back(), true);
  await page.locator("aside.open").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Criar Invoice", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await page.getByLabel("Nome do cliente / Empresa").fill("Cliente Android");
  await page.setViewportSize({ width: 360, height: 360 });
  await page.waitForFunction(() => {
    const action = [...document.querySelectorAll(".modal-actions button")].find(
      (button) => button.textContent.trim() === "Gerar documento",
    );
    return (
      action &&
      action.getBoundingClientRect().bottom <=
        (window.visualViewport?.height || innerHeight)
    );
  });
  const generate = page.getByRole("button", {
    name: "Gerar documento",
    exact: true,
  });
  const box = await generate.boundingBox();
  assert.ok(
    box.y >= 0 && box.y + box.height <= 360,
    "Generate action stays above a resized keyboard viewport",
  );
  const client = page.getByLabel("Nome do cliente / Empresa");
  await client.scrollIntoViewIfNeeded();
  assert.equal(await client.inputValue(), "Cliente Android");
  await fits();
  page.once("dialog", (d) => d.dismiss());
  assert.equal(await back(), true);
  await dialog.waitFor();
  assert.equal(await client.inputValue(), "Cliente Android");
  await page.setViewportSize({ width: 640, height: 360 });
  assert.equal(await client.inputValue(), "Cliente Android");
  await fits();
  await page.setViewportSize({ width: 360, height: 640 });
  await page.getByLabel("Preço unitário").fill("400");
  await generate.click();
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).waitFor();
  await page.getByText(/Página 1 de/).waitFor();
  await page
    .getByRole("status")
    .filter({ hasText: "Renderizando página…" })
    .waitFor({ state: "hidden" });
  fs.mkdirSync("test-results/mobile-app", { recursive: true });
  await page.screenshot({ path: "test-results/mobile-app/phone-preview.png" });
  await fits();
  assert.equal(await back(), true);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await nav.getByRole("button", { name: "Início", exact: true }).click();
  await page.locator(".toast").waitFor({ state: "hidden" });
  await page.screenshot({ path: "test-results/mobile-app/phone-home.png" });
  assert.deepEqual(errors, []);
  console.log(
    "Phone 360×640: touch navigation, drawer/back, full-screen editing, resized keyboard viewport, retained form on rotation and PDF generation passed offline.",
  );
} finally {
  await browser.close();
}
