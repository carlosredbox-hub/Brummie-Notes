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
  page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await context.route("https://themes.test/", (r) =>
  r.fulfill({
    contentType: "text/html",
    body: fs.readFileSync("dist/index.html", "utf8"),
  }),
);
fs.mkdirSync("test-results/themes", { recursive: true });
const download = async (name) => {
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
  const file = `test-results/themes/${name}.pdf`;
  await (await promise).saveAs(file);
  const task = getDocument({
      data: new Uint8Array(fs.readFileSync(file)),
      isEvalSupported: false,
    }),
    pdf = await task.promise;
  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const words = (await (await pdf.getPage(p)).getTextContent()).items
      .map((x) => x.str)
      .join(" ");
    assert.ok(
      words.includes("contato@brummie.example"),
      `${name} footer email page${p}`,
    );
    assert.ok(words.includes("00000-0000"));
    assert.ok(words.includes("BRM-09001"));
    if (p === 1 && name !== "commercial-blue")
      assert.ok(
        !words.includes("R$"),
        `${name}: cover must never contain automatic prices`,
      );
    text += words;
  }
  await task.destroy();
  return text;
};
try {
  await page.goto("https://themes.test/");
  await page
    .getByRole("button", { name: "Novo documento", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Exemplo completo: Invoice", exact: true })
    .click();
  for (const theme of ["basic", "orange", "gold", "blue"]) {
    await page.getByLabel("Tema deste documento").selectOption(theme);
    await page.getByText(/Página 1 de/).waitFor();
    const text = await download(theme);
    assert.equal(
      text.split("3.380,00").length - 1,
      1,
      `${theme}: grand total appears once, in the commercial body`,
    );
    for (const item of [
      "Transfer executivo",
      "Van executiva",
      "480,00",
      "3.000,00",
      "3.380,00",
      "cliente@exemplo.example",
    ])
      assert.ok(text.includes(item), `${theme} preserves ${item}`);
  }
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page
    .getByRole("radio", { name: "Escuro + dourado", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Salvar configurações", exact: true })
    .click();
  await page
    .locator(".toast")
    .filter({ hasText: "Configurações salvas" })
    .waitFor();
  await page.reload();
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("radio", { name: "Escuro + dourado", exact: true })
      .isChecked(),
    true,
  );
  await page
    .getByRole("button", { name: "Criar documentos", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Exemplo completo: Voucher de hospedagem",
      exact: true,
    })
    .click();
  assert.equal(
    await page.getByLabel("Tema deste documento").inputValue(),
    "gold",
  );
  await download("hotel-gold");
  await page.getByLabel("Tema deste documento").selectOption("orange");
  await download("hotel-orange");
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Exemplo completo: Proposta comercial",
      exact: true,
    })
    .click();
  await page.getByLabel("Tema deste documento").selectOption("blue");
  const table = await download("commercial-blue");
  assert.ok(table.includes("GIG"));
  assert.ok(table.includes("Veículos"));
  assert.deepEqual(errors, []);
  console.log(
    "Four visual themes preserve all data and every footer; global default persists; hotel and landscape adapt.",
  );
} finally {
  await browser.close();
}
