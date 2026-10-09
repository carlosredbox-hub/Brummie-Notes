import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import PdfWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs?worker&inline";
let worker;
export async function readPdf(file) {
  if (file.size > 25 * 1024 * 1024)
    throw new Error("Cada PDF pode ter até 25 MB.");
  worker ??= new PdfWorker();
  pdfjs.GlobalWorkerOptions.workerPort = worker;
  const bytes = await file.arrayBuffer();
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
    throw new Error("Selecione um PDF válido.");
  const task = pdfjs.getDocument({
    data: bytes,
    useSystemFonts: true,
    isEvalSupported: false,
  });
  try {
    const doc = await task.promise;
    if (doc.numPages > 150) throw new Error("O PDF pode ter até 150 páginas.");
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push(
        content.items.map((i) => i.str + (i.hasEOL ? "\n" : " ")).join(""),
      );
    }
    return pages.join("\n\n");
  } finally {
    await task.destroy();
  }
}
export function suggestions(text) {
  const matches = [...text.matchAll(/R\$\s*([\d.]+(?:,\d{2})?)/g)].map((m) =>
    Number(m[1].replace(/\./g, "").replace(",", ".")),
  );
  const lines = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    type: /Voucher/i.test(text)
      ? "voucher"
      : /CAR SELECTION|Orçamento/i.test(text)
        ? "orcamento"
        : "invoice",
    client: lines.find((s) => /^(Sr\.?|Sra\.?|Mr\.?|Mrs\.?)\s/i.test(s)) || "",
    price: matches.length ? Math.max(...matches) : 0,
    description: /HELICÓPTERO/i.test(text)
      ? "Transfer de helicóptero"
      : /Meet And Greet/i.test(text)
        ? "Meet & Greet"
        : "Serviço de transporte",
  };
}
