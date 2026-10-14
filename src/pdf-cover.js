import { themeFor } from "./document-themes.js";
import { imageBox } from "./pdf-design.js";
export async function addDocumentCover(pdf, d) {
  if (!d.cover?.enabled || d.confidential) return false;
  const c = d.company,
    t = themeFor(d.theme || c.documentTheme),
    left = 0,
    width = 210 - left,
    center = left + width / 2;
  pdf.setFillColor(
    (d.theme || c.documentTheme) === "basic" || !(d.theme || c.documentTheme)
      ? "#fdfbf6"
      : t.paper,
  );
  pdf.rect(left, 0, width, 91, "F");
  if (t.topBand) {
    pdf.setFillColor(t.topBand);
    pdf.rect(0, 0, 210, 8, "F");
    pdf.setFillColor(t.accent);
    pdf.rect(0, 8, 210, 1, "F");
  }
  if (t.header) {
    pdf.setFillColor(t.header);
    pdf.rect(left, 0, width, 91, "F");
    pdf.setFillColor("#ffffff");
    pdf.roundedRect(left + width * 0.1, 17, width * 0.8, 57, 3, 3, "F");
  }
  if ((d.theme || c.documentTheme) === "gold") {
    pdf.setFillColor("#ffffff");
    pdf.roundedRect(left + width * 0.15, 23, width * 0.7, 40, 3, 3, "F");
  }
  if (
    !(await imageBox(pdf, c.logo, left + width * 0.125, 12, width * 0.75, 67, {
      trim: true,
    }))
  ) {
    pdf.setFont(t.serif, "bold");
    pdf.setFontSize(30);
    pdf.setTextColor(t.ink);
    pdf.text(c.name, center, 52, { align: "center" });
  }
  await imageBox(
    pdf,
    d.cover.image || d.guide?.coverImage || c.coverImage,
    left,
    91,
    width,
    115,
    { crop: true },
  );
  const titles = {
    invoice: "INVOICE",
    fatura: "STATEMENT",
    voucher: "BOOKING CONFIRMATION",
    nota: "SERVICE INFORMATION",
    orcamento: "CAR SELECTION",
    recibo: "PAYMENT RECEIPT",
    guia: "HOME GUIDE",
    hospedagem: "BOOKING VOUCHER",
    proposta:
      d.proposal?.layout === "property-selection"
        ? "PROPERTY SELECTION"
        : "EXPERIENCE SELECTION",
    horas: "EXTRA HOURS",
  };
  pdf.setFont(t.serif, "normal");
  pdf.setTextColor(t.ink);
  pdf.setFontSize(26);
  const title =
    d.cover.title ||
    (d.type === "guia" ? d.guide?.title : "") ||
    titles[d.type];
  const centered = (
    value,
    maxSize,
    y,
    height,
    width = 177,
    style = "normal",
  ) => {
    pdf.setFont(t.serif, style);
    let size = maxSize,
      rows;
    do {
      pdf.setFontSize(size);
      rows = pdf.splitTextToSize(
        String(value || ""),
        Math.min(width, 210 - left - 22),
      );
      if (rows.length * size * 0.41 <= height) break;
      size--;
    } while (size > 8);
    pdf.text(rows, center, y - ((rows.length - 1) * size * 0.41) / 2, {
      align: "center",
    });
  };
  centered(title, 26, 235, 26);

  let label = d.cover.dateLabel;
  if (!label) {
    const values = (
      d.type === "hospedagem"
        ? [d.stay.checkIn, d.stay.checkOut]
        : d.type === "horas"
          ? d.overtime.days.map((x) => x.date)
          : d.type === "proposta"
            ? [d.proposal.eventDate]
            : d.items?.map((x) => x.date) || [d.date]
    )
      .filter(Boolean)
      .sort();
    const format = (s) =>
      new Date(s + "T12:00:00Z").toLocaleDateString(
        d.language === "en" ? "en-GB" : "pt-BR",
        { timeZone: "UTC" },
      );
    label = values.length
      ? values[0] === values.at(-1)
        ? format(values[0])
        : `${format(values[0])} — ${format(values.at(-1))}`
      : format(d.date);
  }
  pdf.setFont(t.serif, "bold");
  pdf.setFontSize(16);
  centered(
    [d.cover.place, label].filter(Boolean).join(" • "),
    16,
    255,
    17,
    180,
    "bold",
  );
  pdf.setFont(t.serif, "bolditalic");
  pdf.setFontSize(21);
  centered(d.client, 21, 268, 14, 178, "bolditalic");
  if (d.status === "Cancelado") {
    pdf.setFont("OpenSans", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor("#a33d30");
    pdf.text(d.language === "en" ? "CANCELLED" : "CANCELADO", center, 289, {
      align: "center",
    });
  }
  pdf.addPage();
  return true;
}
