import { addDocumentCover } from "./pdf-cover.js";
import { EditorialPdf, imageBox, moneyFor, dateFor } from "./pdf-design.js";
import { isSelection } from "./editorial-document.js";
import { wifiQr } from "./qr.js";
export async function makeConciergePdf(d) {
  const design = new EditorialPdf(d),
    { pdf, en } = design,
    c = design.doc.company,
    money = moneyFor(d),
    date = dateFor(d);
  if (await addDocumentCover(pdf, design.doc)) {
    design.covers.add(1);
    design.paintPage();
  }
  if (d.status === "Cancelado")
    design.text(en ? "CANCELLED" : "CANCELADO", {
      bold: true,
      color: "#a64235",
      align: "center",
    });
  if (isSelection(d)) {
    if (d.clientTaxId || d.clientAddress)
      design.text(
        [d.clientTaxId, d.clientAddress].filter(Boolean).join(" • "),
        { size: 8 },
      );
    for (const option of d.proposal.options) {
      const details = [];
      if (option.period)
        details.push({
          text: `${en ? "Period" : "Período"}: ${option.period}`,
          bold: true,
        });
      if (d.showPrices !== false)
        details.push({
          text:
            option.total === null
              ? en
                ? "Price on request"
                : "Valor sob consulta"
              : `${en ? "Total price per stay" : "Valor total"}: ${money(option.total)}`,
          bold: true,
        });
      if (!option.suites && !option.period)
        details.push({
          text: `(${option.rooms} ${en ? "rooms" : "quartos"} • ${option.nights} ${en ? "nights" : "noites"})`,
          bold: true,
        });
      if (option.inclusions)
        details.push({ text: option.inclusions, bold: true });
      if (option.link)
        details.push({
          text: `Link: ${option.propertyCode || option.title}`,
          link: option.link,
          bold: true,
        });
      const property = !!(
        option.propertyCode ||
        option.suites ||
        option.period
      );
      await design.card({
        image: option.image,
        city: property ? option.city : "",
        eyebrow: property ? "" : option.city?.toUpperCase(),
        title: [option.propertyCode, option.title].filter(Boolean).join(" — "),
        description: [
          option.suites
            ? `${option.suites} ${en ? "suites" : "suítes"}${option.bathrooms ? ` • ${option.bathrooms} ${en ? "bathrooms" : "banheiros"}` : ""}`
            : "",
          option.description,
        ]
          .filter(Boolean)
          .join("\n\n"),
        details,
        height: 56,
      });
    }
    if (d.proposal.paymentTerms) {
      design.section(en ? "Conditions" : "Condições");
      design.text(d.proposal.paymentTerms, { size: 9 });
    }
  } else if (d.type === "guia") {
    const g = d.guide;
    design.heading(
      d.category === "itinerary"
        ? en
          ? "TRAVEL ITINERARY"
          : "ROTEIRO DE VIAGEM"
        : "HOME GUIDE",
      g.title,
    );
    if (g.propertyCode || g.address)
      design.text([g.propertyCode, g.address].filter(Boolean).join(" • "), {
        size: 10,
        align: "center",
        gap: 12,
      });
    if (g.coverImage) {
      design.room(80);
      await imageBox(
        pdf,
        g.coverImage,
        design.left,
        design.y,
        design.right - design.left,
        72,
        {
          crop: true,
          radius: 4,
        },
      );
      design.y += 83;
    }
    if (g.accessInstructions) {
      design.section(en ? "Arrival & access" : "Chegada e acesso");
      design.text(g.accessInstructions);
    }
    if (g.wifi?.ssid) {
      design.room(64);
      const top = design.y;
      design.section("Wi-Fi");
      design.text(`${en ? "Network" : "Rede"}: ${g.wifi.ssid}`, {
        width: design.right - design.left - 55,
        bold: true,
      });
      if (g.wifi.encryption !== "nopass")
        design.text(`${en ? "Password" : "Senha"}: ${g.wifi.password}`, {
          width: design.right - design.left - 55,
        });
      const qr = await wifiQr(g.wifi);
      if (qr) {
        await imageBox(pdf, qr, 151, top + 3, 42, 42);
        design.y = Math.max(design.y, top + 52);
      }
    }
    for (const section of g.sections) {
      if (!section.text && !section.image) continue;
      if (section.image)
        await design.card({
          image: section.image,
          title: section.title,
          description: section.text,
          height: 63,
        });
      else {
        design.section(section.title);
        design.text(section.text, { size: 10 });
      }
    }
  } else if (d.type === "hospedagem") {
    const s = d.stay;
    design.heading(
      en ? "BOOKING VOUCHER" : "VOUCHER DE HOSPEDAGEM",
      s.hotelName,
    );
    if (s.coverImage) {
      design.room(65);
      await imageBox(pdf, s.coverImage, 15, design.y, 180, 60, {
        crop: true,
        radius: 4,
      });
      design.y += 72;
    }
    design.text(
      `${en ? "Reservation holder" : "Titular da reserva"}: ${d.client}`,
      { bold: true },
    );
    for (const value of [
      s.guests,
      s.hotelAddress,
      s.hotelTaxId && `CNPJ: ${s.hotelTaxId}`,
      s.requester && `${en ? "Requested by" : "Solicitante"}: ${s.requester}`,
    ])
      if (value) design.text(value, { size: 9 });
    design.room(29);
    pdf.setFillColor(design.theme.panel);
    pdf.roundedRect(
      design.left,
      design.y - 2,
      design.right - design.left,
      23,
      3,
      3,
      "F",
    );
    const top = design.y;
    design.text(`CHECK-IN  ${date(s.checkIn)} ${s.checkInTime || ""}`, {
      x: design.left + 6,
      width: 95,
      bold: true,
      gap: 4,
    });
    design.text(`CHECK-OUT  ${date(s.checkOut)} ${s.checkOutTime || ""}`, {
      x: design.left + 6,
      width: 95,
      bold: true,
      gap: 8,
    });
    design.font(19, true, true);
    pdf.text(`${s.nights} ${en ? "nights" : "diárias"}`, 185, top + 11, {
      align: "right",
    });
    design.y = Math.max(design.y, top + 31);
    for (const r of s.rooms) {
      const details = [
        {
          text: `${r.quantity} ${en ? "rooms" : "quartos"} × ${s.nights} ${en ? "nights" : "diárias"}`,
          bold: true,
        },
      ];
      if (d.showPrices !== false)
        details.push({
          text: `${money(r.nightlyRate)} ${en ? "per night" : "por diária"} • ${money(r.amount)}`,
          bold: true,
          color: design.color,
        });
      if (r.inclusions) details.push({ text: r.inclusions, bold: true });
      await design.card({
        image: r.image,
        title: r.description,
        description: r.details,
        details,
        height: r.image ? 58 : 29,
      });
    }
    if (d.showPrices !== false) {
      design.section(en ? "Reservation total" : "Total da reserva");
      design.text(money(s.total), {
        size: 25,
        serif: true,
        bold: true,
        color: design.color,
      });
      for (const payment of s.payments)
        design.text(
          `${payment.description} • ${date(payment.date)} • ${money(payment.amount)}`,
          { size: 9 },
        );
      design.text(
        `${en ? "Payments" : "Pagamentos"}: ${money(s.paid)}  •  ${en ? "Balance" : "Saldo"}: ${money(s.balance)}`,
        { bold: true },
      );
    }
    if (s.terms) {
      design.section(en ? "Hotel conditions" : "Condições da hospedagem");
      design.text(s.terms, { size: 9 });
    }
  } else if (d.type === "proposta") {
    const p = d.proposal;
    design.heading(
      p.title,
      [d.client, p.venue, date(p.eventDate)].filter(Boolean).join(" • "),
    );
    if (p.coverImage) {
      design.room(68);
      await imageBox(pdf, p.coverImage, 15, design.y, 180, 62, {
        crop: true,
        radius: 4,
      });
      design.y += 73;
    }
    for (const item of d.items)
      await design.card({
        image: item.image,
        title: item.description,
        description: item.details,
        details:
          d.showPrices === false
            ? []
            : [
                {
                  text: `${item.quantity} ${item.unit || ""} × ${money(item.price)}${Number(item.extra) ? ` + ${money(item.extra)}` : ""}`,
                  bold: true,
                },
                {
                  text: money(item.total),
                  size: 13,
                  bold: true,
                  color: design.color,
                },
              ],
        height: item.image ? 62 : 35,
      });
    if (d.showPrices !== false) {
      if (Number(d.discount))
        design.text(`${en ? "Discount" : "Desconto"}: ${money(d.discount)}`, {
          align: "right",
        });
      if (Number(d.cardFee))
        design.text(
          `${en ? "Card surcharge" : "Adicional de cartão"} (${d.cardFeePct}%): ${money(d.cardFee)}`,
          { align: "right" },
        );
      design.room(24);
      design.text(`TOTAL  ${money(d.total)}`, {
        serif: true,
        size: 24,
        bold: true,
        align: "center",
        color: design.color,
      });
    }
    for (const [label, text] of [
      [en ? "Included" : "O que está incluído", p.inclusions],
      [en ? "Schedule" : "Programação", p.schedule],
      [en ? "Payment terms" : "Condições de pagamento", p.paymentTerms],
    ])
      if (text) {
        design.section(label);
        design.text(text, { size: 9 });
      }
  } else if (d.type === "horas") {
    design.heading(en ? "EXTRA HOURS" : "HORAS EXTRAS", d.client);
    design.text(
      `${d.overtime.baseHours} ${en ? "contracted hours" : "horas contratadas"} • ${d.overtime.ratePct}% ${en ? "of daily rate per extra hour" : "da diária por hora extra"}`,
      { size: 9, align: "center" },
    );
    for (const day of d.overtime.days) {
      design.section(date(day.date));
      for (const line of day.lines) {
        const details = [
          {
            text: `${line.start} → ${line.end} • ${line.extraHours} ${en ? "extra hours" : "horas extras"}${line.overridden ? (en ? " • Reviewed manual exception" : " • Exceção manual revisada") : ""}`,
            bold: true,
          },
        ];
        if (d.showPrices !== false)
          details.push({
            text: `${money(line.rate)} × ${line.extraHours} × ${line.quantity || 1} = ${money(line.amount)}`,
            bold: true,
            color: design.color,
          });
        await design.card({
          image: line.image,
          title: `${line.vehicle} × ${line.quantity || 1}`,
          details,
          height: line.image ? 56 : 27,
        });
      }
    }
    if (d.showPrices !== false) {
      design.section("TOTAL");
      design.text(money(d.total), {
        size: 26,
        bold: true,
        serif: true,
        color: design.color,
      });
    }
    if (d.discrepancy && d.showPrices !== false)
      design.text(
        `${en ? "Difference from supplied total" : "Diferença em relação ao total do original"}: ${money(d.discrepancy)}`,
        { size: 9, bold: true, color: "#9b392e" },
      );
  } else if (d.type === "interno") {
    design.heading("FECHAMENTO / REPASSE", d.internal.partner);
    design.text("INTERNO — NÃO ENVIAR AO CLIENTE", {
      bold: true,
      color: "#9b392e",
      align: "center",
    });
    for (const line of d.internal.lines) {
      await design.card({
        image: line.image,
        title: line.label,
        details: [
          {
            text:
              line.pct !== undefined
                ? `${money(line.base)} × ${line.pct}% = ${money(line.amount)}`
                : `${line.qty} × ${money(line.unit)} = ${money(line.amount)}`,
            bold: true,
          },
        ],
        height: line.image ? 56 : 30,
      });
    }
    design.section("TOTAL INTERNO");
    design.text(money(d.internal.total), {
      size: 25,
      serif: true,
      bold: true,
      color: design.color,
    });
  }
  if (d.notes) {
    design.section(en ? "Additional information" : "Informações adicionais");
    design.text(d.notes, { size: 9 });
  }
  if (d.attachments?.length) {
    design.section(en ? "Original attachments" : "Documentos originais anexos");
    for (const attachment of d.attachments)
      design.text(attachment.name, { size: 9 });
  }
  return design.finish();
}
