import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { openLocalPdf } from "./pdf-import.js";

const multiply = (a, b) => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];
export async function extractPdfPhotos(blob) {
  if (blob.size > 25 * 1024 * 1024)
    throw new Error("O PDF pode ter até25 MB para extrair fotos.");
  const { task, doc } = await openLocalPdf(blob),
    photos = [],
    seen = new Set();
  try {
    for (
      let pageNumber = 1;
      pageNumber <= Math.min(doc.numPages, 25) && photos.length < 18;
      pageNumber++
    ) {
      const page = await doc.getPage(pageNumber),
        ops = await page.getOperatorList(),
        viewport = page.getViewport({ scale: 1 });
      let matrix = [1, 0, 0, 1, 0, 0];
      const stack = [];
      for (
        let index = 0;
        index < ops.fnArray.length && photos.length < 18;
        index++
      ) {
        const op = ops.fnArray[index],
          args = ops.argsArray[index];
        if (op === pdfjs.OPS.save) stack.push([...matrix]);
        else if (op === pdfjs.OPS.restore)
          matrix = stack.pop() || [1, 0, 0, 1, 0, 0];
        else if (op === pdfjs.OPS.transform) matrix = multiply(matrix, args);
        else if (
          op === pdfjs.OPS.paintImageXObject ||
          op === pdfjs.OPS.paintInlineImageXObject
        ) {
          const width = Math.hypot(matrix[0], matrix[1]),
            height = Math.hypot(matrix[2], matrix[3]);
          if (
            width < 110 ||
            height < 80 ||
            (width > viewport.width * 0.9 && height > viewport.height * 0.6)
          )
            continue;
          const key =
            typeof args[0] === "string"
              ? `${pageNumber}-${args[0]}`
              : `${pageNumber}-${index}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const img =
            typeof args[0] === "string"
              ? await new Promise((resolve) => page.objs.get(args[0], resolve))
              : args[0];
          if (!img?.width || !img.height) continue;
          const source = document.createElement("canvas");
          source.width = img.width;
          source.height = img.height;
          const ctx = source.getContext("2d");
          if (img.bitmap) ctx.drawImage(img.bitmap, 0, 0);
          else if (
            img.kind === pdfjs.ImageKind.RGB_24BPP ||
            img.kind === pdfjs.ImageKind.RGBA_32BPP
          ) {
            const rgba = new Uint8ClampedArray(img.width * img.height * 4);
            if (img.kind === pdfjs.ImageKind.RGBA_32BPP) rgba.set(img.data);
            else
              for (let p = 0, q = 0; p < img.data.length; p += 3, q += 4) {
                rgba[q] = img.data[p];
                rgba[q + 1] = img.data[p + 1];
                rgba[q + 2] = img.data[p + 2];
                rgba[q + 3] = 255;
              }
            ctx.putImageData(new ImageData(rgba, img.width, img.height), 0, 0);
          } else continue;
          const out = document.createElement("canvas"),
            scale = Math.min(1, 1400 / img.width, 1400 / img.height);
          out.width = Math.round(img.width * scale);
          out.height = Math.round(img.height * scale);
          const target = out.getContext("2d");
          target.fillStyle = "white";
          target.fillRect(0, 0, out.width, out.height);
          target.drawImage(source, 0, 0, out.width, out.height);
          photos.push({
            page: pageNumber,
            dataUrl: out.toDataURL("image/jpeg", 0.88),
          });
        }
      }
    }
    return photos;
  } finally {
    await task.destroy();
  }
}
