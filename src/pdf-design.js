import { themeFor, paintDocumentTheme } from "./document-themes.js";
import linesLogo from "./assets/lines-logo.png";
import estateLogo from "./assets/realestate-logo.png";
import estateMark from "./assets/realestate-mark.png";
import linesMark from "./assets/lines-mark.png";
import { jsPDF } from "jspdf";
import { registerPdfFonts } from "./pdf-fonts.js";

export const moneyFor = (d) => (value) =>
  new Intl.NumberFormat(d.language === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: d.currency,
  }).format(value || 0);
export const dateFor = (d) => (value) =>
  value
    ? new Date(value + "T12:00:00Z").toLocaleDateString(
        d.language === "en" ? "en-GB" : "pt-BR",
        { timeZone: "UTC" },
      )
    : "";
export async function imageBox(
  pdf,
  source,
  x,
  y,
  width,
  height,
  { crop = false, radius = 0, trim = false } = {},
) {
  if (!source) return false;
  try {
    let img = new Image();
    img.src = source;
    await img.decode();
    if (trim) {
      const original = document.createElement("canvas");
      original.width = img.width;
      original.height = img.height;
      const context = original.getContext("2d");
      context.drawImage(img, 0, 0);
      const pixels = context.getImageData(0, 0, img.width, img.height).data;
      let left = img.width,
        top = img.height,
        right = -1,
        bottom = -1;
      for (let yy = 0; yy < img.height; yy++)
        for (let xx = 0; xx < img.width; xx++) {
          if (pixels[(yy * img.width + xx) * 4 + 3] > 24) {
            left = Math.min(left, xx);
            top = Math.min(top, yy);
            right = Math.max(right, xx);
            bottom = Math.max(bottom, yy);
          }
        }
      if (right >= left && bottom >= top) {
        const cropped = document.createElement("canvas");
        cropped.width = right - left + 1;
        cropped.height = bottom - top + 1;
        cropped
          .getContext("2d")
          .drawImage(
            img,
            left,
            top,
            cropped.width,
            cropped.height,
            0,
            0,
            cropped.width,
            cropped.height,
          );
        img = cropped;
      }
    }
    if (!crop && !radius) {
      const ratio = Math.min(width / img.width, height / img.height);
      const w = img.width * ratio,
        h = img.height * ratio;
      pdf.addImage(img, "PNG", x + (width - w) / 2, y + (height - h) / 2, w, h);
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * 6);
      canvas.height = Math.ceil(height * 6);
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.roundRect(0, 0, canvas.width, canvas.height, radius * 6);
      ctx.clip();
      const scale = (crop ? Math.max : Math.min)(
        canvas.width / img.width,
        canvas.height / img.height,
      );
      const w = img.width * scale,
        h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        x,
        y,
        width,
        height,
        undefined,
        "FAST",
      );
    }
    return true;
  } catch {
    return false;
  }
}

