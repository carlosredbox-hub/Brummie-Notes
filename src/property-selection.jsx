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
      <h3>03 · Alternativas e experiências</h3>
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
            <details>
              <summary>Fotos complementares</summary>
              {(option.images || []).map((image, i) => (
                <div key={i}>
                  <Field label={`Foto complementar ${index + 1}.${i + 1}`}>
                    <Photo
                      value={image}
                      onChange={(value) =>
                        patch(
                          index,
                          "images",
                          option.images.map((v, j) => (j === i ? value : v)),
                        )
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      patch(
                        index,
                        "images",
                        option.images.filter((_, j) => j !== i),
                      )
                    }
                  >
                    Remover foto
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  patch(index, "images", [...(option.images || []), ""])
                }
              >
                Adicionar foto complementar
              </button>
            </details>
            <div className="form-grid">
              <Field label={`Categoria da opção ${index + 1}`}>
                <select
                  value={option.kind || "property"}
                  onChange={(e) => patch(index, "kind", e.target.value)}
                >
                  <option value="property">Imóvel / hospedagem</option>
                  <option value="transport">Transporte</option>
                  <option value="yacht">Passeio náutico</option>
                </select>
              </Field>
              <Field label={`Qualificador de preço ${index + 1}`}>
                <select
                  value={option.priceQualifier || ""}
                  onChange={(e) =>
                    patch(index, "priceQualifier", e.target.value)
                  }
                >
                  <option value="">Valor informado</option>
                  <option value="from">A partir de</option>
                </select>
              </Field>
            </div>
            <details>
              <summary>
                Versão inglesa dos textos desta opção (opcional)
              </summary>
              <Field
                label={`Título em inglês da opção ${index + 1}`}
                value={option.titleEn || ""}
                onChange={(e) => patch(index, "titleEn", e.target.value)}
              />
              <Field label={`Descrição em inglês da opção ${index + 1}`}>
                <textarea
                  value={option.descriptionEn || ""}
                  onChange={(e) =>
                    patch(index, "descriptionEn", e.target.value)
                  }
                />
              </Field>
              <Field label={`Inclusões em inglês da opção ${index + 1}`}>
                <textarea
                  value={option.inclusionsEn || ""}
                  onChange={(e) => patch(index, "inclusionsEn", e.target.value)}
                />
              </Field>
              <Field
                label={`Período em inglês da opção ${index + 1}`}
                value={option.periodEn || ""}
                onChange={(e) => patch(index, "periodEn", e.target.value)}
              />
              <p>
                Em English, os textos ingleses preenchidos são usados; campos
                vazios preservam o original.
              </p>
            </details>
            <div className="form-grid four">
              <Field
                label={`Código do imóvel ${index + 1}`}
                value={option.propertyCode || ""}
                onChange={(e) => patch(index, "propertyCode", e.target.value)}
              />
              <Field
                label={`Suítes da opção ${index + 1}`}
                type="number"
                min="0"
                step="1"
                value={option.suites || ""}
                onChange={(e) => patch(index, "suites", e.target.value)}
              />
              <Field
                label={`Banheiros da opção ${index + 1}`}
                type="number"
                min="0"
                step="0.1"
                value={option.bathrooms || ""}
                onChange={(e) => patch(index, "bathrooms", e.target.value)}
              />
              <Field
                label={`Período da opção ${index + 1}`}
                value={option.period || ""}
                onChange={(e) => patch(index, "period", e.target.value)}
              />
            </div>
            <Field
              label={`Link do imóvel ${index + 1}`}
              type="url"
              value={option.link || ""}
              onChange={(e) => patch(index, "link", e.target.value)}
            />
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
                  <option value="onrequest">
                    Sob consulta / valor não informado
                  </option>
                  <option value="total">Total informado para a estadia</option>
                </select>
              </Field>
              {option.priceMode !== "onrequest" && (
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
                      option.priceMode === "total"
                        ? "totalPrice"
                        : "nightlyRate",
                      e.target.value,
                    )
                  }
                />
              )}
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
                  ? option.priceMode === "onrequest"
                    ? "Valor sob consulta"
                    : "Preencha os dados da opção"
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
