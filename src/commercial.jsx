import React from "react";
import { isCommercial, commercialDefault } from "./commercial-model.js";
export { isCommercial, commercialDefault };
export function CommercialEditor({ value, onChange, ui }) {
  const { Field, Photo } = ui,
    c = value,
    patch = (key, val) => onChange({ ...c, [key]: val });
  const rowPatch = (g, r, key, val) =>
    patch(
      "groups",
      c.groups.map((group, i) =>
        i === g
          ? {
              ...group,
              rows: group.rows.map((row, j) =>
                j === r ? { ...row, [key]: val } : row,
              ),
            }
          : group,
      ),
    );
  return (
    <section className="form-section">
      <h3>Proposta comercial · paisagem</h3>
      <div className="form-grid">
        <Field
          label="Categoria do tarifário"
          value={c.category}
          onChange={(e) => patch("category", e.target.value)}
        />
        <Field
          label="Título do tarifário"
          value={c.title}
          onChange={(e) => patch("title", e.target.value)}
        />
        <Field
          label="Nome do parceiro"
          value={c.partnerName}
          onChange={(e) => patch("partnerName", e.target.value)}
        />
        <Field label="Logo do parceiro">
          <Photo
            value={c.partnerLogo}
            onChange={(v) => patch("partnerLogo", v)}
          />
        </Field>
      </div>
      <h4>Colunas de veículos</h4>
      <div className="form-grid">
        {c.columns.map((name, i) => (
          <Field
            key={i}
            label={`Categoria de veículo ${i + 1}`}
            value={name}
            required
            onChange={(e) =>
              patch(
                "columns",
                c.columns.map((x, j) => (j === i ? e.target.value : x)),
              )
            }
          />
        ))}
      </div>
      <button
        type="button"
        className="secondary"
        disabled={c.columns.length >= 8}
        onClick={() =>
          onChange({
            ...c,
            columns: [...c.columns, "Categoria"],
            groups: c.groups.map((g) => ({
              ...g,
              rows: g.rows.map((r) => ({ ...r, prices: [...r.prices, null] })),
            })),
          })
        }
      >
        Adicionar coluna
      </button>
      {c.groups.map((group, g) => (
        <article className="concierge-block" key={g}>
          <Field
            label={`Grupo de tarifas ${g + 1}`}
            value={group.title}
            onChange={(e) =>
              patch(
                "groups",
                c.groups.map((x, i) =>
                  i === g ? { ...x, title: e.target.value } : x,
                ),
              )
            }
          />
          {group.rows.map((row, r) => (
            <div key={r} className="commercial-row">
              <Field
                label={`Serviço ${g + 1}.${r + 1}`}
                value={row.label}
                required
                onChange={(e) => rowPatch(g, r, "label", e.target.value)}
              />
              <div className="form-grid four">
                {c.columns.map((name, i) => (
                  <Field
                    key={i}
                    label={`Tarifa ${g + 1}.${r + 1}.${i + 1} · ${name}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.prices[i] ?? ""}
                    onChange={(e) =>
                      rowPatch(
                        g,
                        r,
                        "prices",
                        c.columns.map((_, j) =>
                          j === i
                            ? e.target.value === ""
                              ? null
                              : Number(e.target.value)
                            : (row.prices[j] ?? null),
                        ),
                      )
                    }
                  />
                ))}
              </div>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  patch(
                    "groups",
                    c.groups.map((x, i) =>
                      i === g
                        ? { ...x, rows: x.rows.filter((_, j) => j !== r) }
                        : x,
                    ),
                  )
                }
              >
                Remover serviço {g + 1}.{r + 1}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="secondary"
            onClick={() =>
              patch(
                "groups",
                c.groups.map((x, i) =>
                  i === g
                    ? {
                        ...x,
                        rows: [
                          ...x.rows,
                          {
                            label: "Serviço",
                            prices: c.columns.map(() => null),
                          },
                        ],
                      }
                    : x,
                ),
              )
            }
          >
            Adicionar serviço ao grupo {g + 1}
          </button>
        </article>
      ))}
      <button
        type="button"
        className="secondary"
        onClick={() =>
          patch("groups", [
            ...c.groups,
            {
              title: "Grupo de serviços",
              rows: [{ label: "Serviço", prices: c.columns.map(() => null) }],
            },
          ])
        }
      >
        Adicionar grupo de tarifas
      </button>
      <h4>Catálogo de veículos</h4>
      {c.fleet.map((car, i) => (
        <article className="concierge-block" key={i}>
          <Field
            label={`Nome do veículo do catálogo ${i + 1}`}
            required
            value={car.name}
            onChange={(e) =>
              patch(
                "fleet",
                c.fleet.map((x, j) =>
                  j === i ? { ...x, name: e.target.value } : x,
                ),
              )
            }
          />
          <Field label={`Foto do veículo do catálogo ${i + 1}`}>
            <Photo
              value={car.image}
              onChange={(v) =>
                patch(
                  "fleet",
                  c.fleet.map((x, j) => (j === i ? { ...x, image: v } : x)),
                )
              }
            />
          </Field>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              patch(
                "fleet",
                c.fleet.filter((_, j) => j !== i),
              )
            }
          >
            Remover veículo {i + 1}
          </button>
        </article>
      ))}
      <button
        type="button"
        className="secondary"
        onClick={() =>
          patch("fleet", [...c.fleet, { name: "Veículo", image: "" }])
        }
      >
        Adicionar veículo ao catálogo
      </button>
      <Field label="Condições do tarifário">
        <textarea
          value={c.conditions}
          onChange={(e) => patch("conditions", e.target.value)}
        />
      </Field>
    </section>
  );
}
