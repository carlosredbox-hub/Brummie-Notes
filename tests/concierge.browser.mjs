import { chromium } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
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
  viewport: { width: 1440, height: 1100 },
});
const page = await context.newPage();
const errors = [],
  network = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url()) && r.url() !== "https://concierge.test/")
    network.push(r.url());
});
await context.route("https://concierge.test/", (route) =>
  route.fulfill({
    contentType: "text/html",
    body: fs.readFileSync("dist/index.html", "utf8"),
  }),
);
fs.mkdirSync("test-results/concierge", { recursive: true });
const ready = () =>
  page
    .getByRole("heading", { name: "Seu documento está pronto", exact: true })
    .waitFor();
const save = async (name) => {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
  const download = await pending;
  await download.saveAs(`test-results/concierge/${name}.pdf`);
  return PDFDocument.load(
    fs.readFileSync(`test-results/concierge/${name}.pdf`),
  );
};
const close = () =>
  page.getByRole("button", { name: "Fechar", exact: true }).click();
try {
  await page.goto("https://concierge.test/");
  await page
    .getByText("Seus documentos anteriores são o ponto de partida do próximo.")
    .waitFor();
  await page
    .getByRole("button", { name: "Guias & experiências", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Criar Home Guide", exact: true })
    .click();
  await page.getByLabel("Título do guia").fill("Guia de demonstração");
  await page
    .getByLabel("Endereço do imóvel")
    .fill("Endereço fictício — Rio de Janeiro");
  await page.getByLabel("Nome da rede Wi-Fi").fill("Rede demonstração");
  await page.getByLabel("Senha do Wi-Fi").fill("senha-demo");
  await page
    .getByLabel("Texto da seção 1")
    .fill(
      "Instruções de demonstração. <script>window.invalidGuide = true;</script>",
    );
  await page
    .getByRole("button", { name: "Gerar documento", exact: true })
    .click();
  await ready();
  const guide = await save("guia");
  assert.ok(guide.getPageCount() >= 2);
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Baixar guia para celular (HTML)",
      exact: true,
    })
    .click();
  const html = await pending;
  await html.saveAs("test-results/concierge/guia.html");
  const content = fs.readFileSync("test-results/concierge/guia.html", "utf8");
  assert.ok(content.includes("data:image/png;base64"));
  assert.ok(content.includes("Rede demonstração"));
  assert.ok(content.includes("&lt;script&gt;"));
  assert.ok(!content.includes("<script>window.invalidGuide"));
  await page.getByLabel("Nome para salvar modelo").fill("Guia reutilizável");
  await page
    .getByRole("button", { name: "Salvar modelo", exact: true })
    .click();
  await close();
  await page
    .getByRole("button", { name: "Criar Voucher de hospedagem", exact: true })
    .click();
  await page.getByLabel("Cliente / titular").fill("Hóspede de demonstração");
  await page.getByLabel("Nome do hotel").fill("Hotel de demonstração");
  await page.getByLabel("Check-in", { exact: true }).fill("2027-01-10");
  await page.getByLabel("Check-out", { exact: true }).fill("2027-01-13");
  await page.getByLabel("Quantidade de quartos 1", { exact: true }).fill("2");
  await page.getByLabel("Valor da diária 1", { exact: true }).fill("500");
  await page
    .getByRole("button", { name: "Adicionar pagamento", exact: true })
    .click();
  await page.getByLabel("Valor pago 1", { exact: true }).fill("1000");
  await page
    .getByRole("button", { name: "Gerar documento", exact: true })
    .click();
  await ready();
  await save("hospedagem");
  await page.getByText("Saldo: R$ 2.000,00", { exact: false }).waitFor();
  await close();
  // Import the generated guide as a genuine original attachment, then merge without changing pages.
  await page
    .getByRole("button", { name: "Importar PDF anterior", exact: true })
    .click();
  await page
    .getByLabel("PDF anterior (até 25 MB)")
    .setInputFiles("test-results/concierge/guia.pdf");
  await page.getByLabel("Cliente (revise)").fill("Cliente de demonstração");
  await page
    .getByLabel("Nome do modelo", { exact: true })
    .fill("Anexo original de demonstração");
  await page
    .getByRole("button", { name: "Guardar PDF e modelo", exact: true })
    .click();
  await page
    .getByRole("heading", {
      name: "Anexo original de demonstração",
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("button", { name: "Guias & experiências", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Criar Proposta de experiência", exact: true })
    .click();
  await page.getByLabel("Cliente / titular").fill("Cliente de demonstração");
  await page
    .getByLabel("Título da proposta")
    .fill("Experiência de demonstração");
  await page.getByLabel("Preço 1", { exact: true }).fill("350");
  await page.getByLabel("Quantidade 1", { exact: true }).fill("2");
  await page.getByRole("checkbox", { name: "guia.pdf", exact: false }).check();
  await page
    .getByRole("button", { name: "Gerar documento", exact: true })
    .click();
  await ready();
  const proposal = await save("proposta");
  assert.ok(
    proposal.getPageCount() > guide.getPageCount(),
    "original pages were appended",
  );
  await close();
  await page
    .getByRole("button", { name: "Criar Horas extras", exact: true })
    .click();
  await page.getByLabel("Cliente / titular").fill("Cliente de demonstração");
  await page.getByLabel("Diária por veículo 1.1", { exact: true }).fill("1900");
  await page.getByLabel("Início 1.1", { exact: true }).fill("06:30");
  await page.getByLabel("Fim 1.1", { exact: true }).fill("23:30");
  await page
    .getByLabel("Quantidade de veículos 1.1", { exact: true })
    .fill("2");
  await page.getByLabel("Total impresso no original (opcional)").fill("3000");
  await page
    .getByLabel("Horas extras manuais (opcional) 1.1", { exact: true })
    .fill("8");
  await page
    .getByRole("button", { name: "Gerar documento", exact: true })
    .click();
  await ready();
  await save("horas");
  await page
    .locator(".concierge-paper")
    .getByText("exceção manual", { exact: false })
    .waitFor();
  await close();
  await page
    .getByRole("button", { name: "Documentos internos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Novo demonstrativo interno", exact: true })
    .click();
  await page
    .getByLabel("Parceiro / operação", { exact: true })
    .fill("Operação fictícia");
  await page
    .getByLabel("Valor unitário interno 1", { exact: true })
    .fill("100");
  await page
    .getByRole("button", { name: "Gerar documento", exact: true })
    .click();
  await ready();
  await save("interno");
  await close();
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  assert.equal(
    await page.getByText("Operação fictícia", { exact: false }).count(),
    0,
    "internal document not shown in customer dashboard",
  );
  await page.reload();
  await page.getByRole("button", { name: "Meus modelos", exact: true }).click();
  await page
    .getByRole("heading", { name: "Guia reutilizável", exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  console.log(
    "Concierge offline flow passed: guide PDF/HTML/QR, hotel arithmetic, original PDF merging, overtime exception, internal isolation and persistence.",
  );
} finally {
  await browser.close();
}
