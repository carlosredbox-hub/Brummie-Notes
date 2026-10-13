import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
const browser = await chromium.launch({
  executablePath: fs.existsSync("/usr/bin/chromium")
    ? "/usr/bin/chromium"
    : undefined,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
    offline: true,
    acceptDownloads: true,
    viewport: { width: 1440, height: 1100 },
  }),
  page = await context.newPage();
const errors = [],
  requests = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url()) && r.url() !== "https://editorial.test/")
    requests.push(r.url());
});
await context.route("https://editorial.test/", (r) =>
  r.fulfill({
    contentType: "text/html",
    body: fs.readFileSync("dist/index.html", "utf8"),
  }),
);
fs.mkdirSync("test-results/editorial", { recursive: true });
try {
  await page.goto("https://editorial.test/");
  await page
    .getByRole("button", { name: "Criar documentos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Criar seleção de hospedagem", exact: true })
    .click();
  await page.getByLabel("Cliente / titular").fill("Cliente de demonstração");
  await page
    .getByLabel("Cidade / local da capa")
    .fill("São Paulo Trip • 3 nights");
  await page
    .getByLabel("Período na capa (opcional)")
    .fill("November 7th to 9th, 2026");
  const photos = process.argv.slice(2);
  const photo = photos[0] || "src/assets/realestate-cover.jpeg";
  await page.getByLabel("Cidade da opção 1").fill("SÃO PAULO");
  await page
    .getByLabel("Nome do quarto / imóvel 1")
    .fill("Premium Suite (Double rooms)");
  await page
    .getByLabel("Descrição da opção 1")
    .fill(
      "Bright accommodation with a living area, work desk and comfortable double bed. Photos supplied by the user; prices are demonstration data.",
    );
  await page.getByLabel("Quartos da opção 1").fill("12");
  await page.getByLabel("Noites da opção 1").fill("3");
  await page.getByLabel("Diária da opção 1").fill("1120");
  await page.getByLabel("Inclusões da opção 1").fill("Breakfast included.");
  await page.getByLabel("Foto da hospedagem 1").setInputFiles(photo);
  await page
    .getByRole("button", {
      name: "Adicionar alternativa de hospedagem",
      exact: true,
    })
    .click();
  await page.getByLabel("Cidade da opção 2").fill("SÃO PAULO");
  await page
    .getByLabel("Nome do quarto / imóvel 2")
    .fill("Executive Suite (Double rooms)");
  await page
    .getByLabel("Descrição da opção 2")
    .fill(
      "An alternative with a separate living room, dining table and generous space for a comfortable stay.",
    );
  await page.getByLabel("Quartos da opção 2").fill("12");
  await page.getByLabel("Noites da opção 2").fill("3");
  await page.getByLabel("Preço da opção 2").selectOption("total");
  await page.getByLabel("Total da opção 2").fill("70500");
  await page.getByLabel("Inclusões da opção 2").fill("Breakfast included.");
  await page
    .getByLabel("Foto da hospedagem 2")
    .setInputFiles(photos[1] || photo);
  await page
    .getByRole("button", { name: "Gerar documento", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Seu documento está pronto", exact: true })
    .waitFor();
  await page.getByText("Página 1 de 2", { exact: true }).waitFor();
  await page.getByRole("status").waitFor({ state: "hidden" });
  await page
    .locator(".actual-pdf-preview canvas")
    .screenshot({ path: "test-results/editorial/cover.png" });
  await page
    .getByRole("button", { name: "Próxima página", exact: true })
    .click();
  await page.getByRole("status").waitFor({ state: "hidden" });
  await page.getByText("Página 2 de 2", { exact: true }).waitFor();
  await page
    .locator(".actual-pdf-preview canvas")
    .screenshot({ path: "test-results/editorial/options.png" });
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
  await (await pending).saveAs("test-results/editorial/property-selection.pdf");
  const task = getDocument({
    data: new Uint8Array(
      fs.readFileSync("test-results/editorial/property-selection.pdf"),
    ),
    isEvalSupported: false,
  });
  const pdf = await task.promise;
  assert.equal(pdf.numPages, 2);
  const body = (await (await pdf.getPage(2)).getTextContent()).items
    .map((i) => i.str)
    .join(" ");
  assert.match(body, /Premium Suite/);
  assert.match(body, /40,320.00/);
  assert.match(body, /70,500.00/);
  assert.doesNotMatch(body, /110,820|110\.820/);
  const fonts = (await (await pdf.getPage(2)).getTextContent()).styles;
  assert.ok(Object.values(fonts).some((s) => s.fontFamily));
  await task.destroy();
  await page
    .getByLabel("Nome para salvar modelo")
    .fill("Seleção visual de demonstração");
  await page
    .getByRole("button", { name: "Salvar modelo", exact: true })
    .click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Meus modelos", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Seleção visual de demonstração",
      exact: true,
    })
    .waitFor();
  await page
    .locator(".template-card")
    .filter({
      has: page.getByRole("heading", {
        name: "Seleção visual de demonstração",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Usar modelo", exact: true })
    .click();
  assert.equal(await page.getByLabel("Total da opção 2").inputValue(), "70500");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page
    .getByRole("button", { name: "Importar PDF anterior", exact: true })
    .click();
  await page
    .getByLabel("PDF anterior (até 25 MB)")
    .setInputFiles("test-results/editorial/property-selection.pdf");
  await page.getByLabel("Cliente (revise)").fill("Cliente de demonstração");
  await page
    .getByLabel("Nome do modelo", { exact: true })
    .fill("Referência fotográfica");
  await page
    .getByRole("button", { name: "Guardar PDF e modelo", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Referência fotográfica", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Biblioteca de PDFs", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Extrair fotos deste PDF", exact: true })
    .click();
  await page
    .getByRole("button", { name: /[1-9]\d* fotos disponíveis/ })
    .waitFor();
  await page
    .getByRole("button", { name: "Criar documentos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Criar seleção de hospedagem", exact: true })
    .click();
  const picker = page
    .locator(".property-option")
    .first()
    .locator(".reference-photo-picker");
  await picker.locator("summary").click();
  assert.ok((await picker.locator("img").count()) >= 2);
  await picker.getByRole("button").first().click();
  await page
    .getByLabel("Foto da hospedagem 1")
    .locator("..")
    .locator("img")
    .waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  console.log(
    "Editorial PDF: real preview, two independent photo options, exact prices, embedded fonts, saved reusable model, offline.",
  );
} finally {
  await browser.close();
}
