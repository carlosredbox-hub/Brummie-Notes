import { rioItinerarySections, rioConciergeNotes } from "./itinerary-model.js";
import propertyRio from "./assets/example-property-rio.jpeg";
import propertyBuzios from "./assets/example-property-buzios.jpeg";
import propertyAngra from "./assets/example-property-angra.jpeg";
import { commercialDefault } from "./commercial.jsx";
import { conciergeDefault } from "./concierge.jsx";
import { validateDoc } from "./editorial-document.js";
import { documentCompany } from "./document-branding.js";
import sedan from "./assets/example-sedan.png";
import van from "./assets/example-van.jpeg";
import hotelRio from "./assets/example-hotel-rio.jpeg";
import hotelSp from "./assets/example-hotel-sp.jpeg";
import rio from "./assets/realestate-cover.jpeg";
export function exampleDocument(kind) {
  const type = ["selection", "commercial", "portfolio"].includes(kind)
      ? "proposta"
      : kind === "itinerary"
        ? "guia"
        : kind,
    d = conciergeDefault(type),
    date = d.date;
  Object.assign(d, {
    client: "Cliente de demonstração",
    email: "cliente@exemplo.example",
    clientTaxId: "00.000.000/0000-00",
    clientAddress: "Cidade de demonstração • Brasil",
    status: type === "recibo" ? "Pago" : "Rascunho",
    notes:
      "EXEMPLO — informações e valores fictícios para conferir a composição. Revisar antes de usar comercialmente.",
    cardFeePct: 0,
  });
  d.items = [
    {
      description: "Transfer executivo • chegada",
      details:
        "Recepção no aeroporto, assistência com bagagem e transporte ao hotel. Veículo ilustrativo.",
      quantity: 1,
      price: 450,
      extra: 30,
      pax: 3,
      date,
      time: "09:30",
      unit: "serviço",
      origin: "Aeroporto de demonstração",
      destination: "Hotel de demonstração",
      flight: "EX 0123",
      image: sedan,
    },
    {
      description: "Van executiva • disposição",
      details:
        "Atendimento por dez horas, com duas paradas programadas e motorista bilíngue.",
      quantity: 2,
      price: 1500,
      extra: 0,
      pax: 8,
      date,
      time: "10:00",
      unit: "dia",
      origin: "Hotel de demonstração",
      destination: "Roteiro personalizado",
      flight: "",
      image: van,
    },
  ];
  d.discount = 100;
  if (
    ["nota", "voucher", "guia", "hospedagem", "horas", "interno"].includes(type)
  )
    d.discount = 0;
  if (["nota", "voucher"].includes(type)) {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e8eef8";
    ctx.fillRect(0, 0, 300, 300);
    ctx.fillStyle = "#53729e";
    ctx.beginPath();
    ctx.arc(150, 105, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(150, 240, 100, 85, 0, 0, Math.PI * 2);
    ctx.fill();
    d.driver = {
      kind: "driver",
      name: "Motorista exemplo",
      languages: "Português • English",
      phone: "+55 (00) 00000-0001",
      photo: canvas.toDataURL("image/png"),
    };
    d.vehicle = {
      kind: "vehicle",
      name: "Van de demonstração",
      category: "Van executiva",
      plate: "EXE0A00",
      photo: van,
    };
    d.showPrices = false;
  }
  if (type === "guia")
    Object.assign(d.guide, {
      title: "Guia completo do imóvel de demonstração",
      propertyCode: "EX-RJ001",
      address: "Endereço de demonstração • Rio de Janeiro",
      coverImage: rio,
      accessInstructions:
        "Entrada às15h. Retire a chave com a equipe de recepção e confirme o contato antes da chegada.",
      wifi: {
        ssid: "Rede de demonstração",
        password: "senha-exemplo",
        encryption: "WPA",
      },
      sections: [
        {
          title: "Bem-vindo",
          text: "Informações da estadia e do ambiente. Fotografia ilustrativa de hotel.",
          image: hotelRio,
        },
        {
          title: "Recepção e serviços",
          text: "Recepção, café da manhã e orientações para solicitar assistência. Imagem ilustrativa de fachada.",
          image: hotelSp,
        },
        {
          title: "Saída",
          text: "Check-out às12h. Confira os pertences e entregue as chaves à recepção.",
          image: rio,
        },
      ],
    });
  if (type === "hospedagem")
    Object.assign(d.stay, {
      hotelName: "Hotel de demonstração",
      hotelTaxId: "00.000.000/0000-00",
      hotelAddress: "Rua de demonstração,100 • Rio de Janeiro",
      guests: "Cliente exemplo e três acompanhantes",
      requester: "Equipe de demonstração",
      coverImage: hotelRio,
      rooms: [
        {
          description: "Categoria superior • exemplo",
          details: "Categoria ilustrativa; foto da fachada do hotel.",
          quantity: 2,
          nightlyRate: 800,
          image: hotelRio,
          inclusions: "Café da manhã incluído no exemplo.",
        },
        {
          description: "Categoria executiva • exemplo",
          details: "Segunda categoria ilustrativa; foto de fachada.",
          quantity: 1,
          nightlyRate: 1200,
          image: hotelSp,
          inclusions: "Wi-Fi incluído no exemplo.",
        },
      ],
      payments: [{ description: "Sinal de demonstração", date, amount: 500 }],
      terms:
        "Condições de demonstração: revisar cancelamento, horários e disponibilidade.",
    });
  if (type === "proposta")
    Object.assign(d.proposal, {
      title: "Experiências e serviços de demonstração",
      venue: "Rio de Janeiro",
      inclusions: "Transporte executivo e atendimento bilíngue.",
      schedule: "09h30 • chegada. 10h00 • roteiro. 19h00 • encerramento.",
      paymentTerms:
        "Pagamento de demonstração: transferência antes da prestação.",
      coverImage: rio,
    });
  if (kind === "selection") {
    d.brand = "realestate";
    d.notes = "";
    d.discount = 0;
    d.cover = {
      enabled: true,
      title: "PROPERTY SELECTION",
      place: "Rio de Janeiro • Búzios • Angra dos Reis",
      dateLabel: "05/02/2027 • 14/02/2027",
    };
    d.proposal = {
      title: "Seleção de imóveis de demonstração",
      layout: "property-selection",
      eventDate: date,
      options: [
        {
          city: "Rio de Janeiro",
          title: "Casa de demonstração",
          propertyCode: "EX-RJ001",
          suites: 6,
          bathrooms: 8,
          description:
            "Imóvel ilustrativo para testar descrição, foto e preço. Foto extraída do portfólio recebido; valores e códigos deste exemplo são fictícios.",
          image: propertyRio,
          rooms: 1,
          nights: 6,
          priceMode: "total",
          totalPrice: 295000,
          nightlyRate: 0,
          period: "05/02 a 11/02",
          link: "https://imoveis.example/EX-RJ001",
          inclusions: "Condições e inclusões de demonstração.",
        },
        {
          city: "Búzios",
          title: "Estadia de demonstração",
          propertyCode: "EX-BU006",
          suites: 9,
          bathrooms: 9.5,
          description:
            "Segunda alternativa ilustrativa, com preço independente. Foto de fachada de hotel para testar imagem.",
          image: propertyBuzios,
          rooms: 1,
          nights: 3,
          priceMode: "total",
          totalPrice: 185000,
          nightlyRate: 0,
          period: "11/02 a 14/02",
          link: "https://imoveis.example/EX-BU006",
          inclusions: "Revisar disponibilidade antes de enviar.",
        },
        {
          city: "Angra dos Reis",
          title: "Alternativa de demonstração",
          propertyCode: "EX-AG010",
          suites: 5,
          bathrooms: 6.5,
          description:
            "Terceira alternativa para testar paginação, imagem e link. Foto ilustrativa de fachada.",
          image: propertyAngra,
          rooms: 1,
          nights: 3,
          priceMode: "total",
          totalPrice: 70000,
          nightlyRate: 0,
          period: "11/02 a 14/02",
          link: "https://imoveis.example/EX-AG010",
          inclusions: "",
        },
      ],
    };
  }
  if (type === "horas")
    d.overtime = {
      baseHours: 10,
      ratePct: 10,
      days: [
        {
          date,
          lines: [
            {
              vehicle: "Sedan de demonstração",
              image: sedan,
              dailyRate: 1200,
              quantity: 2,
              start: "08:00",
              end: "22:00",
            },
            {
              vehicle: "Van de demonstração",
              image: van,
              dailyRate: 1500,
              quantity: 1,
              start: "09:00",
              end: "21:30",
            },
          ],
        },
      ],
    };
  if (type === "interno")
    d.internal = {
      kind: "repasse",
      partner: "Operação de demonstração",
      lines: [
        { label: "ServiçoA • comissão", base: 10000, pct: 5, image: sedan },
        { label: "ServiçoB • repasse", qty: 2, unit: 450, image: van },
      ],
    };
  if (kind === "commercial") {
    d.discount = 0;
    d.notes = "";
    d.proposal = {
      ...d.proposal,
      title: "Proposta comercial de demonstração",
      layout: "commercial",
      commercial: {
        ...commercialDefault(),
        partnerName: "Hotel de demonstração",
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
                label: "GIG • Aeroporto de demonstração",
                prices: [450, 700, 900, 750, 1100, 900],
              },
              {
                label: "SDU • Aeroporto de demonstração",
                prices: [400, 650, 850, 700, 1000, 800],
              },
            ],
          },
          {
            title: "DESTINOS REGIONAIS",
            rows: [
              {
                label: "Transfer • Angra dos Reis",
                prices: [1500, 2500, 3300, 2500, 4100, 2900],
              },
              {
                label: "Transfer • Búzios",
                prices: [1500, 2500, 3300, 2500, 4100, 2900],
              },
            ],
          },
          {
            title: "DISPOSIÇÃO",
            rows: [
              {
                label: "Disposição10 horas",
                prices: [1200, 2000, 2700, 2000, 3300, 2400],
              },
              {
                label: "Disposição5 horas",
                prices: [800, null, null, 1200, null, 1600],
              },
            ],
          },
        ],
        fleet: [
          { name: "Sedan executivo • exemplo", image: sedan },
          { name: "Van executiva • exemplo", image: van },
          { name: "Sedan blindado • exemplo", image: sedan },
          { name: "Minivan • exemplo", image: van },
          { name: "SUV • exemplo", image: sedan },
          { name: "Van luxo • exemplo", image: van },
        ],
        conditions:
          "EXEMPLO com valores e categorias fictícios. Hora extra: 10% da diária por hora. Confirmar disponibilidade.",
      },
    };
  }
  if (kind === "itinerary") {
    d.brand = "lines";
    d.category = kind;
    d.showPrices = false;
    d.cover.title = "ROTEIRO DE VIAGEM";
    d.guide = {
      ...d.guide,
      title: "EXPERIÊNCIA RIO DE JANEIRO",
      propertyCode: "",
      address: "Rio de Janeiro",
      accessInstructions: "Horários ilustrativos, sujeitos a confirmação.",
      wifi: { ssid: "", password: "", encryption: "WPA" },
      coverImage: "",
      presentation: "schedule",
      travelPeriod: "10 · 11 · 12 DE OUTUBRO — exemplo sem ano definido",
      conciergeNotes: rioConciergeNotes(),
      sections: rioItinerarySections().map((section, index) => ({
        ...section,
        image: index === 2 ? rio : index === 10 ? hotelRio : "",
      })),
    };
  }
  if (kind === "portfolio") {
    d.category = kind;
    d.showPrices = false;
    d.cover.title = "BRUMMIE EXPERIENCE";
    d.proposal.title = "Portfólio de experiências — demonstração";
    d.items = d.items.map((item, index) => ({
      ...item,
      description: index
        ? "Concierge e experiências personalizadas"
        : "Mobilidade executiva",
      details: index
        ? "Assistência na programação, reservas e experiências sob consulta."
        : "Transporte executivo com conforto, discrição e atendimento personalizado.",
    }));
  }
  const company = documentCompany(
    {
      name: "Brummie Lines",
      taxId: "00.000.000/0000-00",
      color: "#0089cf",
      address: "Rua de demonstração, 100 • Sala 201\nRio de Janeiro • Brasil",
      phone: "+55 (00) 00000-0000",
      email: "contato@brummie.example",
      website: "https://brummie.example",
      payment:
        "Banco de demonstração\nAgência0001 • Conta000000-0\nPIX: financeiro@brummie.example",
      terms:
        "Dados fictícios de demonstração; confirmar termos no documento real.",
    },
    d.brand,
  );
  return {
    ...validateDoc(d),
    id: "example-" + kind,
    number: 9001,
    company,
    examplePreview: true,
  };
}
