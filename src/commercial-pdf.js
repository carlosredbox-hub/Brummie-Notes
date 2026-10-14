import { themeFor } from "./document-themes.js";
import { jsPDF } from "jspdf";
import { registerPdfFonts } from "./pdf-fonts.js";
import { imageBox } from "./pdf-design.js";
import mark from "./assets/lines-mark.png";
export async function makeCommercialPdf(d) {
  const pdf = new jsPDF({
      orientation: "landscape",
      format: [297, 167],
      compress: true,
    }),
    c = d.company,
    t = d.proposal.commercial;
  registerPdfFonts(pdf);
  const theme = themeFor(d.theme || c.documentTheme),
    basic =
      !(d.theme || c.documentTheme) || (d.theme || c.documentTheme) === "basic",
    brown = basic ? "#695b44" : theme.header || theme.topBand || theme.panel,
    gold = basic ? "#b28938" : theme.accent,
    cream = basic ? "#f8f5ea" : theme.paper,
    ink = basic ? "#423b30" : theme.ink;
  const font = (size, serif = false, bold = false, color = ink) => {
    pdf.setFont(serif ? theme.serif : "OpenSans", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(color);
  };
  const header = async (title) => {
    pdf.setFillColor(cream);
    pdf.rect(0, 0, 297, 167, "F");
    pdf.setFillColor(brown);
    pdf.rect(0, 0, 297, 22, "F");
    await imageBox(pdf, mark, 12, 5, 26, 12);
    font(15, true, false, "#ffffff");
    pdf.text(c.name.toUpperCase(), 42, 14);
    if (t.partnerLogo)
      await imageBox(pdf, t.partnerLogo, 242, 4, 43, 15, { trim: true });
    else {
      font(20, true, false, "#ffffff");
      pdf.text(t.partnerName || d.client, 284, 14, { align: "right" });
    }
    font(10, false, false, gold);
    pdf.text(t.category, 13, 34, { charSpace: 1 });
    font(24, true);
    pdf.text(title, 13, 46);
  };
  let y;
  const tableStart = () => {
    const first = 82,
      col = (271 - first) / t.columns.length;
    pdf.setFillColor(brown);
    pdf.rect(13, 53, 271, 14, "F");
    font(8, true, false, "#ffffff");
    pdf.text("SERVIÇO", 15, 61);
    font(7, false, false, "#ffffff");
    t.columns.forEach((name, i) =>
      pdf.text(
        pdf.splitTextToSize(name, col - 3),
        13 + first + col * (i + 0.5),
        59,
        { align: "center" },
      ),
    );
    y = 67;
  };
  await header(t.title);
  tableStart();
  for (const group of t.groups) {
    const groupHeader = () => {
      pdf.setFillColor(gold);
      pdf.rect(13, y, 271, 7, "F");
      font(8, true, false, theme.ink);
      pdf.text(group.title, 15, y + 5);
      y += 7;
    };
    if (y + 15 > 138) {
      pdf.addPage();
      await header(t.title);
      tableStart();
    }
    groupHeader();
    for (let r = 0; r < group.rows.length; r++) {
      const row = group.rows[r];
      font(8);
      const labels = pdf.splitTextToSize(row.label, 77),
        height = Math.max(9, labels.length * 3.6 + 3);
      if (y + height > 138) {
        pdf.addPage();
        await header(t.title);
        tableStart();
        groupHeader();
      }
      pdf.setFillColor(r % 2 ? (basic ? "#eee9d8" : theme.panel) : cream);
      pdf.setDrawColor("#d4cab1");
      pdf.rect(13, y, 271, height, "FD");
      font(8);
      pdf.text(labels, 15, y + 5);
      const col = (271 - 82) / t.columns.length;
      t.columns.forEach((_, i) => {
        pdf.line(95 + col * i, y, 95 + col * i, y + height);
        const value = row.prices[i];
        pdf.text(
          value === null
            ? "—"
            : new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: d.currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(value),
          95 + col * (i + 0.5),
          y + 5,
          { align: "center" },
        );
      });
      y += height;
    }
  }
  if (t.conditions) {
    font(9);
    const lines = pdf.splitTextToSize(t.conditions, 267);
    y += 8;
    for (const line of lines) {
      if (y + 4 > 140) {
        pdf.addPage();
        await header("Condições");
        y = 56;
      }
      font(9);
      pdf.text(line, 14, y);
      y += 4.1;
    }
  }
  for (let offset = 0; offset < t.fleet.length; offset += 6) {
    pdf.addPage();
    await header("Veículos");
    for (let i = 0; i < Math.min(6, t.fleet.length - offset); i++) {
      const car = t.fleet[offset + i],
        x = 13 + (i % 3) * 92,
        y = 54 + Math.floor(i / 3) * 46;
      pdf.setFillColor(basic ? "#eee9d8" : theme.panel);
      pdf.setDrawColor("#d4cab1");
      pdf.roundedRect(x, y, 86, 43, 1, 1, "FD");
      await imageBox(pdf, car.image, x + 3, y + 3, 80, 29);
      font(12, true);
      pdf.text(pdf.splitTextToSize(car.name, 80), x + 43, y + 39, {
        align: "center",
      });
    }
  }
  const total = pdf.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    font(6);
    pdf.text(
      pdf.splitTextToSize(
        [c.address, c.phone].filter(Boolean).join(" • "),
        123,
      ),
      13,
      153,
    );
    pdf.text(
      pdf.splitTextToSize(
        [c.website, c.email, d.email].filter(Boolean).join(" • "),
        130,
      ),
      284,
      153,
      { align: "right" },
    );
    font(7, true, false, gold);
    pdf.text(
      `PROPOSTA COMERCIAL • ${t.partnerName || d.client} • BRM-${String(d.number).padStart(5, "0")}`,
      13,
      164,
    );
    pdf.text(`${p}/${total}`, 284, 164, { align: "right" });
  }
  return pdf.output("blob");
}
