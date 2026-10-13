import React from "react";
export const documentFormats = [
  ["invoice", "Invoice", "Serviços, valores e pagamento."],
  ["fatura", "Fatura", "Resumo financeiro dos serviços."],
  ["orcamento", "Orçamento", "Proposta de transporte com fotos."],
  ["nota", "Nota de atendimento", "Motorista, idiomas, carro e placa."],
  ["voucher", "Voucher de confirmação", "Roteiro e instruções de atendimento."],
  ["recibo", "Recibo", "Serviços com pagamento confirmado."],
  [
    "selection",
    "Seleção de imóveis",
    "Fotos, períodos, links e alternativas independentes.",
  ],
  [
    "hospedagem",
    "Voucher de hospedagem",
    "Quartos, diárias, pagamentos e saldo.",
  ],
  ["proposta", "Proposta de experiência", "Vários serviços e imagens."],
  ["guia", "Home Guide", "Fotos do imóvel, instruções e QR Wi-Fi."],
  ["horas", "Horas extras", "Vários veículos, jornadas e valores."],
  ["interno", "Documento interno", "Fechamento ou repasse confidencial."],
  [
    "commercial",
    "Proposta comercial",
    "Tarifário em paisagem e catálogo de veículos.",
  ],
  ["itinerary", "Roteiro de viagem", "Programação por dia, horários e fotos."],
  [
    "portfolio",
    "Portfólio de experiências",
    "Apresentação institucional com serviços e imagens.",
  ],
];
export function DocumentLauncher({ onCreate, onExample }) {
  return (
    <section className="document-launcher">
      <h2>Escolha o documento</h2>
      <p>
        Comece vazio ou abra um exemplo completo. Na prévia, use Reutilizar para
        editar.
      </p>
      <div className="launcher-grid">
        {documentFormats.map(([type, label, description]) => (
          <article className="panel launcher-card" key={type}>
            <h3>{label}</h3>
            <p>{description}</p>
            <div>
              <button className="primary" onClick={() => onCreate(type)}>
                Criar {type === "selection" ? "seleção de hospedagem" : label}
              </button>
              <button className="secondary" onClick={() => onExample(type)}>
                Exemplo completo: {label}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
