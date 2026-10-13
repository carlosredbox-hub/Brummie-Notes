import React from "react";
import { calculateOption } from "./editorial-document.js";

export const emptyPropertyOption = () => ({
  city: "",
  title: "",
  description: "",
  image: "",
  rooms: 1,
  nights: 3,
  nightlyRate: 0,
  totalPrice: 0,
  priceMode: "nightly",
  inclusions: "",
});
export function PropertySelectionEditor({ options, onChange, currency, ui }) {
  const { Field, Photo } = ui;
  const patch = (index, key, value) =>
    onChange(
      options.map((option, i) =>
        i === index ? { ...option, [key]: value } : option,
      ),
    );
  return (
    <section className="form-section property-selection-editor">
      <h3>03 · Alternativas de hospedagem</h3>
      <p>
        Cada opção tem foto e preço próprios. Os valores não são somados: o
        cliente escolhe uma alternativa.
      </p>
      {options.map((option, index) => {
        let total = null;
        try {
          total = calculateOption(option).total;
        } catch {}
        return (
          <article className="concierge-block property-option" key={index}>
            <h4>Opção {index + 1}</h4>
            <div className="property-option-grid">
              <Field label={`Foto da hospedagem ${index + 1}`}>
                <Photo
                  value={option.image}
                  onChange={(value) => patch(index, "image", value)}
                />
              </Field>
              <div>
                <Field
                  label={`Cidade da opção ${index + 1}`}
                  value={option.city}
                  onChange={(e) => patch(index, "city", e.target.value)}
                />
                <Field
                  label={`Nome do quarto / imóvel ${index + 1}`}
                  required
                  value={option.title}
                  onChange={(e) => patch(index, "title", e.target.value)}
                />
                <Field label={`Descrição da opção ${index + 1}`}>
                  <textarea
                    rows={5}
                    value={option.description}
                    onChange={(e) =>
                      patch(index, "description", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>
            <div className="form-grid four">
              <Field
                label={`Quartos da opção ${index + 1}`}
                type="number"
                min="1"
                max="10000"
                required
                value={option.rooms}
                onChange={(e) => patch(index, "rooms", e.target.value)}
              />
              <Field
                label={`Noites da opção ${index + 1}`}
                type="number"
                min="1"
                max="10000"
                required
                value={option.nights}
                onChange={(e) => patch(index, "nights", e.target.value)}
              />
              <Field label={`Preço da opção ${index + 1}`}>
                <select
                  value={option.priceMode}
                  onChange={(e) => patch(index, "priceMode", e.target.value)}
                >
                  <option value="nightly">Por quarto e por noite</option>
                  <option value="total">Total informado para a estadia</option>
                </select>
              </Field>
              <Field
                label={
                  option.priceMode === "total"
                    ? `Total da opção ${index + 1}`
                    : `Diária da opção ${index + 1}`
                }
                type="number"
                min="0"
                step="0.01"
                required
                value={
                  option.priceMode === "total"
                    ? option.totalPrice
                    : option.nightlyRate
                }
                onChange={(e) =>
                  patch(
                    index,
                    option.priceMode === "total" ? "totalPrice" : "nightlyRate",
                    e.target.value,
                  )
                }
              />
            </div>
            <Field label={`Inclusões da opção ${index + 1}`}>
              <textarea
                rows={2}
                placeholder="Café da manhã incluído. Cancelamento..."
                value={option.inclusions}
                onChange={(e) => patch(index, "inclusions", e.target.value)}
              />
            </Field>
            <div className="property-option-total">
              <strong>
                {total === null
                  ? "Preencha os dados da opção"
                  : new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency,
                    }).format(total)}
              </strong>
              <button
                type="button"
                className="text-button"
                onClick={() => onChange(options.filter((_, i) => i !== index))}
              >
                Remover opção {index + 1}
              </button>
            </div>
          </article>
        );
      })}
      <button
        type="button"
        className="secondary"
        onClick={() => onChange([...options, emptyPropertyOption()])}
      >
        Adicionar alternativa de hospedagem
      </button>
    </section>
  );
}
