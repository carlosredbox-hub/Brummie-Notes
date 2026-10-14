// Conteúdo genérico e editável. Sem credenciais, códigos de acesso, nomes ou valores reais.
export const brummieFooter = {
  address: "Rua Visconde de Pirajá 82 - Sala 201\nIpanema - Rio de Janeiro",
  phone: "+55 21 99683-9024",
  taxId: "22.738.565/0001-03",
};
export const brands = {
  lines: {
    ...brummieFooter,
    id: "lines",
    name: "Brummie Lines",
    color: "#0089cf",
  },
  realestate: {
    ...brummieFooter,
    website: "www.brummierealestate.com",
    id: "realestate",
    name: "Brummie Real Estate",
    color: "#e8821a",
  },
  luxury: {
    ...brummieFooter,
    website: "www.brummierealestate.com",
    id: "luxury",
    name: "Brummie Luxury Estate",
    color: "#e8821a",
  },
};
export const guideSections = [
  [
    "keys",
    "Chaves e internet",
    "key",
    "As chaves são entregues no check-in. Os dados do wifi são informados no guia.",
  ],
  [
    "utilities",
    "Água, gás e eletricidade",
    "droplet",
    "Em caso de falta de energia ou água, avise imediatamente o responsável pela sua reserva.",
  ],
  [
    "trash",
    "Descarte do lixo",
    "trash",
    "Deixe o lixo no local indicado. Não jogue papel no vaso sanitário.",
  ],
  [
    "cleaning",
    "Serviço de limpeza",
    "sparkles",
    "Solicite ao responsável pela reserva que agende as limpezas.",
  ],
  [
    "rules",
    "Regras",
    "shield",
    "Respeite o horário de silêncio. Siga as regras de acesso do edifício.",
  ],
  [
    "ac",
    "Ar-condicionado",
    "wind",
    "Desligue os aparelhos ao sair e mantenha portas e janelas fechadas quando ligados.",
  ],
  [
    "safe",
    "Cofre",
    "lock",
    "Para definir o código, siga as instruções do cofre do quarto.",
  ],
  [
    "parking",
    "Estacionamento",
    "car",
    "Envie placa, modelo e período de uso ao responsável pela reserva.",
  ],
  [
    "delivery",
    "Entregas",
    "bike",
    "Você pode pedir comida, mantimentos e farmácia por aplicativos de entrega.",
  ],
].map(([id, title, icon, text]) => ({ id, title, icon, text }));
export const hotelTerms = {
  pt: "Condições conforme política do hotel. Confirme horários de check-in e check-out, regras de cancelamento e política de crianças diretamente com a hospedagem.",
  en: "Terms follow the hotel policy. Confirm check-in/check-out times, cancellation rules and the children policy directly with the property.",
};
export const overtimePolicy = {
  pt: "Hora extra equivale a 10% do valor da diária por hora excedida.",
  en: "An extra hour is charged at 10% of the daily rate per additional hour.",
};
const base = { language: "pt", currency: "BRL", status: "Rascunho", items: [] };
export const documentPresets = [
  {
    id: "guia-imovel",
    name: "Guia do imóvel",
    type: "guia",
    brand: "realestate",
    content: {
      ...base,
      type: "guia",
      brand: "realestate",
      guide: {
        title: "Guia do imóvel",
        address: "",
        layout: "a4",
        sections: guideSections,
      },
    },
  },
  {
    id: "voucher-hospedagem",
    name: "Voucher de hospedagem",
    type: "hospedagem",
    brand: "luxury",
    content: {
      ...base,
      type: "hospedagem",
      brand: "luxury",
      stay: { hotelName: "", rooms: [], payments: [], terms: hotelTerms.pt },
    },
  },
  {
    id: "horas-extras",
    name: "Horas extras",
    type: "horas",
    brand: "lines",
    content: {
      ...base,
      type: "horas",
      brand: "lines",
      overtime: { baseHours: 10, ratePct: 10, days: [] },
      notes: overtimePolicy.pt,
    },
  },
  {
    id: "proposta-evento",
    name: "Proposta de evento",
    type: "proposta",
    brand: "realestate",
    content: {
      ...base,
      type: "proposta",
      brand: "realestate",
      proposal: {
        title: "",
        venue: "",
        eventDate: "",
        inclusions: "",
        paymentTerms: "",
        schedule: "",
      },
    },
  },
];
