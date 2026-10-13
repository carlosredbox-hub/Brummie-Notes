export async function addDocumentCover(pdf, d) {
  if (!d.cover?.enabled || d.confidential) return false;
  const c = d.company,
    col = /^#[a-f0-9]{6}$/i.test(c.color || "") ? c.color : "#315b47";
  pdf.setFillColor("#fbfaf5");
  pdf.rect(0, 0, 210, 90, "F");
  const fit = async (src, x, y, w, h) => {
    if (!src) return false;
    try {
      const img = new Image();
      img.src = src;
      await img.decode();
      const scale = Math.min(w / img.width, h / img.height);
      const rw = img.width * scale,
        rh = img.height * scale;
      pdf.addImage(
        img,
        src.includes("image/jpeg") ? "JPEG" : "PNG",
        x + (w - rw) / 2,
        y + (h - rh) / 2,
        rw,
        rh,
      );
      return true;
    } catch {
      return false;
    }
  };
  if (!(await fit(c.logo, 35, 15, 140, 65))) {
    pdf.setFont("times", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(col);
    pdf.text(c.name, 105, 52, { align: "center" });
  }
  await fit(
    d.cover.image || d.guide?.coverImage || c.coverImage,
    0,
    90,
    210,
    120,
  );
  const titles = {
    invoice: "Invoice",
    fatura: "Fatura",
    voucher: "Voucher de confirmação",
    nota: "Nota de atendimento",
    orcamento: "Orçamento",
    recibo: "Recibo",
    guia: "Home Guide",
    hospedagem: "Voucher de hospedagem",
    proposta: "Proposta",
    horas: "Extra Hours",
  };
  pdf.setFont("times", "normal");
  pdf.setTextColor("#283a31");
  pdf.setFontSize(24);
  const title =
    d.cover.title || d.guide?.title || d.proposal?.title || titles[d.type];
  pdf.text(pdf.splitTextToSize(title, 172).slice(0, 2), 105, 230, {
    align: "center",
  });
  let dateLabel = d.cover.dateLabel;
  if (!dateLabel) {
    const dates = (
      d.stay
        ? [d.stay.checkIn, d.stay.checkOut]
        : d.overtime
          ? d.overtime.days.map((x) => x.date)
          : d.type === "proposta"
            ? [d.proposal.eventDate]
            : d.items?.map((i) => i.date) || [d.date]
    )
      .filter(Boolean)
      .sort();
    dateLabel = dates.length
      ? dates[0] === dates[dates.length - 1]
        ? dates[0]
        : `${dates[0]} — ${dates[dates.length - 1]}`
      : d.date;
  }
  pdf.setFont("times", "italic");
  pdf.setFontSize(12);
  pdf.text(
    pdf
      .splitTextToSize(
        [d.cover.place, dateLabel].filter(Boolean).join(" • "),
        175,
      )
      .slice(0, 2),
    105,
    251,
    { align: "center" },
  );
  pdf.setFont("times", "normal");
  pdf.setFontSize(17);
  pdf.text(pdf.splitTextToSize(d.client || "", 175).slice(0, 2), 105, 270, {
    align: "center",
  });
  if (d.status === "Cancelado") {
    pdf.setTextColor("#a33d30");
    pdf.setFontSize(11);
    pdf.text(d.language === "en" ? "CANCELLED" : "CANCELADO", 105, 285, {
      align: "center",
    });
  }
  pdf.addPage();
  return true;
}
