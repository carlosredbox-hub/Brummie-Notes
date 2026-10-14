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
});
await context.route("https://mixed.test/", (r) =>
  r.fulfill({
    contentType: "text/html",
    body: fs.readFileSync("dist/index.html", "utf8"),
  }),
);
await context.addInitScript(() => {
  const read = FileReader.prototype.readAsDataURL;
  FileReader.prototype.readAsDataURL = function (file) {
    setTimeout(() => read.call(this, file), 250);
  };
});
const page = await context.newPage();
try {
  await page.goto("https://mixed.test/");
  await page
    .getByRole("button", { name: "Novo documento", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Exemplo completo: Seleção de imóveis",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Reutilizar", exact: true }).click();
  for (let i = 1; i <= 3; i++)
    await page
      .getByText("Versão inglesa dos textos desta opção (opcional)", {
        exact: true,
      })
      .nth(i - 1)
      .click();
  await page
    .getByLabel("Título em inglês da opção 1", { exact: true })
    .fill("Demonstration villa");
  await page
    .getByLabel("Descrição em inglês da opção 1", { exact: true })
    .fill("Illustrative property option with a private garden.");
  await page
    .getByLabel("Categoria da opção 2", { exact: true })
    .selectOption("yacht");
  await page
    .getByLabel("Qualificador de preço 2", { exact: true })
    .selectOption("from");
  await page
    .getByLabel("Nome do quarto / imóvel 2", { exact: true })
    .fill("Passeio náutico de demonstração");
  await page
    .getByLabel("Título em inglês da opção 2", { exact: true })
    .fill("Sailing experience");
  await page
    .getByLabel("Descrição da opção 2", { exact: true })
    .fill("Fotos ilustrativas do destino, não de uma embarcação específica.");
  await page
    .getByLabel("Descrição em inglês da opção 2", { exact: true })
    .fill("Illustrative destination photos, not a particular vessel.");
  await page.getByLabel("Total da opção 2", { exact: true }).fill("3000");
  await page.getByLabel("Código do imóvel 2", { exact: true }).fill("");
  await page.getByLabel("Período da opção 2", { exact: true }).fill("");
  await page
    .getByLabel("Foto da hospedagem 2", { exact: true })
    .setInputFiles("src/assets/realestate-cover.jpeg");
  await page.getByText("Fotos complementares", { exact: true }).nth(1).click();
  await page
    .getByRole("button", { name: "Adicionar foto complementar", exact: true })
    .click();
  await page
    .getByLabel("Foto complementar 2.1", { exact: true })
    .setInputFiles("src/assets/example-hotel-rio.jpeg");
  await page
    .getByLabel("Categoria da opção 3", { exact: true })
    .selectOption("transport");
  await page
    .getByLabel("Preço da opção 3", { exact: true })
    .selectOption("onrequest");
  await page
    .getByLabel("Nome do quarto / imóvel 3", { exact: true })
    .fill("Transporte executivo");
  await page
    .getByLabel("Título em inglês da opção 3", { exact: true })
    .fill("Executive transport");
  await page
    .getByLabel("Descrição em inglês da opção 3", { exact: true })
    .fill("Rate to be confirmed before issuing.");
  await page
    .getByLabel("Foto da hospedagem 3", { exact: true })
    .setInputFiles("src/assets/example-van.jpeg");
  await page.getByLabel("Código do imóvel 3", { exact: true }).fill("");
  await page.getByLabel("Período da opção 3", { exact: true }).fill("");
  await page
    .getByLabel("Observações em inglês (opcional)", { exact: true })
    .fill("DEMONSTRATION — fictitious values and illustrative photos.");
  fs.mkdirSync("test-results", { recursive: true });
  for (const language of ["en", "pt"]) {
    await page
      .getByLabel("Idioma do documento", { exact: true })
      .selectOption(language);
    await page
      .getByRole("button", { name: "Gerar documento", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Seu documento está pronto", exact: true })
      .waitFor();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
    const file = `test-results/mixed-${language}.pdf`;
    await (await download).saveAs(file);
    const task = getDocument({
      data: new Uint8Array(fs.readFileSync(file)),
      isEvalSupported: false,
    });
    const pdf = await task.promise;
    let text = "";
    for (let n = 1; n <= pdf.numPages; n++)
      text += (await (await pdf.getPage(n)).getTextContent()).items
        .map((x) => x.str)
        .join(" ");
    for (const token of language === "en"
      ? [
          "Demonstration villa",
          "Sailing experience",
          "Starting at",
          "Price on request",
          "Executive transport",
        ]
      : [
          "Passeio náutico de demonstração",
          "A partir de",
          "Valor sob consulta",
        ])
      assert.ok(text.includes(token), token);
    await task.destroy();
    await page.getByRole("button", { name: "Reutilizar", exact: true }).click();
    assert.equal(
      await page
        .getByLabel("Título em inglês da opção 2", { exact: true })
        .inputValue(),
      "Sailing experience",
    );
    assert.equal(
      await page
        .getByLabel("Qualificador de preço 2", { exact: true })
        .inputValue(),
      "from",
    );
    assert.equal(
      await page.getByLabel("Preço da opção 3", { exact: true }).inputValue(),
      "onrequest",
    );
    const expectedPhoto =
      "data:image/jpeg;base64," +
      fs.readFileSync("src/assets/example-van.jpeg").toString("base64");
    assert.equal(
      await page
        .getByLabel("Foto da hospedagem 3", { exact: true })
        .locator("..")
        .locator("img")
        .getAttribute("src"),
      expectedPhoto,
      "pending photo must finish before saving",
    );
  }
  console.log(
    "Mixed proposals: PT/EN, optional translations, gallery, minimum/unknown prices and persistence verified offline.",
  );
} finally {
  await browser.close();
}