export class EditorialPdf {
  constructor(doc) {
    this.doc = {
      ...doc,
      company: {
        ...doc.company,
        logo:
          doc.company.logo ||
          (doc.brand === "realestate" || doc.brand === "luxury"
            ? estateLogo
            : linesLogo),
      },
    };
    this.pdf = new jsPDF({ compress: true });
    registerPdfFonts(this.pdf);
    this.theme = themeFor(doc.theme || doc.company.documentTheme);
    this.y = this.theme.top;
    this.left = this.theme.left;
    this.right = 195;
    this.bottom = 269;
    this.color = /^#[a-f0-9]{6}$/i.test(doc.company.color || "")
      ? doc.company.color
      : "#0089cf";
    this.color = this.theme.accent || this.color;
    this.paintPage();
    this.en = doc.language === "en";
    this.covers = new Set();
  }
  paintPage() {
    paintDocumentTheme(this.pdf, this.doc);
    this.y = this.theme.top;
  }
  font(
    size = 10,
    bold = false,
    serif = false,
    italic = false,
    color = "#181818",
  ) {
    this.pdf.setFont(
      serif ? this.theme.serif : "OpenSans",
      bold && italic
        ? "bolditalic"
        : bold
          ? "bold"
          : italic
            ? "italic"
            : "normal",
    );
    this.pdf.setFontSize(size);
    this.pdf.setTextColor(
      ["#181818", "#666666", "#777777", "#929292"].includes(color)
        ? color === "#181818"
          ? this.theme.ink
          : this.theme.muted
        : color,
    );
  }
  newPage() {
    this.pdf.addPage();
    this.paintPage();
  }
  room(height) {
    if (this.y + height > this.bottom) this.newPage();
  }
  text(
    value,
    {
      size = 10,
      bold = false,
      serif = false,
      italic = false,
      color,
      x = this.left,
      width = this.right - x,
      gap = 4,
      align = "left",
      link,
    } = {},
  ) {
    this.font(size, bold, serif, italic, color);
    const rows = this.pdf.splitTextToSize(String(value || ""), width);
    const lineHeight = size * 0.45;
    for (const line of rows) {
      this.room(lineHeight + 1);
      this.font(size, bold, serif, italic, color);
      const position =
        align === "center" ? x + width / 2 : align === "right" ? x + width : x;
      if (link) {
        this.pdf.textWithLink(line, position, this.y, { url: link, align });
        this.pdf.setDrawColor(color || "#181818");
        this.pdf.line(
          x,
          this.y + 1,
          x + Math.min(width, this.pdf.getTextWidth(line)),
          this.y + 1,
        );
      } else
        this.pdf.text(
          line,
          align === "center"
            ? x + width / 2
            : align === "right"
              ? x + width
              : x,
          this.y,
          { align },
        );
      this.y += lineHeight;
    }
    this.y += gap;
  }
  heading(title, subtitle) {
    this.text(title, { size: 25, serif: true, align: "center", gap: 6 });
    if (subtitle)
      this.text(subtitle, { size: 9, bold: true, align: "center", gap: 9 });
    if (this.doc.clientTaxId || this.doc.clientAddress)
      this.text(
        [this.doc.clientTaxId, this.doc.clientAddress]
          .filter(Boolean)
          .join(" • "),
        { size: 8, align: "center", gap: 7 },
      );
  }
  section(title) {
    this.room(20);
    this.y += 5;
    this.text(title, { size: 13, bold: true, gap: 5 });
  }
  async card({
    image,
    title,
    eyebrow,
    description,
    details = [],
    height = 59,
  }) {
    const photoWidth = image ? 80 : 0,
      onRight = this.doc.visualLayout?.imagePosition === "right",
      textX = image && !onRight ? this.left + photoWidth + 6 : this.left,
      width = this.right - this.left - (image ? photoWidth + 6 : 0);
    this.font(9);
    const count = this.pdf.splitTextToSize(
      String(description || ""),
      width,
    ).length;
    this.font(11, true);
    const titleCount = this.pdf.splitTextToSize(
      String(title || ""),
      width,
    ).length;
    const rowHeight = Math.max(
      height,
      count * 4.05 +
        titleCount * 5 +
        details.reduce((n, detail) => {
          this.font(detail.size || 9, detail.bold);
          return (
            n +
            this.pdf.splitTextToSize(String(detail.text), width).length *
              (detail.size || 9) *
              0.45 +
            4
          );
        }, 0) +
        (eyebrow ? 8 : 0) +
        10,
    );
    this.room(Math.min(rowHeight, this.bottom - 22));
    let rowStart = this.y;
    if (image)
      await imageBox(
        this.pdf,
        image,
        onRight ? this.right - photoWidth : this.left,
        rowStart - 3,
        photoWidth,
        Math.min(56, rowHeight - 5),
        { crop: this.doc.visualLayout?.imageFit !== "contain", radius: 4 },
      );
    if (eyebrow)
      this.text(eyebrow, { x: textX, width, size: 8, bold: true, gap: 3 });
    this.text(title, { x: textX, width, size: 11, bold: true, gap: 4 });
    if (description)
      this.text(description, { x: textX, width, size: 9, gap: 4 });
    for (const detail of details)
      this.text(detail.text, {
        x: textX,
        width,
        size: detail.size || 9,
        bold: detail.bold,
        italic: detail.italic,
        color: detail.color,
        gap: 4,
        link: detail.link,
      });
    // A long card may continue across pages; text() handles each line without clipping.
    if (this.y >= rowStart)
      this.y =
        Math.max(
          this.y,
          rowStart + Math.min(rowHeight, this.bottom - rowStart),
        ) + 9;
  }
  async footer() {
    const c = this.doc.company,
      total = this.pdf.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      this.pdf.setPage(i);
      if (this.theme.header) {
        this.pdf.setFillColor("#0d1c39");
        this.pdf.rect(0, 276, 210, 21, "F");
      }
      const footerText = (value, x, width, align = "left") => {
        let size = 7,
          rows;
        do {
          this.font(
            size,
            true,
            false,
            false,
            this.theme.header ? "#ffffff" : this.theme.ink,
          );
          rows = this.pdf.splitTextToSize(value, width);
          if (rows.length * size * 0.41 <= 15) break;
          size -= 0.25;
        } while (size > 3);
        this.pdf.text(rows, x, 280, { align });
      };
      footerText(
        [c.name, c.taxId && `CPF/CNPJ: ${c.taxId}`, c.address]
          .filter(Boolean)
          .join("\n"),
        this.left,
        72,
      );
      await imageBox(
        this.pdf,
        c.footerLogo ||
          ([
            "Brummie Lines",
            "Brummie Real Estate",
            "Brummie Luxury Estate",
          ].includes(c.name)
            ? this.doc.brand === "realestate" || this.doc.brand === "luxury"
              ? estateMark
              : linesMark
            : c.logo),
        94,
        278,
        22,
        13,
      );
      footerText(
        [
          c.website,
          c.email,
          c.phone,
          this.doc.email &&
            `${this.en ? "Client" : "Cliente"}: ${this.doc.email}`,
        ]
          .filter(Boolean)
          .join("\n"),
        195,
        72,
        "right",
      );
      if (this.doc.confidential) {
        this.font(7, true, false, false, "#9b392e");
        this.pdf.text("INTERNO — NÃO ENVIAR AO CLIENTE", 105, 274, {
          align: "center",
        });
      }
      this.font(
        6,
        false,
        false,
        false,
        this.theme.header ? "#ffffff" : this.theme.muted,
      );
      this.pdf.text(
        `${this.doc.examplePreview ? "EXEMPLO • " : ""}BRM-${String(this.doc.number).padStart(5, "0")}`,
        105,
        295,
        { align: "center" },
      );
      this.pdf.text(`${i}/${total}`, 195, 295, { align: "right" });
    }
  }
  async finish() {
    await this.footer();
    return this.pdf.output("blob");
  }
}
