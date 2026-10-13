import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
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
  errors = [],
  requests = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url()) && r.url() !== "https://examples.test/")
    requests.push(r.url());
});
await context.route("https://examples.test/", (r) =>
  r.fulfill({
    contentType: "text/html",
    body: fs.readFileSync("dist/index.html", "utf8"),
  }),
);
fs.mkdirSync("test-results/examples", { recursive: true });
const multiply = (a, b) => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];
try {
  await page.goto("https://examples.test/");
  await page
    .getByRole("button", { name: "Novo documento", exact: true })
    .click();
  const examples = page.getByRole("button", { name: /^Exemplo completo:/ }),
    count = await examples.count();
  assert.equal(count, 15);
  for (let i = 0; i < count; i++) {
    const label = await examples.nth(i).innerText();
    await examples.nth(i).click();
    await page
      .getByRole("heading", { name: "Seu documento está pronto", exact: true })
      .waitFor();
    await page.getByText(/Página 1 de/).waitFor();
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
    const path = `test-results/examples/${i + 1}.pdf`;
    await (await pending).saveAs(path);
    const task = getDocument({
      data: new Uint8Array(fs.readFileSync(path)),
      isEvalSupported: false,
    });
    const pdf = await task.promise;
    let bodyImages = 0,
      allText = "";
    for (let n = 1; n <= pdf.numPages; n++) {
      const p = await pdf.getPage(n),
        text = (await p.getTextContent()).items.map((x) => x.str).join(" ");
      allText += text;
      for (const token of [
        "contato@brummie.example",
        "cliente@exemplo.example",
        "00000-0000",
        "BRM-09001",
        `${n}/${pdf.numPages}`,
      ])
        assert.ok(text.includes(token), `${label} page${n}: ${token}`);
      if (n === 1 && i !== 11) continue;
      const ops = await p.getOperatorList();
      let matrix = [1, 0, 0, 1, 0, 0];
      const stack = [];
      for (let o = 0; o < ops.fnArray.length; o++) {
        const op = ops.fnArray[o],
          args = ops.argsArray[o];
        if (op === OPS.save) stack.push([...matrix]);
        else if (op === OPS.restore) matrix = stack.pop() || [1, 0, 0, 1, 0, 0];
        else if (op === OPS.transform) matrix = multiply(matrix, args);
        else if (
          (op === OPS.paintImageXObject ||
            op === OPS.paintInlineImageXObject) &&
          Math.hypot(matrix[0], matrix[1]) > (i === 12 ? 65 : 110) &&
          Math.hypot(matrix[2], matrix[3]) > (i === 12 ? 45 : 80)
        )
          bodyImages++;
      }
    }
    assert.ok(bodyImages >= 2, `${label} has at least two content photos`);
    if (i === 6) {
      for (const token of [
        "EX-RJ001",
        "EX-BU006",
        "EX-AG010",
        "suítes",
        "banheiros",
        "05/02 a 11/02",
      ])
        assert.ok(allText.includes(token));
      let links = 0;
      for (let n = 1; n <= pdf.numPages; n++)
        links += (await (await pdf.getPage(n)).getAnnotations()).filter((a) =>
          a.url?.startsWith("https://imoveis.example/"),
        ).length;
      assert.equal(links, 3);
    }
    await task.destroy();
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    console.log(
      label + " passed: footer on every page, multiple content images.",
    );
  }
  await page
    .getByRole("button", { name: /^Documentos\s*0$/, exact: false })
    .click();
  assert.equal(
    await page.locator("tbody tr").count(),
    0,
    "examples do not create real records",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  console.log(
    "15 complete examples validated offline without changing user records.",
  );
} finally {
  await browser.close();
}
