export function rioItinerarySections() {
  const days = [
    [
      "ÍCONES E TRADIÇÃO",
      [
        [
          "MANHÃ",
          "Cristo Redentor",
          "Visita panorâmica ao Cristo Redentor. Confirmar acesso, ingressos e melhor horário antes da saída.",
        ],
        [
          "ALMOÇO",
          "Assador Rio’s",
          "Almoço com vista para a Baía de Guanabara. Reserva e preferências gastronômicas a confirmar.",
        ],
        [
          "TARDE",
          "Museu do Flamengo — Gávea",
          "Passeio pela história cultural e esportiva do clube. Confirmar funcionamento e disponibilidade.",
        ],
        [
          "JANTAR",
          "Rudá ou Spicy Fish — Ipanema",
          "Escolha gastronômica em Ipanema conforme a preferência do cliente. Reserva sujeita a confirmação.",
        ],
      ],
    ],
    [
      "LEGADO E VANGUARDA",
      [
        [
          "MANHÃ",
          "Pão de Açúcar e Maracanã",
          "Passeio panorâmico e visita ao Maracanã. Ajustar percurso e ingressos conforme disponibilidade.",
        ],
        [
          "ALMOÇO",
          "Rubaiyat Rio",
          "Almoço em ambiente acolhedor. Confirmar reserva, horário e restrições alimentares.",
        ],
        [
          "TARDE",
          "City Tour pelo Centro Histórico",
          "Museu do Amanhã, Praça Mauá, Escadaria Selarón, Lapa e Urca: selecionar as paradas desejadas.",
        ],
        [
          "JANTAR",
          "Gero — Hotel Fasano",
          "Jantar com experiência gastronômica italiana. Confirmar reserva antes da emissão definitiva.",
        ],
      ],
    ],
    [
      "NATUREZA, LITORAL E EXCLUSIVIDADE",
      [
        [
          "MANHÃ",
          "Pedra da Gávea e São Conrado",
          "Passeio contemplativo pela orla de São Conrado, aos pés da Pedra da Gávea.",
        ],
        [
          "ALMOÇO",
          "Giuseppe Mar — VillageMall",
          "Sugestão de almoço com frutos do mar. Verificar reserva e funcionamento.",
        ],
        [
          "TARDE",
          "Orla da Reserva e Prainha",
          "Roteiro pelo litoral com paradas para contemplação e descanso, conforme as condições do dia.",
        ],
        [
          "NOITE",
          "Spirit Bar & Restaurante",
          "Encerramento da viagem com jantar ou happy hour, conforme a preferência do cliente.",
        ],
      ],
    ],
  ];
  return days.flatMap(([dayTitle, stops], i) =>
    stops.map(([period, title, text], j) => ({
      id: `rio-${i + 1}-${j + 1}`,
      day: i + 1,
      dayTitle,
      period,
      title,
      text,
      image: "",
    })),
  );
}
export function rioConciergeNotes() {
  return [
    {
      title: "Veículo exclusivo",
      text: "Informe o veículo, o motorista e o período efetivamente contratado. Ajuste deslocamentos, esperas e traslados ao programa confirmado.",
    },
    {
      title: "Flexibilidade total",
      text: "O roteiro é uma sugestão editável. Horários, reservas e experiências podem ser reorganizados conforme as preferências do cliente.",
    },
    {
      title: "Reservas gastronômicas",
      text: "Confirme antecipadamente as casas desejadas. Registre preferências, disponibilidade e restrições alimentares antes de finalizar.",
    },
  ];
}
