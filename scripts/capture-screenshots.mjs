import { chromium } from "@playwright/test";
import fs from "node:fs";
const out = "docs/screenshots";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: fs.existsSync("/usr/bin/chromium")
    ? "/usr/bin/chromium"
    : undefined,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  offline: true,
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await context.route("https://brummie-demo.test/", (r) =>
  r.fulfill({
    contentType: "text/html",
    body: fs.readFileSync("dist/index.html", "utf8"),
  }),
);
const shot = async (name) => {
  await page
    .locator(".toast")
    .waitFor({ state: "hidden", timeout: 10000 })
    .catch(() => {});
  await page.screenshot({ path: `${out}/${name}.png`, animations: "disabled" });
};
try {
  await page.goto("https://brummie-demo.test/");
  await page
    .getByText("Seus documentos anteriores são o ponto de partida do próximo.")
    .waitFor();
  await page.getByRole("button", { name: "Configurações", exact: true }).click();
  await page.getByRole("button", { name: "Motoristas", exact: true }).click();
  await page
    .getByRole("button", { name: "Novo cadastro", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Nome", { exact: true })
    .fill("Motorista de demonstração");
  await page.getByLabel("Idiomas").fill("Português • English");
  await page
    .getByRole("button", { name: "Salvar cadastro", exact: true })
    .click();
  await page.getByRole("button", { name: "Configurações", exact: true }).click();
  await page.getByRole("button", { name: "Frota", exact: true }).click();
  await page
    .getByRole("button", { name: "Novo cadastro", exact: true })
    .first()
    .click();
  await page.getByLabel("Modelo / Nome").fill("Sedan executivo • exemplo");
  await page.getByLabel("Placa", { exact: true }).fill("ABC1D23");
  await page.getByLabel("Categoria").fill("Sedan executivo");
  await page
    .getByRole("button", { name: "Salvar cadastro", exact: true })
    .click();
  await page.getByRole("button", { name: "Início", exact: true }).click();
  await page
    .getByRole("button", { name: "Novo documento", exact: true })
    .click();
  await page.getByRole("button", {name:"Criar Invoice",exact:true}).click();
  await page
    .getByLabel("Nome do cliente / Empresa")
    .fill("Empresa Exemplo • demonstração");
  await page.getByLabel("Preço unitário").fill("400");
  await page.getByLabel("Origem", { exact: true }).fill("Aeroporto GIG");
  await page.getByLabel("Destino", { exact: true }).fill("Copacabana");
  await page
    .getByRole("button", { name: "Gerar documento", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Seu documento está pronto", exact: true })
    .waitFor();
  await shot("02-invoice");
  const pdf = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
  const downloaded = await pdf;
  fs.mkdirSync("test-results", { recursive: true });
  await downloaded.saveAs("test-results/demo-invoice.pdf");
  await page
    .getByLabel("Nome para salvar modelo")
    .fill("Transfer recorrente • exemplo");
  await page
    .getByRole("button", { name: "Salvar modelo", exact: true })
    .click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await shot("01-dashboard");
  await page.getByRole("button", { name: "Meus modelos", exact: true }).click();
  await shot("03-modelos");
  await page.getByRole("button", { name: "Início", exact: true }).click();
  await page
    .getByRole("button", { name: "Criar nota de atendimento", exact: true })
    .click();
  await page
    .getByLabel("Nome do cliente / Empresa")
    .fill("Cliente de demonstração");
  await page
    .getByLabel("Motorista", { exact: true })
    .selectOption({ label: "Motorista de demonstração" });
  await page
    .getByLabel("Veículo", { exact: true })
    .selectOption({ label: "Sedan executivo • exemplo • ABC1D23" });
  await page.getByLabel("Origem", { exact: true }).fill("Aeroporto GIG");
  await page.getByLabel("Destino", { exact: true }).fill("Copacabana");
  await page
    .getByRole("button", { name: "Gerar documento", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Seu documento está pronto", exact: true })
    .waitFor();
  await page.setViewportSize({ width: 1440, height: 1400 });
  await shot("04-atendimento");
  const noteDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
  await (await noteDownload).saveAs("test-results/demo-nota.pdf");
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("05-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Importar PDF anterior", exact: true })
    .click();
  await page
    .getByLabel("PDF anterior (até 25 MB)")
    .setInputFiles("test-results/demo-invoice.pdf");
  await page
    .getByLabel("Cliente (revise)")
    .fill("Empresa Exemplo • demonstração");
  await page
    .getByLabel("Nome do modelo", { exact: true })
    .fill("PDF anterior • exemplo");
  await page
    .getByRole("button", { name: "Guardar PDF e modelo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Biblioteca de PDFs", exact: true })
    .click();
  await shot("06-biblioteca");
  await page.getByRole("button", { name: "Criar documentos", exact: true }).click();
  await shot("07-concierge");
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Seven real app screenshots captured with fictitious demo data, offline.",
  );
} finally {
  await browser.close();
}
