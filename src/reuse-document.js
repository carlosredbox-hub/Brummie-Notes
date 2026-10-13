export function reuseDocument(source, date) {
  const day = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value || "")
      ? Date.parse(value + "T00:00:00Z")
      : NaN;
  const days = (source.items || [])
    .map((item) => day(item.date))
    .filter(Number.isFinite);
  const first = days.length ? Math.min(...days) : day(date);
  const start = day(date);
  return {
    ...source,
    date,
    due: date,
    items: (source.items || []).map((item) => ({
      ...item,
      date: Number.isFinite(day(item.date))
        ? new Date(start + day(item.date) - first).toISOString().slice(0, 10)
        : date,
    })),
    ...(source.stay
      ? {
          stay: {
            ...source.stay,
            checkIn: date,
            checkOut: new Date(
              start +
                Math.max(
                  1,
                  (day(source.stay.checkOut) - day(source.stay.checkIn)) /
                    86400000,
                ) *
                  86400000,
            )
              .toISOString()
              .slice(0, 10),
            payments: [],
          },
        }
      : {}),
    ...(source.proposal
      ? { proposal: { ...source.proposal, eventDate: date } }
      : {}),
    ...(source.overtime
      ? {
          overtime: {
            ...source.overtime,
            days: source.overtime.days.map((d, i) => ({
              ...d,
              date: new Date(start + i * 86400000).toISOString().slice(0, 10),
              lines: d.lines.map((line) => ({
                ...line,
                extraHours: line.overridden ? line.extraHours : "",
              })),
            })),
          },
        }
      : {}),
    status: source.type === "recibo" ? "Pago" : "Emitido",
  };
}
