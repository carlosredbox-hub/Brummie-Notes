import { jsPDF } from "jspdf";
import logo from "./assets/icon.png";
const names = {
  invoice: "Invoice",
  fatura: "Fatura",
  voucher: "Voucher de confirmação",
  nota: "Nota de atendimento",
  orcamento: "Orçamento",
  recibo: "Recibo",
};
export async function makePdf(d) {
  const pdf = new jsPDF(),
    en = d.language === "en",
    c = d.company,
    financial = !["nota", "voucher"].includes(d.type);
  let y = 24;
  const col = /^#[0-9a-f]{6}$/i.test(c.color || "") ? c.color : "#0089cf";
  const money = (n) =>
    new Intl.NumberFormat(en ? "en-US" : "pt-BR", {
      style: "currency",
      currency: d.currency,
    }).format(n || 0);
  const line = (s, size = 11, color = "#243c34") => {
    pdf.setTextColor(color);
    pdf.setFontSize(size);
    const rows = pdf.splitTextToSize(String(s || ""), 174);
    for (const row of rows) {
      if (y > 272) {
        pdf.addPage();
        y = 24;
      }
      pdf.text(row, 18, y);
      y += size * 0.48 + 2;
    }
    y += 2;
  };
  const image = (src, x, yy, w, h) => {
    try {
      pdf.addImage(
        src,
        src.includes("image/jpeg") ? "JPEG" : "PNG",
        x,
        yy,
        w,
        h,
      );
    } catch {
      line(en ? "Photo unavailable" : "Foto indisponível", 9);
    }
  };
  const img = new Image();
  img.src = logo;
  await img.decode();
  pdf.addImage(img, "PNG", 158, 17, 32, 14);
  line(c.name, 23, col);
  line(
    en
      ? {
          invoice: "Invoice",
          fatura: "Statement",
          voucher: "Booking confirmation",
          nota: "Service information",
          orcamento: "Quotation",
          recibo: "Payment receipt",
        }[d.type]
      : names[d.type],
    18,
  );
  line(`#${String(d.number).padStart(5, "0")} | ${d.date} | ${d.status}`, 9);
  if (d.status === "Cancelado")
    line(en ? "CANCELLED" : "CANCELADO", 18, "#a94440");
  y += 5;
  line(en ? "CLIENT" : "CLIENTE", 9, col);
  line(d.client, 16);
  line(d.email);
  line(`${en ? "Due / valid until" : "Vencimento / validade"}: ${d.due}`, 10);
  y += 5;
  for (const i of d.items) {
    line(i.description, 13, col);
    line(
      `${i.date || d.date} ${i.time || ""} | ${i.origin || ""} > ${i.destination || ""}`,
      10,
    );
    line(
      `${en ? "Passengers" : "Passageiros"}: ${i.pax || 1} | ${en ? "Quantity" : "Quantidade"}: ${i.quantity} ${i.unit}`,
      10,
    );
    if (i.flight) line(`${en ? "Flight" : "Voo"}: ${i.flight}`, 10);
    if (financial)
      line(
        `${money(i.price)} x ${i.quantity} + ${money(i.extra)} = ${money(i.total)}`,
      );
    y += 4;
  }
  if (financial) {
    line(`${en ? "Discount" : "Desconto"}: ${money(d.discount)}`);
    line(`${en ? "TOTAL" : "VALOR TOTAL"}: ${money(d.total)}`, 21, col);
    if (c.payment) {
      line(en ? "PAYMENT DETAILS" : "DADOS DE PAGAMENTO", 9, col);
      line(c.payment, 10);
    }
  }
  for (const [r, label] of [
    [d.driver, en ? "YOUR CHAUFFEUR" : "SEU MOTORISTA"],
    [d.vehicle, en ? "YOUR VEHICLE" : "SEU VEÍCULO"],
  ]) {
    if (!r) continue;
    if (y > 200) {
      pdf.addPage();
      y = 24;
    }
    line(label, 10, col);
    if (r.photo) {
      image(r.photo, 18, y, r.kind === "driver" ? 35 : 65, 35);
      y += 40;
    }
    line(r.name, 14);
    line(r.languages || r.category, 10);
    line(r.plate ? (en ? "Plate: " : "Placa: ") + r.plate : r.phone, 10);
  }
  if (d.notes) {
    line(en ? "SERVICE NOTES" : "OBSERVAÇÕES", 9, col);
    line(d.notes, 10);
  }
  if (c.terms) {
    line(en ? "TERMS" : "CONDIÇÕES", 9, col);
    line(c.terms, 10);
  }
  line(
    en
      ? "Informational document. Not a tax invoice."
      : "Documento informativo. Não substitui nota fiscal.",
    8,
  );
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(8);
    pdf.setTextColor("#819388");
    pdf.text(
      pdf.splitTextToSize(
        [c.address, c.phone, c.website].filter(Boolean).join(" | "),
        165,
      )[0] || "",
      18,
      286,
    );
    pdf.text(`${p}/${pages}`, 184, 286);
  }
  return pdf.output("blob");
}
