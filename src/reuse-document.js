export function reuseDocument(source, date) {
  const day = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value || "")
      ? Date.parse(value + "T00:00:00Z")
      : NaN;
  const days = source.items
    .map((item) => day(item.date))
    .filter(Number.isFinite);
  const first = days.length ? Math.min(...days) : day(date);
  const start = day(date);
  return {
    ...source,
    date,
    due: date,
    items: source.items.map((item) => ({
      ...item,
      date: Number.isFinite(day(item.date))
        ? new Date(start + day(item.date) - first).toISOString().slice(0, 10)
        : date,
    })),
    status: source.type === "recibo" ? "Pago" : "Emitido",
  };
}
