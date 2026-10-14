import { EditorialPdf, imageBox } from "./pdf-design.js";
export async function makeItineraryPdf(d) {
  const design = new EditorialPdf(d),
    { pdf, en } = design,
    g = d.guide;
  const selected = d.theme || d.company.documentTheme || "basic";
  const dark = selected === "gold",
    navy = selected === "orange" ? "#202529" : dark ? "#d6b36c" : "#1c3e70",
    bar = selected === "orange" ? "#202529" : dark ? "#292d36" : "#315fa4",
    ink = dark ? "#f5f4ef" : "#202529",
    panel = dark ? "#202530" : "#f7f8fb";
  const paint = () => {
    if (selected === "blue") {
      const background = document.createElement("canvas");
      background.width = 1200;
      background.height = 2;
      const context = background.getContext("2d"),
        gradient = context.createLinearGradient(0, 0, 1200, 0);
      gradient.addColorStop(0, "#aec6ec");
      gradient.addColorStop(1, "#ffffff");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 1200, 2);
      pdf.addImage(background, "PNG", 0, 0, 210, 297);
    } else {
      pdf.setFillColor(design.theme.paper);
      pdf.rect(0, 0, 210, 297, "F");
    }
    design.y = 18;
  };
  design.paintPage = paint;
  paint();
  const heading = (day, title, continued = false) => {
    if (design.y + 18 > 265) {
      design.newPage();
    }
    pdf.setFillColor(bar);
    pdf.rect(15, design.y, 180, 15, "F");
    pdf.setFillColor(
      selected === "orange" ? "#13161e" : dark ? "#171a22" : "#1c3e70",
    );
    pdf.rect(15, design.y, 27, 15, "F");
    design.font(7, true, false, false, "#ffffff");
    pdf.text(en ? "DAY" : "DIA", 28.5, design.y + 4, { align: "center" });
    design.font(20, true, false, false, "#ffffff");
    pdf.text(String(day), 28.5, design.y + 12, { align: "center" });
    design.font(12, true, false, false, "#ffffff");
    const titleText =
      title + (continued ? (en ? " · continued" : " · continuação") : "");
    let size = 12,
      rows;
    do {
      design.font(size, true, false, false, "#ffffff");
      rows = pdf.splitTextToSize(titleText, 147);
      if (rows.length <= 2) break;
      size--;
    } while (size > 7);
    pdf.text(rows, 46, design.y + 8);
    design.y += 19;
  };
  await imageBox(pdf, design.doc.company.logo, 65, 8, 80, 27, { trim: true });
  design.y = 42;
  design.text(g.title, {
    size: 21,
    bold: true,
    align: "center",
    color: navy,
    gap: 3,
  });
  if (g.travelPeriod)
    design.text(g.travelPeriod, {
      size: 12,
      bold: true,
      align: "center",
      color: navy,
      gap: 5,
    });
  if (d.status === "Cancelado")
    design.text(en ? "CANCELLED" : "CANCELADO", {
      bold: true,
      color: "#a64235",
      align: "center",
    });
  if (g.address && !g.title.toLowerCase().includes(g.address.toLowerCase()))
    design.text(g.address, { size: 9.5, align: "center", color: navy, gap: 4 });
  pdf.setDrawColor("#b79247");
  pdf.line(15, design.y, 195, design.y);
  design.y += 7;
  if (g.accessInstructions)
    design.text(g.accessInstructions, { size: 10, color: ink, gap: 6 });
  if (g.coverImage) {
    design.room(42);
    await imageBox(pdf, g.coverImage, 15, design.y, 180, 36, {
      crop: true,
      radius: 2,
    });
    design.y += 42;
  }
  let previous = null;
  for (const section of g.sections) {
    if (!section.text && !section.image) continue;
    const day = section.day || 1,
      dayTitle =
        section.dayTitle || (en ? "Your experience" : "Sua experiência");
    design.font(11, true);
    const titles = pdf.splitTextToSize(section.title, 147);
    design.font(9.5);
    const body = pdf.splitTextToSize(section.text || "", 147);
    const content = [
      ...titles.map((s) => ({ s, title: true })),
      ...body.map((s) => ({ s, title: false })),
    ];
    let at = 0;
    const minHeight = Math.min(
      50,
      Math.max(18, titles.length * 4.6 + body.length * 4.1 + 6),
    );
    if (day !== previous) {
      if (design.y + 19 + minHeight > 265) design.newPage();
      heading(day, dayTitle);
      previous = day;
    } else if (design.y + minHeight > 265) {
      design.newPage();
      heading(day, dayTitle, true);
    }
    while (at < content.length) {
      const available = 265 - design.y,
        take = Math.min(content.length - at, Math.floor((available - 6) / 4.6));
      if (take < 1) {
        design.newPage();
        heading(day, dayTitle, true);
        continue;
      }
      const chunk = content.slice(at, at + take),
        height = Math.max(
          18,
          chunk.reduce((n, r) => n + (r.title ? 4.6 : 4.1), 6),
        );
      pdf.setFillColor(panel);
      pdf.rect(15, design.y, 180, height, "F");
      pdf.setFillColor(dark ? "#292f3c" : "#eaf0f8");
      pdf.rect(15, design.y, 27, height, "F");
      design.font(8, true, false, false, navy);
      const label = pdf.splitTextToSize(section.period || "", 23);
      pdf.text(label, 28.5, design.y + height / 2, { align: "center" });
      let y = design.y + 5;
      for (const row of chunk) {
        design.font(
          row.title ? 11 : 9.5,
          row.title,
          false,
          false,
          row.title ? navy : ink,
        );
        pdf.text(row.s, 46, y);
        y += row.title ? 4.6 : 4.1;
      }
      design.y += height + 3;
      at += take;
      if (at < content.length) {
        design.newPage();
        heading(day, dayTitle, true);
      }
    }
    if (section.image) {
      design.room(43);
      await imageBox(pdf, section.image, 44, design.y, 151, 38, {
        crop: true,
        radius: 2,
      });
      design.y += 44;
    }
  }
  const notes = g.conciergeNotes || [];
  if (notes.length) {
    design.room(32);
    design.y += 4;
    design.text(en ? "CONCIERGE NOTES" : "NOTAS DO CONCIERGE", {
      size: 15,
      bold: true,
      color: navy,
      gap: 4,
    });
    pdf.setDrawColor("#b79247");
    pdf.line(15, design.y, 195, design.y);
    design.y += 6;
    for (const [index, note] of notes.entries()) {
      if (!note.text) continue;
      design.font(10.5, true);
      const titles = pdf.splitTextToSize(note.title, 174);
      design.font(9.5);
      const lines = pdf.splitTextToSize(note.text, 174);
      const height = Math.min(
        247,
        Math.max(23, titles.length * 4.725 + lines.length * 4.275 + 13),
      );
      design.room(height);
      pdf.setFillColor(dark ? panel : index % 2 ? "#dce9f9" : panel);
      pdf.rect(15, design.y - 2, 180, height, "F");
      design.y += 3;
      design.text(note.title, {
        size: 10.5,
        bold: true,
        color: navy,
        gap: 2,
        x: 18,
        width: 174,
      });
      design.text(note.text, {
        size: 9.5,
        color: ink,
        gap: 5,
        x: 18,
        width: 174,
      });
      design.y += 3;
    }
  }
  if (d.notes) {
    design.section(en ? "Additional information" : "Informações adicionais");
    design.text(d.notes, { size: 9.5, color: ink });
  }
  return design.finish();
}
