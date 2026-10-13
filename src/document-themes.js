export const documentThemes = {
  basic: {
    label: "Básico",
    paper: "#ffffff",
    ink: "#181818",
    muted: "#666666",
    accent: null,
    panel: "#f7f4ed",
    left: 15,
    top: 22,
    serif: "Cormorant",
  },
  orange: {
    label: "Lateral escura + laranja",
    paper: "#ffffff",
    ink: "#202529",
    muted: "#63717e",
    accent: "#ff701a",
    panel: "#f4f4f2",
    sidebar: "#202529",
    left: 64,
    top: 22,
    serif: "OpenSans",
  },
  gold: {
    label: "Escuro + dourado",
    paper: "#13161e",
    ink: "#f5f4ef",
    muted: "#a7b1c0",
    accent: "#d6b36c",
    panel: "#1d2028",
    rule: "#383b44",
    left: 15,
    top: 24,
    serif: "OpenSans",
  },
  blue: {
    label: "Clássico azul",
    paper: "#f5f7fb",
    ink: "#142c5c",
    muted: "#6c7d97",
    accent: "#b79247",
    panel: "#edf1f8",
    header: "#183b76",
    left: 15,
    top: 50,
    serif: "Cormorant",
  },
};
export const themeFor = (id) => documentThemes[id] || documentThemes.basic;
export function paintDocumentTheme(pdf, d) {
  const id = d.theme || d.company.documentTheme || "basic",
    t = themeFor(id);
  pdf.setFillColor(t.paper);
  pdf.rect(0, 0, 210, 297, "F");
  if (id === "gold") {
    pdf.setDrawColor("#5e5135");
    pdf.rect(10, 10, 190, 277);
  }
  if (id === "orange") {
    pdf.setFillColor(t.sidebar);
    pdf.rect(0, 0, 52, 297, "F");
  }
  if (id === "blue") {
    pdf.setFillColor(t.header);
    pdf.rect(0, 0, 210, 31, "F");
    pdf.setFillColor("#b79247");
    pdf.rect(0, 31, 210, 1, "F");
    pdf.setFont("OpenSans", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor("#ffffff");
    pdf.text(pdf.splitTextToSize(d.company.name, 125), 15, 17);
    pdf.setFontSize(9);
    pdf.text(`BRM-${String(d.number).padStart(5, "0")}`, 195, 18, {
      align: "right",
    });
  }
}
