import { addDocumentCover } from "./pdf-cover.js";
import { jsPDF } from "jspdf";
import { wifiQr } from "./qr.js";

export async function makeConciergePdf(d) {
  const pdf = new jsPDF(),
    c = d.company,
    en = d.language === "en",
    col = /^#[a-f0-9]{6}$/i.test(c.color || "") ? c.color : "#b67842";
  let y = 53;
  const money = (n) =>
    new Intl.NumberFormat(en ? "en-US" : "pt-BR", {
      style: "currency",
      currency: d.currency,
    }).format(n || 0);
  const date = (s) =>
    s
      ? new Date(s + "T12:00:00Z").toLocaleDateString(en ? "en-GB" : "pt-BR", {
          timeZone: "UTC",
        })
      : "—";
  const heading = () => {
    pdf.setFillColor(col);
    pdf.rect(0, 0, 210, 4, "F");
    pdf.setFont("times", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(col);
    pdf.text(pdf.splitTextToSize(c.name, 155)[0], 18, 23);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor("#7a837d");
    pdf.setFontSize(8);
    pdf.text(
      `${en ? "GUEST DOCUMENT" : "DOCUMENTO DO CLIENTE"}  /  ${String(d.number).padStart(5, "0")}`,
      18,
      32,
    );
    pdf.setDrawColor("#dedfd8");
    pdf.line(18, 40, 192, 40);
    if (d.status === "Cancelado") {
      pdf.setTextColor("#a64235");
      pdf.text(en ? "CANCELLED" : "CANCELADO", 150, 32);
    }
  };
  const next = () => {
    pdf.addPage();
    heading();
    y = 53;
  };
  const room = (h) => {
    if (y + h > 273) next();
  };
  const text = (
    value,
    size = 10,
    color = "#304438",
    font = "helvetica",
    style = "normal",
  ) => {
    pdf.setFont(font, style);
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    const lines = pdf.splitTextToSize(String(value || ""), 170);
    for (const line of lines) {
      room(size * 0.45 + 3);
      pdf.text(line, 20, y);
      y += size * 0.45 + 2;
    }
    y += 3;
  };
  const section = (title) => {
    room(23);
    y += 5;
    pdf.setDrawColor("#e6e5dd");
    pdf.line(18, y - 2, 192, y - 2);
    y += 7;
    text(title, 17, col, "times", "bold");
  };
  const photo = async (src, maxHeight = 65) => {
    if (!/^data:image\/(png|jpeg);base64,/.test(src || "")) return;
    try {
      const img = new Image();
      img.src = src;
      await img.decode();
      const width = Math.min(170, (maxHeight * img.width) / img.height),
        height = (width * img.height) / img.width;
      room(height + 8);
      pdf.addImage(
        img,
        src.includes("image/jpeg") ? "JPEG" : "PNG",
        20,
        y,
        width,
        height,
      );
      y += height + 8;
    } catch {
      text(en ? "Photo unavailable" : "Foto indisponível", 9);
    }
  };
  const detail = (label, value) => {
    if (value) {
      text(label.toUpperCase(), 8, col);
      text(value, 11);
    }
  };
  await addDocumentCover(pdf, d);
  heading();
  if (c.logo) await photo(c.logo, 18);
  if (d.type === "guia") {
    const g = d.guide;
    text(
      en ? "YOUR HOME, PREPARED FOR YOU" : "SUA CASA, PREPARADA PARA VOCÊ",
      8,
      col,
    );
    text(g.title, 27, col, "times", "bold");
    detail(en ? "Property" : "Imóvel", g.propertyCode);
    text(g.address, 11);
    await photo(g.coverImage, 80);
    if (g.accessInstructions) {
      section(en ? "Arrival & access" : "Chegada & acesso");
      text(g.accessInstructions);
    }
    if (g.wifi?.ssid) {
      section("Wi-Fi");
      detail(en ? "Network" : "Rede", g.wifi.ssid);
      if (g.wifi.encryption !== "nopass")
        detail(en ? "Password" : "Senha", g.wifi.password);
      const qr = await wifiQr(g.wifi);
      if (qr) {
        room(49);
        pdf.addImage(qr, "PNG", 20, y, 42, 42);
        y += 48;
      }
    }
    for (const s of g.sections) {
      section(s.title);
      await photo(s.image);
      text(s.text);
    }
  } else if (d.type === "hospedagem") {
    const s = d.stay;
    text(en ? "BOOKING VOUCHER" : "VOUCHER DE HOSPEDAGEM", 9, col);
    text(s.hotelName, 27, col, "times", "bold");
    detail(en ? "Guest / reservation holder" : "Titular da reserva", d.client);
    detail(en ? "Additional guests" : "Hóspedes", s.guests);
    detail(en ? "Hotel address" : "Endereço do hotel", s.hotelAddress);
    detail("CNPJ", s.hotelTaxId);
    detail(en ? "Requested by" : "Solicitante", s.requester);
    section(en ? "Your stay" : "Sua estadia");
    detail("Check-in", `${date(s.checkIn)} ${s.checkInTime || ""}`);
    detail("Check-out", `${date(s.checkOut)} ${s.checkOutTime || ""}`);
    detail(en ? "Nights" : "Diárias", String(s.nights));
    section(en ? "Rooms & rates" : "Quartos & valores");
    for (const r of s.rooms) {
      text(r.description, 13, col, "times", "bold");
      text(
        `${r.quantity} ${en ? "room(s)" : "quarto(s)"} × ${s.nights} ${en ? "night(s)" : "diária(s)"}${d.showPrices === false ? "" : ` × ${money(r.nightlyRate)}`}`,
        10,
      );
      if (d.showPrices !== false)
        text(money(r.quantity * s.nights * r.nightlyRate), 12);
    }
    if (d.showPrices !== false) {
      section(en ? "Reservation total" : "Total da reserva");
      text(money(s.total), 25, col, "times", "bold");
      for (const p of s.payments) {
        text(`${p.description} • ${date(p.date)} • ${money(p.amount)}`, 10);
      }
      detail(
        en ? "Payments recorded" : "Pagamentos registrados",
        money(s.paid),
      );
      detail(en ? "Remaining balance" : "Saldo restante", money(s.balance));
    }
    if (s.terms) {
      section(en ? "Hotel conditions" : "Condições da hospedagem");
      text(s.terms);
    }
  } else if (d.type === "interno") {
    text("INTERNO — NÃO ENVIAR AO CLIENTE", 14, "#9b392e", "helvetica", "bold");
    text(d.internal.partner, 25, col, "times", "bold");
    section(
      d.internal.kind === "repasse"
        ? "Repasse / comissão"
        : "Fechamento de operação",
    );
    for (const line of d.internal.lines) {
      text(line.label, 13, col);
      text(
        line.pct !== undefined
          ? `${money(line.base)} × ${line.pct}% = ${money(line.amount)}`
          : `${line.qty} × ${money(line.unit)} = ${money(line.amount)}`,
      );
    }
    section("TOTAL INTERNO");
    text(money(d.internal.total), 24, col, "times", "bold");
  } else if (d.type === "horas") {
    text(en ? "EXTRA HOURS" : "HORAS EXTRAS", 27, col, "times", "bold");
    detail(en ? "Prepared for" : "Preparado para", d.client);
    text(
      `${d.overtime.baseHours} ${en ? "contracted hours" : "horas contratadas"} · ${d.overtime.ratePct}% ${en ? "of the daily rate per extra hour" : "da diária por hora extra"}`,
      10,
    );
    for (const day of d.overtime.days) {
      section(date(day.date));
      for (const line of day.lines) {
        text(line.vehicle, 14, col, "times", "bold");
        text(
          `${line.start} > ${line.end} | ${line.extraHours} ${en ? "extra hours" : "horas extras"}`,
          10,
        );
        if (line.overridden)
          text(
            en ? "Reviewed manual exception" : "Exceção manual revisada",
            9,
            "#9a652f",
          );
        if (d.showPrices !== false)
          text(
            `${money(line.rate)} × ${line.extraHours} × ${line.quantity || 1} = ${money(line.amount)}`,
            11,
          );
      }
    }
    if (d.showPrices !== false) {
      section(en ? "TOTAL" : "TOTAL");
      text(money(d.total), 24, col, "times", "bold");
    }
  } else {
    const p = d.proposal;
    text(en ? "CURATED EXPERIENCE" : "EXPERIÊNCIA PERSONALIZADA", 9, col);
    text(p.title, 27, col, "times", "bold");
    detail(en ? "Prepared for" : "Preparado para", d.client);
    detail(en ? "Location" : "Local", p.venue);
    detail(en ? "Event date" : "Data do evento", date(p.eventDate));
    await photo(p.coverImage, 75);
    section(en ? "Your proposal" : "Sua proposta");
    for (const i of d.items) {
      text(i.description, 13, col, "times", "bold");
      if (d.showPrices !== false)
        text(
          `${i.quantity} ${i.unit || ""} × ${money(i.price)} + ${money(i.extra)} = ${money(i.total)}`,
          10,
        );
    }
    if (d.showPrices !== false)
      detail(en ? "Discount" : "Desconto", money(d.discount));
    if (d.showPrices !== false)
      text(
        `${en ? "TOTAL" : "TOTAL"}  ${money(d.total)}`,
        24,
        col,
        "times",
        "bold",
      );
    for (const [label, content] of [
      [en ? "Included" : "O que está incluído", p.inclusions],
      [en ? "Schedule" : "Programação", p.schedule],
      [en ? "Payment terms" : "Condições de pagamento", p.paymentTerms],
    ])
      if (content) {
        section(label);
        text(content);
      }
  }
  if (d.notes) {
    section(en ? "Additional information" : "Informações adicionais");
    text(d.notes);
  }
  if (d.attachments?.length) {
    section(en ? "Original attachments" : "Documentos originais anexos");
    for (const a of d.attachments) text(a.name, 10);
    text(
      en
        ? "Original supplier documents follow, with their original codes and conditions."
        : "Os documentos originais dos fornecedores seguem nas próximas páginas, com seus códigos e condições preservados.",
      9,
    );
  }
  text(
    en
      ? "Informational document. Not a tax invoice."
      : "Documento informativo. Não substitui nota fiscal.",
    8,
    "#7a837d",
  );
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setDrawColor("#dedfd8");
    pdf.line(18, 280, 192, 280);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor("#7a837d");
    pdf.text(
      pdf.splitTextToSize(
        [c.website, c.phone].filter(Boolean).join(" | "),
        145,
      )[0] || c.name,
      18,
      287,
    );
    if (d.confidential) pdf.text("INTERNO — NÃO ENVIAR AO CLIENTE", 18, 277);
    pdf.text(`${p}/${pages}`, 181, 287);
  }
  return pdf.output("blob");
}
