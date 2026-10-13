import { PDFDocument } from "pdf-lib";
export async function appendOriginalPdfs(base, attachments) {
  if (!attachments.length) return base;
  const target = await PDFDocument.load(await base.arrayBuffer());
  for (const attachment of attachments) {
    if (!attachment.source)
      throw new Error(`Anexo não encontrado: ${attachment.name}`);
    let source;
    try {
      source = await PDFDocument.load(await attachment.source.arrayBuffer());
    } catch {
      throw new Error(
        `Não foi possível anexar ${attachment.name}. Use um PDF válido e sem senha.`,
      );
    }
    if (target.getPageCount() + source.getPageCount() > 600)
      throw new Error(
        "Os documentos anexados excedem 600 páginas. Divida o pacote.",
      );
    for (const page of await target.copyPages(source, source.getPageIndices()))
      target.addPage(page);
  }
  return new Blob([await target.save()], { type: "application/pdf" });
}
