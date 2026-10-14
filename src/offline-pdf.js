import { makeItineraryPdf } from "./itinerary-pdf.js";
import { applyFreeElements } from "./free-pdf-elements.js";
import { makeCommercialPdf } from "./commercial-pdf.js";
import { isCommercial } from "./commercial.jsx";
import { addDocumentCover } from "./pdf-cover.js";
import { makeConciergePdf } from "./concierge-pdf.js";
import { EditorialPdf, imageBox, moneyFor, dateFor } from "./pdf-design.js";
export const PDF_RENDER_VERSION = 13;
const names = {
  invoice: ["INVOICE", "INVOICE"],
  fatura: ["FATURA", "STATEMENT"],
  voucher: ["CONFIRMAÇÃO DE SERVIÇO", "BOOKING CONFIRMATION"],
  nota: ["INFORMAÇÕES DO ATENDIMENTO", "SERVICE INFORMATION"],
  orcamento: ["ORÇAMENTO", "QUOTATION"],
  recibo: ["RECIBO", "PAYMENT RECEIPT"],
};
export async function makePdf(d) {
  return applyFreeElements(await makeBasePdf(d), d.freeElements);
}
async function makeBasePdf(d) {
  if (
    d.type === "guia" &&
    d.category === "itinerary" &&
    d.guide?.presentation === "schedule"
  )
    return makeItineraryPdf(d);
  if (isCommercial(d)) return makeCommercialPdf(d);
  if (["guia", "hospedagem", "proposta", "horas", "interno"].includes(d.type))
    return makeConciergePdf(d);
  const design = new EditorialPdf(d),
    { pdf, en } = design,
    c = design.doc.company,
    money = moneyFor(d),
    date = dateFor(d);
  const financial =
    !["nota", "voucher"].includes(d.type) && d.showPrices !== false;
  if (await addDocumentCover(pdf, design.doc)) {
    design.covers.add(1);
    design.paintPage();
  }
  if (!d.cover?.enabled) {
    await imageBox(pdf, c.logo, 70, 12, 70, 30, {
      trim: true,
      clearWhiteBackdrop:
        !!design.theme.header || (d.theme || c.documentTheme) === "gold",
    });
    design.y = 51;
  }
  design.heading(
    names[d.type][en ? 1 : 0],
    `${d.client} • ${date(d.date)} • #${String(d.number).padStart(5, "0")}`,
  );
  if (d.status === "Cancelado")
    design.text(en ? "CANCELLED" : "CANCELADO", {
      color: "#a94440",
      bold: true,
      align: "center",
    });
  if (d.email) design.text(d.email, { size: 9, align: "center" });
  design.text(
    `${en ? "Valid until / due" : "Validade / vencimento"}: ${date(d.due)}`,
    { size: 8, align: "center", gap: 12 },
  );
  for (const i of d.items) {
    const detail = [
      {
        text: [date(i.date || d.date), i.time].filter(Boolean).join(" • "),
        bold: true,
      },
      { text: [i.origin, i.destination].filter(Boolean).join(" → ") },
      {
        text: `${i.pax || 1} ${en ? "passengers" : "passageiros"} • ${i.quantity} ${i.unit || ""}${i.flight ? ` • ${en ? "Flight" : "Voo"} ${i.flight}` : ""}`,
      },
    ].filter((x) => x.text);
    if (financial) {
      detail.push({
        text: `${money(i.price)} × ${i.quantity}${Number(i.extra) ? ` + ${money(i.extra)}` : ""}`,
        bold: true,
      });
      detail.push({
        text: money(i.total),
        bold: true,
        color: design.color,
        size: 12,
      });
    }
    await design.card({
      image: i.image || d.vehicle?.photo,
      title: i.description,
      description: i.details,
      details: detail,
      height: i.image || d.vehicle?.photo ? 62 : 35,
    });
  }
  if (financial) {
    for (const [group, total] of Object.entries(d.groups || {}))
      design.text(`${group}: ${money(total)}`, { bold: true, size: 10 });
    if (Number(d.discount))
      design.text(`${en ? "Discount" : "Desconto"}: ${money(d.discount)}`, {
        align: "right",
      });
    if (Number(d.cardFee)) {
      design.text(
        `${en ? "Base after discount" : "Base após desconto"}: ${money(d.subtotal - d.discount)}`,
        { align: "right" },
      );
      design.text(
        `${en ? "Card surcharge" : "Adicional de cartão"} (${d.cardFeePct}%): ${money(d.cardFee)}`,
        { align: "right" },
      );
    }
    design.room(30);
    design.y += 5;
    design.text(en ? "Total for the period" : "Valor total do período", {
      size: 23,
      serif: true,
      bold: true,
      italic: true,
      align: "center",
      gap: 4,
    });
    design.text(money(d.total), {
      size: 25,
      bold: true,
      italic: true,
      color: design.color,
      align: "center",
      gap: 12,
    });
    if (c.payment) {
      design.section(en ? "Payment details" : "Dados de pagamento");
      design.text(c.payment, { size: 10 });
    }
  }
  for (const [r, label] of [
    [d.driver, en ? "YOUR CHAUFFEUR" : "SEU MOTORISTA"],
    [d.vehicle, en ? "YOUR VEHICLE" : "SEU VEÍCULO"],
  ]) {
    if (!r) continue;
    await design.card({
      image: r.photo,
      eyebrow: label,
      title: r.name,
      description: r.kind === "driver" ? r.languages : r.category,
      details: [
        {
          text: r.plate
            ? `${en ? "Plate" : "Placa"}: ${r.plate}`
            : r.phone || "",
          bold: true,
        },
      ],
      height: 56,
    });
  }
  for (const [title, text] of [
    [en ? "Service notes" : "Observações", d.notes],
    [en ? "Conditions" : "Condições", c.terms],
  ])
    if (text) {
      design.section(title);
      design.text(text, { size: 9 });
    }
  design.text(
    en
      ? "Informational document. Not a tax invoice."
      : "Documento informativo. Não substitui nota fiscal.",
    { size: 7, gap: 0, color: "#777777" },
  );
  return design.finish();
}
