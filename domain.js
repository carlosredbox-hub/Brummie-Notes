export const types = {
  invoice: "Invoice",
  fatura: "Fatura",
  voucher: "Voucher de confirmação",
  nota: "Nota de atendimento",
  orcamento: "Orçamento",
  recibo: "Recibo",
  guia: "Guia do imóvel",
  hospedagem: "Voucher de hospedagem",
  proposta: "Proposta",
  horas: "Horas extras",
  interno: "Documento interno",
};
export const brandIds = ["lines", "realestate", "luxury"];
const money = (n) => Math.round(n * 100) / 100;
export function calculate(items, discount = 0) {
  if (!Array.isArray(items) || !items.length)
    throw new Error("Inclua pelo menos um serviço.");
  let subtotal = 0;
  const normalized = items.map((i) => {
    const quantity = Number(i.quantity),
      price = Number(i.price),
      extra = Number(i.extra || 0);
    if (
      !i.description?.trim() ||
      ![quantity, price, extra].every(Number.isFinite) ||
      quantity <= 0 ||
      quantity > 10000 ||
      price < 0 ||
      extra < 0
    )
      throw new Error("Revise descrição, quantidade e valores dos serviços.");
    const total = Math.round((quantity * price + extra) * 100) / 100;
    subtotal += total;
    return { ...i, quantity, price, extra, total };
  });
  discount = Number(discount || 0);
  subtotal = Math.round(subtotal * 100) / 100;
  if (!Number.isFinite(discount) || discount < 0 || discount > subtotal)
    throw new Error("O desconto deve estar entre zero e o subtotal.");
  const groups = {};
  for (const i of normalized)
    if (i.group) groups[i.group] = money((groups[i.group] || 0) + i.total);
  return {
    items: normalized,
    groups,
    subtotal,
    discount,
    total: Math.round((subtotal - discount) * 100) / 100,
  };
}
const validDate = (v) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v || "") &&
  !Number.isNaN(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
const parseTime = (v) => {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(v || "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const nightsBetween = (a, b) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
// Hora extra: tudo acima de baseHours, arredondado para cima, a ratePct% da diária por hora.
// extraHours informado manualmente prevalece (casos excepcionais), valores em centavos preservados.
export function calculateOvertime(o) {
  const baseHours = Number(o?.baseHours ?? 10),
    ratePct = Number(o?.ratePct ?? 10);
  if (
    !Number.isFinite(baseHours) ||
    baseHours <= 0 ||
    !Number.isFinite(ratePct) ||
    ratePct < 0 ||
    !Array.isArray(o?.days) ||
    !o.days.length
  )
    throw new Error("Informe ao menos um dia de horas extras.");
  let total = 0;
  const days = o.days.map((day) => {
    if (!validDate(day.date) || !Array.isArray(day.lines) || !day.lines.length)
      throw new Error("Cada dia de horas extras precisa de data e veículos.");
    const lines = day.lines.map((l) => {
      const dailyRate = Number(l.dailyRate),
        start = parseTime(l.start),
        end = parseTime(l.end);
      if (
        !l.vehicle?.trim() ||
        !Number.isFinite(dailyRate) ||
        dailyRate < 0 ||
        start === null ||
        end === null
      )
        throw new Error("Revise veículo, diária e horários das horas extras.");
      let worked = (end - start) / 60;
      if (worked <= 0) worked += 24;
      const computed = Math.max(0, Math.ceil(worked - baseHours)),
        manual =
          l.extraHours === undefined || l.extraHours === ""
            ? null
            : Number(l.extraHours);
      if (manual !== null && (!Number.isFinite(manual) || manual < 0))
        throw new Error("Horas extras manuais inválidas.");
      const quantity = Number(l.quantity ?? 1);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000)
        throw new Error(
          "A quantidade de veículos deve ser um inteiro positivo.",
        );
      const extraHours = manual ?? computed,
        rate = money((dailyRate * ratePct) / 100),
        amount = money(rate * extraHours * quantity);
      total += amount;
      return {
        ...l,
        dailyRate,
        quantity,
        computedHours: computed,
        extraHours,
        overridden: manual !== null && manual !== computed,
        rate,
        amount,
      };
    });
    return { ...day, lines };
  });
  return { baseHours, ratePct, days, total: money(total) };
}
export function calculateStay(s) {
  if (!validDate(s?.checkIn) || !validDate(s?.checkOut))
    throw new Error("Informe check-in e check-out válidos.");
  const nights = nightsBetween(s.checkIn, s.checkOut);
  if (nights < 1) throw new Error("O check-out deve ser após o check-in.");
  if (!s.hotelName?.trim()) throw new Error("Informe o hotel.");
  if (!Array.isArray(s.rooms) || !s.rooms.length)
    throw new Error("Inclua pelo menos um quarto.");
  let total = 0;
  const rooms = s.rooms.map((r) => {
    const quantity = Number(r.quantity ?? 1),
      nightlyRate = Number(r.nightlyRate);
    if (
      !r.description?.trim() ||
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(nightlyRate) ||
      nightlyRate < 0
    )
      throw new Error("Revise descrição, quantidade e diária dos quartos.");
    const amount = money(quantity * nightlyRate * nights);
    total += amount;
    return { ...r, quantity, nightlyRate, amount };
  });
  total = money(total);
  let paid = 0;
  const payments = (s.payments || []).map((p) => {
    const amount = Number(p.amount);
    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      (p.date && !validDate(p.date)) ||
      (p.description !== undefined && typeof p.description !== "string")
    )
      throw new Error("Revise os pagamentos.");
    paid += amount;
    return { ...p, amount };
  });
  paid = money(paid);
  if (paid > total)
    throw new Error("Os pagamentos excedem o total da reserva.");
  for (const k of ["checkInTime", "checkOutTime"])
    if (s[k] && parseTime(s[k]) === null) throw new Error("Horário inválido.");
  return {
    ...s,
    rooms,
    payments,
    nights,
    total,
    paid,
    balance: money(total - paid),
  };
}
// Fechamento/repasse interno: linha com base × % (comissão) ou qtd × unitário. Centavos preservados.
export function calculateInternal(n) {
  if (!["fechamento", "repasse"].includes(n?.kind))
    throw new Error("Tipo de documento interno inválido.");
  if (!n.partner?.trim()) throw new Error("Informe o parceiro ou operação.");
  if (!Array.isArray(n.lines) || !n.lines.length)
    throw new Error("Inclua pelo menos uma linha.");
  let total = 0;
  const lines = n.lines.map((l) => {
    if (!l.label?.trim()) throw new Error("Toda linha precisa de descrição.");
    let amount;
    if (l.pct !== undefined && l.pct !== "") {
      const base = Number(l.base),
        pct = Number(l.pct);
      if (
        !Number.isFinite(base) ||
        base < 0 ||
        !Number.isFinite(pct) ||
        pct < 0 ||
        pct > 100
      )
        throw new Error("Revise base e percentual.");
      amount = money((base * pct) / 100);
    } else {
      const qty = Number(l.qty ?? 1),
        unit = Number(l.unit);
      if (
        !Number.isFinite(qty) ||
        qty <= 0 ||
        !Number.isFinite(unit) ||
        unit < 0
      )
        throw new Error("Revise quantidade e valor.");
      amount = money(qty * unit);
    }
    total += amount;
    return { ...l, amount };
  });
  return { ...n, lines, total: money(total) };
}
const statuses = ["Rascunho", "Emitido", "Pago", "Cancelado"];
function validateCommon(d) {
  if (d.status !== undefined && !statuses.includes(d.status))
    throw new Error("Status inválido.");
  for (const k of ["date", "due"])
    if (d[k] && !validDate(d[k]))
      throw new Error("Informe emissão e validade válidas.");
  if (d.date && d.due && d.due < d.date)
    throw new Error("O vencimento não pode ser anterior à emissão.");
}
function validateExtras(d) {
  validateCommon(d);
  if (d.brand !== undefined && !brandIds.includes(d.brand))
    throw new Error("Marca inválida.");
  if (d.showPrices !== undefined && typeof d.showPrices !== "boolean")
    throw new Error("Opção de valores inválida.");
}
function validateGuia(d) {
  const g = d.guide;
  if (!g?.title?.trim() || !g.address?.trim())
    throw new Error("O guia precisa de título e endereço.");
  if (!Array.isArray(g.sections) || !g.sections.some((s) => s.text?.trim()))
    throw new Error("Inclua ao menos uma seção com texto.");
  if (!["a4", "mobile"].includes(g.layout || "a4"))
    throw new Error("Layout do guia inválido.");
  if (g.wifi && !["WPA", "WEP", "nopass"].includes(g.wifi.encryption || "WPA"))
    throw new Error("Criptografia de wifi inválida.");
  return { ...d, guide: { layout: "a4", ...g } };
}
export function validateDoc(d) {
  validateExtras(d);
  if (d.type === "proposta" && d.proposal && !d.proposal.title?.trim())
    throw new Error("Informe o título da proposta.");
  if (d.type === "guia") {
    if (!["pt", "en"].includes(d.language))
      throw new Error("Tipo, idioma ou moeda inválidos.");
    return validateGuia(d);
  }
  if (d.type === "hospedagem") {
    if (
      !["pt", "en"].includes(d.language) ||
      !["BRL", "USD", "EUR"].includes(d.currency)
    )
      throw new Error("Tipo, idioma ou moeda inválidos.");
    if (!["Rascunho", "Emitido", "Pago", "Cancelado"].includes(d.status))
      throw new Error("Status inválido.");
    const stay = calculateStay(d.stay);
    return { ...d, stay, total: stay.total };
  }
  if (d.type === "interno") {
    if (
      !["pt", "en"].includes(d.language) ||
      !["BRL", "USD", "EUR"].includes(d.currency)
    )
      throw new Error("Tipo, idioma ou moeda inválidos.");
    const internal = calculateInternal(d.internal);
    return { ...d, internal, confidential: true, total: internal.total };
  }
  if (d.type === "horas") {
    if (
      !["pt", "en"].includes(d.language) ||
      !["BRL", "USD", "EUR"].includes(d.currency)
    )
      throw new Error("Tipo, idioma ou moeda inválidos.");
    if (!d.client?.trim()) throw new Error("Informe o cliente.");
    const overtime = calculateOvertime(d.overtime);
    const printed =
      d.printedTotal === undefined || d.printedTotal === ""
        ? null
        : Number(d.printedTotal);
    if (printed !== null && (!Number.isFinite(printed) || printed < 0))
      throw new Error("Total impresso inválido.");
    return {
      ...d,
      overtime,
      total: overtime.total,
      discrepancy: printed === null ? 0 : money(overtime.total - printed),
    };
  }
  if (
    !types[d.type] ||
    !["pt", "en"].includes(d.language) ||
    !["BRL", "USD", "EUR"].includes(d.currency)
  )
    throw new Error("Tipo, idioma ou moeda inválidos.");
  if (!["Rascunho", "Emitido", "Pago", "Cancelado"].includes(d.status))
    throw new Error("Status inválido.");
  if (!d.client?.trim()) throw new Error("Informe o cliente.");
  if (!validDate(d.date) || !validDate(d.due))
    throw new Error("Informe emissão e vencimento válidos.");
  if (d.due < d.date)
    throw new Error("O vencimento não pode ser anterior à emissão.");
  if (d.type === "recibo" && d.status !== "Pago")
    throw new Error("O recibo exige pagamento confirmado.");
  return { ...d, ...calculate(d.items, d.discount) };
}
