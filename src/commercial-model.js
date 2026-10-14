export const isCommercial = (d) =>
  d.type === "proposta" && d.proposal?.layout === "commercial";
export const commercialDefault = () => ({
  category: "FROTA EXECUTIVA & BLINDADA",
  title: "Transfer Portos & Aeroportos",
  partnerName: "",
  partnerLogo: "",
  columns: [
    "Sedan executivo",
    "Sedan blindado",
    "SUV blindado",
    "Minivan executiva",
    "Minivan blindada",
    "Van executiva",
  ],
  groups: [
    {
      title: "TRANSFER AEROPORTOS",
      rows: [
        {
          label: "Transfer de chegada",
          prices: [450, 700, 900, 750, 1100, 900],
        },
        { label: "Transfer de saída", prices: [450, 700, 900, 750, 1100, 900] },
      ],
    },
  ],
  fleet: [],
  conditions:
    "Hora extra: acréscimo de 10% sobre o valor da diária de disposição.",
});
