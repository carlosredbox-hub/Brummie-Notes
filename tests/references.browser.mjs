import { chromium } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const [htmlPath, packPath] = process.argv.slice(2);
if (!htmlPath || !packPath)
  throw new Error(
    "Usage: node tests/references.browser.mjs PRIVATE.html PRIVATE_PACK.json",
  );
const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
const html = fs.readFileSync(htmlPath, "utf8");
const browser = await chromium.launch({
  executablePath: fs.existsSync("/usr/bin/chromium")
    ? "/usr/bin/chromium"
    : undefined,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  offline: true,
  acceptDownloads: true,
  viewport: { width: 1440, height: 1080 },
});
const page = await context.newPage();
const errors = [],
  requests = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url()) && r.url() !== "https://brummie-reference.test/")
    requests.push(r.url());
});
await context.route("https://brummie-reference.test/**", (r) =>
  r.request().url() === "https://brummie-reference.test/"
    ? r.fulfill({ contentType: "text/html", body: html })
    : r.abort(),
);
try {
  await page.goto("https://brummie-reference.test/");
  await page
    .getByText("Seus documentos anteriores são o ponto de partida do próximo.")
    .waitFor();
  const stored = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("brummie-offline-v1", 1);
        request.onsuccess = () => {
          const db = request.result;
          const get = db
            .transaction("workspace")
            .objectStore("workspace")
            .get("data");
          get.onsuccess = async () => {
            const data = get.result;
            const records = await Promise.all(
              data.records.map(async (r) =>
                r.kind === "archive"
                  ? {
                      ...r,
                      source: Array.from(
                        new Uint8Array(await r.source.arrayBuffer()),
                      ),
                    }
                  : r,
              ),
            );
            resolve({ ...data, records });
            db.close();
          };
          get.onerror = () => reject(get.error);
        };
      }),
  );
  for (const reference of pack.records) {
    const actual = stored.records.find((r) => r.id === reference.id);
    assert.ok(actual, "every provided reference was loaded");
    if (reference.kind === "archive")
      assert.equal(
        createHash("sha256").update(Buffer.from(actual.source)).digest("hex"),
        createHash("sha256")
          .update(Buffer.from(reference.source.base64, "base64"))
          .digest("hex"),
      );
  }
  const backup = {
    ...stored,
    records: stored.records.map((record) =>
      record.kind === "archive"
        ? {
            ...record,
            source: {
              _blob: true,
              type: "application/pdf",
              base64: Buffer.from(record.source).toString("base64"),
            },
          }
        : record,
    ),
  };
  fs.writeFileSync(
    htmlPath.replace(/\.html$/i, "-Biblioteca.json"),
    JSON.stringify(backup),
  );
  await page.getByRole("button", { name: "Meus modelos", exact: true }).click();
  const templates = pack.records.filter((r) => r.kind === "template");
  for (const t of templates) {
    const card = page.locator(".template-card").filter({
      has: page.getByRole("heading", { name: t.name, exact: true }),
    });
    await card
      .getByRole("button", { name: "Usar modelo", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Nome do cliente / Empresa").inputValue(),
      t.content.client,
    );
    const expected = t.content.items.reduce(
      (sum, i) => sum + i.quantity * i.price + i.extra,
      0,
    );
    const prices = await page
      .getByLabel("Preço unitário")
      .evaluateAll((elements) => elements.map((element) => element.value));
    assert.equal(prices.length, t.content.items.length);
    assert.deepEqual(
      prices.map(Number),
      t.content.items.map((i) => i.price),
    );
    const dates = await page
      .getByLabel("Data", { exact: true })
      .evaluateAll((elements) => elements.map((element) => element.value));
    if (dates.length) {
      const span = (d) => Date.parse(d[d.length - 1]) - Date.parse(d[0]);
      assert.equal(span(dates), span(t.content.items.map((i) => i.date)));
    }
    await page
      .getByRole("button", { name: "Gerar documento", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Seu documento está pronto", exact: true })
      .waitFor();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
    const file = await download;
    const filePath = await file.path();
    const bytes = fs.readFileSync(filePath);
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    console.log(
      `Reference template validated: ${t.content.type}, ${prices.length} services, total ${expected}`,
    );
  }
  await page.reload();
  await page
    .getByRole("button", { name: "Biblioteca de PDFs", exact: true })
    .click();
  assert.equal(
    await page.locator(".archive-row").count(),
    pack.records.filter((r) => r.kind === "archive").length,
  );
  fs.mkdirSync("test-results", { recursive: true });
  await page.screenshot({
    path: "test-results/references-library.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "library fits mobile",
  );
  await page
    .getByRole("button", { name: "Exportar backup", exact: true })
    .click();
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.getByRole("button", { name: "Meus modelos", exact: true }).click();
  await page.screenshot({
    path: "test-results/references-templates.png",
    fullPage: true,
  });
  const other = await browser.newContext({ offline: true });
  await other.route("https://brummie-reference.test/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: fs.readFileSync("dist/index.html", "utf8"),
    }),
  );
  const second = await other.newPage();
  await second.goto("https://brummie-reference.test/");
  await second
    .getByText("Seus documentos anteriores são o ponto de partida do próximo.")
    .waitFor();
  second.once("dialog", (dialog) => dialog.accept());
  await second
    .locator(".restore-label input")
    .setInputFiles(htmlPath.replace(/\.html$/i, "-Biblioteca.json"));
  await second
    .getByRole("button", { name: "Biblioteca de PDFs", exact: true })
    .click();
  await second.locator(".archive-row").first().waitFor();
  assert.equal(await second.locator(".archive-row").count(), 8);
  await second
    .getByRole("button", { name: "Meus modelos", exact: true })
    .click();
  assert.equal(
    await second.locator(".template-card").count(),
    templates.length + 5,
  );
  assert.equal(
    backup.documents.length,
    0,
    "backup does not contain generated test invoices",
  );
  await other.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  console.log(
    "Private PDF dataset: all originals byte-identical, all templates emit locally, no network, responsive library.",
  );
} finally {
  await browser.close();
}
