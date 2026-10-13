import fontkit from "@pdf-lib/fontkit";
import sansFont from "./assets/fonts/OpenSans-Regular.ttf?inline";
import { PDFDocument, rgb } from "pdf-lib";
export async function applyFreeElements(blob, elements = []) {
  if (!elements.length) return blob;
  const pdf = await PDFDocument.load(await blob.arrayBuffer());
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(
    Uint8Array.from(atob(sansFont.slice(sansFont.indexOf(",") + 1)), (c) =>
      c.charCodeAt(0),
    ),
    { subset: true },
  );
  if (elements.length > 100)
    throw new Error("Use até 100 elementos livres por documento.");
  for (const element of elements) {
    if (
      !["text", "image"].includes(element.kind) ||
      ![element.x, element.y].every(
        (n) => Number.isFinite(n) && n >= 0 && n <= 1,
      )
    )
      throw new Error("Revise a posição do elemento livre.");
    const page = pdf.getPages()[element.page - 1];
    if (!page)
      throw new Error(
        `Elemento livre na página ${element.page}: o PDF tem ${pdf.getPageCount()} páginas. Revise a página do elemento.`,
      );
    const { width, height } = page.getSize();
    const x = element.x * width,
      top = element.y * height;
    if (element.kind === "image") {
      const image = element.data.startsWith("data:image/png")
        ? await pdf.embedPng(element.data)
        : await pdf.embedJpg(element.data);
      const w = element.width * width,
        h = (w * image.height) / image.width;
      page.drawImage(image, { x, y: height - top - h, width: w, height: h });
    } else {
      const color = /^#[a-f0-9]{6}$/i.test(element.color || "")
        ? element.color
        : "#142f62";
      const channels = [1, 3, 5].map(
        (i) => parseInt(color.slice(i, i + 2), 16) / 255,
      );
      page.drawText(element.text || "", {
        x,
        y: height - top - (element.size || 14),
        size: element.size || 14,
        font,
        color: rgb(...channels),
      });
    }
  }
  return new Blob([await pdf.save()], { type: "application/pdf" });
}
