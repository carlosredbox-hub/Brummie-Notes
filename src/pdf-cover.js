import { imageBox } from "./pdf-design.js";
export async function addDocumentCover(pdf, d) {
  if (!d.cover?.enabled || d.confidential) return false;
  const c = d.company;
  pdf.setFillColor("#fdfbf6");
  pdf.rect(0, 0, 210, 91, "F");
  if (!(await imageBox(pdf, c.logo, 26, 12, 158, 67, {trim:true}))) {
    pdf.setFont("Cormorant", "bold");
    pdf.setFontSize(30);
    pdf.setTextColor("#151515");
    pdf.text(c.name, 105, 52, { align: "center" });
  }
  await imageBox(
    pdf,
    d.cover.image || d.guide?.coverImage || c.coverImage,
    0,
    91,
    210,
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
  pdf.setFont("Cormorant", "normal");
  pdf.setTextColor("#111111");
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
    pdf.setFont("Cormorant", style);
    let size = maxSize,
      rows;
    do {
      pdf.setFontSize(size);
      rows = pdf.splitTextToSize(String(value || ""), width);
      if (rows.length * size * 0.41 <= height) break;
      size--;
    } while (size > 8);
    pdf.text(rows, 105, y - ((rows.length - 1) * size * 0.41) / 2, {
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
  pdf.setFont("Cormorant", "bold");
  pdf.setFontSize(16);
  centered(
    [d.cover.place, label].filter(Boolean).join(" • "),
    16,
    255,
    17,
    180,
    "bold",
  );
  pdf.setFont("Cormorant", "bolditalic");
  pdf.setFontSize(21);
  centered(d.client, 21, 277, 19, 178, "bolditalic");
  if (d.status === "Cancelado") {
    pdf.setFont("OpenSans", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor("#a33d30");
    pdf.text(d.language === "en" ? "CANCELLED" : "CANCELADO", 105, 289, {
      align: "center",
    });
  }
  pdf.addPage();
  return true;
}
