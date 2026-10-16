import React from "react";
import linesLogo from "./assets/lines-logo.png";
import estateLogo from "./assets/realestate-logo.png";
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
      <h2>O que você quer enviar ao cliente?</h2>
      <p>
        Escolha abaixo. Vamos ajudar você a preencher, conferir e gerar o PDF.
      </p>
      <div className="guided-start-grid">
        {[
          [
            "orcamento",
            "Preparar um orçamento",
            "Apresente serviços, fotos e preços.",
            "01",
          ],
          [
            "invoice",
            "Enviar uma invoice",
            "Organize os serviços e o pagamento.",
            "02",
          ],
          [
            "nota",
            "Confirmar um atendimento",
            "Mostre o serviço, motorista e veículo.",
            "03",
          ],
        ].map(([type, title, description, number]) => (
          <button
            className="guided-start"
            key={type}
            onClick={() => onCreate(type, true)}
          >
            <img src={linesLogo} alt="Brummie Lines" />
            <span className="guided-start-number">{number}</span>
            <strong>{title}</strong>
            <span>{description}</span>
            <b>Criar com ajuda →</b>
          </button>
        ))}
      </div>
      <h2>Todos os modelos e exemplos</h2>
      <p>
        Comece vazio ou abra um exemplo completo. Na prévia, use Reutilizar para
        editar.
      </p>
      <div className="launcher-grid">
        {documentFormats.map(([type, label, description]) => {
          const estate = ["selection", "hospedagem", "guia"].includes(type);
          const brandName = estate ? "Brummie Real Estate" : "Brummie Lines";
          const brandLogo = estate ? estateLogo : linesLogo;
          return (
            <article className="panel launcher-card" key={type}>
              <h3>{label}</h3>
              <p>{description}</p>
              <div>
                <button className="primary" onClick={() => onCreate(type)}>
                  <span
                    className="launcher-brand"
                    aria-hidden="true"
                    title={brandName}
                  >
                    <img src={brandLogo} alt="" />
                    <small>{brandName}</small>
                  </span>
                  Criar {type === "selection" ? "seleção de hospedagem" : label}
                </button>
                <button className="secondary" onClick={() => onExample(type)}>
                  Exemplo completo: {label}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
