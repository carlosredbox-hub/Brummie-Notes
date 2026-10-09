export const types = {
  invoice: "Invoice",
  fatura: "Fatura",
  voucher: "Voucher de confirmação",
  nota: "Nota de atendimento",
  orcamento: "Orçamento",
  recibo: "Recibo",
};
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
  return {
    items: normalized,
    subtotal,
    discount,
    total: Math.round((subtotal - discount) * 100) / 100,
  };
}
const validDate = (v) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v || "") &&
  !Number.isNaN(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export function validateDoc(d) {
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
