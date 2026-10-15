import fs from "node:fs";
import assert from "node:assert/strict";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: fs.existsSync("/usr/bin/chromium")
    ? "/usr/bin/chromium"
    : undefined,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
    offline: true,
    viewport: { width: 1440, height: 1100 },
  }),
  page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await context.route("https://editor.test/", (r) =>
  r.fulfill({
    contentType: "text/html",
    body: fs.readFileSync("dist/index.html", "utf8"),
  }),
);
try {
  await page.goto("https://editor.test/");
  await page
    .getByRole("button", { name: "Novo documento", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Exemplo completo: Invoice", exact: true })
    .click();
  await page.getByRole("button", { name: "Reutilizar", exact: true }).click();
  await page.getByLabel("Posição das fotos nos blocos").selectOption("right");
  await page
    .getByLabel("Enquadramento das fotos nos blocos")
    .selectOption("contain");
  await page
    .getByRole("button", { name: "Visualizar antes de finalizar", exact: true })
    .click();
  await page.getByText(/Página 1 de/).waitFor();
  assert.equal(await page.locator('canvas[role="img"]').count(), 1);
  await page
    .getByRole("button", { name: "Mostrar miniaturas", exact: true })
    .click();
  const thumbnails = page.getByRole("navigation", {
    name: "Miniaturas das páginas",
  });
  await thumbnails.locator("img").first().waitFor();
  const pageCount = await thumbnails
    .getByRole("button", { name: /^Ir para a página / })
    .count();
  assert.ok(
    pageCount >= 2,
    "Multipage documents expose clickable page previews",
  );
  await page
    .getByRole("button", { name: "Ir para a página 2", exact: true })
    .click();
  await page.getByText(/Página 2 de/).waitFor();
  await page
    .getByRole("status")
    .filter({ hasText: "Renderizando página…" })
    .waitFor({ state: "hidden" });
  assert.equal(
    await page
      .getByRole("button", { name: "Ir para a página 2", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
  fs.mkdirSync("test-results/editor-preview", { recursive: true });
  await page
    .locator(".pdf-thumbnails")
    .screenshot({ path: "test-results/editor-preview/page-thumbnails.png" });
  await page
    .getByRole("button", { name: "Ir para a página 1", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Renderizando página…" })
    .waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Próxima página", exact: true })
    .click();
  await page.getByText(/Página 2 de/).waitFor();
  await page
    .getByRole("status")
    .filter({ hasText: "Renderizando página…" })
    .waitFor({ state: "hidden" });
  await page.getByLabel("Posição das fotos nos blocos").selectOption("left");
  await page
    .getByRole("status")
    .filter({ hasText: "A prévia está desatualizada" })
    .waitFor();
  await page
    .getByRole("button", { name: "Atualizar prévia", exact: true })
    .click();
  await page.getByText(/Página 1 de/).waitFor();
  await page
    .getByRole("status")
    .filter({ hasText: "A prévia está desatualizada" })
    .waitFor({ state: "hidden" });
  await page
    .getByText("Edição visual livre · opcional", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar texto livre", exact: true })
    .click();
  await page
    .getByLabel("Texto livre", { exact: true })
    .fill("Observação visual — confirmação");
  await page
    .getByLabel("Adicionar imagem livre", { exact: true })
    .setInputFiles("src/assets/example-sedan.png");
  await page.locator(".free-element img").waitFor();
  await page.locator(".pdf-thumbnail-overlay img").waitFor();
  assert.equal(
    await page.locator(".pdf-thumbnail-overlay").filter({ hasText: "Observação visual — confirmação" }).count(),
    1,
    "Live free-layout edits also appear in the page thumbnail",
  );
  const object = page.getByRole("button", {
    name: "Mover Observação visual — confirmação",
    exact: true,
  });
  await page
    .getByRole("status")
    .filter({ hasText: "Renderizando página…" })
    .waitFor({ state: "hidden" });
  await object.evaluate((e) => e.scrollIntoView({ block: "center" }));
  const before = await object.boundingBox();
  await page.mouse.move(before.x + 4, before.y + 4);
  await page.mouse.down();
  await page.mouse.move(before.x + 104, before.y + 64, { steps: 6 });
  await page.mouse.up();
  const after = await object.boundingBox();
  assert.ok(after.x > before.x + 70);
  assert.ok(after.y > before.y + 40);
  await page
    .getByRole("button", { name: "Desfazer ajuste livre", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Refazer ajuste livre", exact: true })
    .click();
  await object.waitFor();
  fs.mkdirSync("test-results/editor-preview", { recursive: true });
  await page.screenshot({
    path: "test-results/editor-preview/visual-editor.png",
  });
  const position = await object.boundingBox(),
    surface = await page.locator(".pdf-edit-surface").boundingBox();
  const expectedX = (position.x - surface.x) / surface.width;
  await page
    .getByRole("button", { name: "Gerar documento", exact: true })
    .click();
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).waitFor();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
  fs.mkdirSync("test-results/editor-preview", { recursive: true });
  const file = "test-results/editor-preview/free-layout.pdf";
  await (await download).saveAs(file);
  const task = getDocument({
      data: new Uint8Array(fs.readFileSync(file)),
      isEvalSupported: false,
    }),
    pdf = await task.promise,
    first = await pdf.getPage(1),
    text = await first.getTextContent(),
    item = text.items.find((x) => x.str === "Observação visual — confirmação");
  assert.ok(item, "Free text must be in the exported PDF");
  assert.ok(
    Math.abs(item.transform[4] / first.view[2] - expectedX) < 0.01,
    "Exported position matches visual drag",
  );
  await task.destroy();
  await page.getByRole("button", { name: "Reutilizar", exact: true }).click();
  await page
    .getByRole("button", { name: "Visualizar antes de finalizar", exact: true })
    .click();
  await page.getByText(/Página 1 de/).waitFor();
  await object.waitFor();
  assert.equal(await page.locator(".profile").count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    "Unsaved editor preview: image position and fit, PDF pagination, drag, undo/redo, export coordinates and saved edits work offline.",
  );
} finally {
  await browser.close();
}
