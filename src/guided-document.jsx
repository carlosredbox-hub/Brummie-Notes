import React, { useState, useRef, useEffect } from "react";
import { EditorPreview } from "./editor-preview.jsx";
import linesLogo from "./assets/lines-logo.png";

const steps = ["Cliente", "Serviços e fotos", "Conferir"];
export function GuidedDocument({
  draft: d,
  onChange: setD,
  state,
  ui,
  onClose,
  onSave,
  onFull,
}) {
  const { Modal, Field, Photo, LocalForm } = ui;
  const [step, setStep] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const body = useRef(null);
  useEffect(() => {
    body.current?.scrollTo(0, 0);
    body.current?.querySelector("h3")?.focus();
  }, [step]);
  const set = (key, value) => setD({ ...d, [key]: value });
  const item = (index, key, value) =>
    set(
      "items",
      d.items.map((x, i) => (i === index ? { ...x, [key]: value } : x)),
    );
  const close = () => {
    if (
      window.confirm(
        "Descartar esta edição? Os dados ainda não finalizados serão perdidos.",
      )
    )
      onClose();
  };
  const financial = !["nota", "voucher"].includes(d.type);
  return (
    <Modal title="Criar com ajuda" onClose={close} wide>
      <LocalForm
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (step < 2) {
            setStep(step + 1);
            return;
          }
          setBusy(true);
          try {
            await onSave(d);
          } catch (e) {
            setError(e.message);
            setBusy(false);
          }
        }}
      >
        <div className="modal-body guided-body" ref={body}>
          <div className="guided-heading">
            <img src={linesLogo} alt="Brummie Lines" />
            <span>
              Passo {step + 1} de 3
            </span>
          </div>
          <ol className="guided-progress" aria-label="Etapas da criação">
            {steps.map((name, i) => (
              <li
                key={name}
                aria-current={step === i ? "step" : undefined}
                className={i <= step ? "active" : ""}
              >
                <span>{i < step ? "✓" : i + 1}</span>
                {name}
              </li>
            ))}
          </ol>
          {step === 0 && (
            <section className="form-section">
              <h3 tabIndex={-1}>Para quem vamos preparar o documento?</h3>
              <p>
                Comece pelo nome. Os outros dados são opcionais e podem ser
                preenchidos depois.
              </p>
              <Field
                label="Nome do cliente"
                required
                value={d.client}
                placeholder="Ex.: Maria Souza ou Empresa ABC"
                onChange={(e) => set("client", e.target.value)}
              />
              {state.records.filter((x) => x.kind === "client").length > 0 && (
                <details>
                  <summary>Usar um cliente já salvo</summary>
                  <div className="guided-choices">
                    {state.records
                      .filter((x) => x.kind === "client")
                      .map((x) => (
                        <button
                          key={x.id}
                          type="button"
                          onClick={() =>
                            setD({
                              ...d,
                              client: x.name,
                              email: x.email || "",
                              clientTaxId: x.taxId || "",
                              clientAddress: x.address || "",
                            })
                          }
                        >
                          {x.name}
                        </button>
                      ))}
                  </div>
                </details>
              )}
              <fieldset className="guided-language">
                <legend>Em qual idioma o cliente vai receber?</legend>
                {[
                  ["pt", "Português"],
                  ["en", "English"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={d.language === id}
                    onClick={() => set("language", id)}
                  >
                    {label}
                  </button>
                ))}
              </fieldset>
              <details>
                <summary>Adicionar e-mail, documento e datas</summary>
                <div className="form-grid">
                  {[
                    ["email", "E-mail", "email"],
                    ["clientTaxId", "CPF / CNPJ", "text"],
                    ["date", "Data de emissão", "date"],
                    ["due", "Validade / vencimento", "date"],
                  ].map(([key, label, type]) => (
                    <Field
                      key={key}
                      label={label}
                      type={type}
                      value={d[key] || ""}
                      onChange={(e) => set(key, e.target.value)}
                    />
                  ))}
                </div>
              </details>
            </section>
          )}
          {step === 1 && (
            <section className="form-section">
              <h3 tabIndex={-1}>O que será oferecido ao cliente?</h3>
              <p>
                Preencha um serviço por cartão. Você pode incluir vários
                serviços e uma foto em cada um.
              </p>
              {d.items.map((x, i) => (
                <article className="guided-service" key={i}>
                  <h4>Serviço {i + 1}</h4>
                  <Field
                    label="Nome do serviço"
                    required
                    value={x.description}
                    placeholder="Ex.: Transfer aeroporto → hotel"
                    onChange={(e) => item(i, "description", e.target.value)}
                  />
                  <div className="form-grid">
                    <Field
                      label="Data do serviço"
                      type="date"
                      value={x.date}
                      onChange={(e) => item(i, "date", e.target.value)}
                    />
                    <Field
                      label="Horário (opcional)"
                      type="time"
                      value={x.time}
                      onChange={(e) => item(i, "time", e.target.value)}
                    />
                  </div>
                  <div className="form-grid">
                    <Field
                      label="Saída (opcional)"
                      value={x.origin}
                      onChange={(e) => item(i, "origin", e.target.value)}
                    />
                    <Field
                      label="Destino (opcional)"
                      value={x.destination}
                      onChange={(e) => item(i, "destination", e.target.value)}
                    />
                  </div>
                  {financial && (
                    <div className="form-grid">
                      <Field
                        label="Quantidade"
                        type="number"
                        min="1"
                        required
                        value={x.quantity}
                        onChange={(e) => item(i, "quantity", e.target.value)}
                      />
                      <Field
                        label="Valor por serviço (R$)"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={x.price}
                        onChange={(e) => item(i, "price", e.target.value)}
                      />
                    </div>
                  )}
                  <Photo
                    aria-label="Foto do serviço ou veículo (opcional)"
                    value={x.image}
                    onChange={(value) => item(i, "image", value)}
                  />
                  {d.items.length > 1 && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        set(
                          "items",
                          d.items.filter((_, n) => n !== i),
                        )
                      }
                    >
                      Remover serviço {i + 1}
                    </button>
                  )}
                </article>
              ))}
              <button
                type="button"
                className="secondary guided-add"
                onClick={() =>
                  set("items", [
                    ...d.items,
                    {
                      ...d.items[0],
                      description: "",
                      image: "",
                      origin: "",
                      destination: "",
                      price: 0,
                      extra: 0,
                      quantity: 1,
                    },
                  ])
                }
              >
                + Adicionar outro serviço
              </button>
              <details>
                <summary>Motorista, veículo e instruções ao cliente</summary>
                <div className="form-grid">
                  {[
                    ["driver", "Motorista"],
                    ["vehicle", "Veículo"],
                  ].map(([key, label]) => (
                    <Field label={label} key={key}>
                      <select
                        value={d[key]?.id || ""}
                        onChange={(e) =>
                          set(
                            key,
                            state.records.find(
                              (x) => x.id === e.target.value,
                            ) || null,
                          )
                        }
                      >
                        <option value="">Não incluir</option>
                        {state.records
                          .filter((x) => x.kind === key)
                          .map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name} {x.plate || ""}
                            </option>
                          ))}
                      </select>
                    </Field>
                  ))}
                </div>
                <Field label="Instruções ao cliente">
                  <textarea
                    value={d.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Field>
                <p>
                  Para cadastrar nome, idiomas, placa e fotos novos, use a
                  edição completa abaixo.
                </p>
              </details>
            </section>
          )}
          {step === 2 && (
            <section>
              <h3 tabIndex={-1}>Confira antes de finalizar</h3>
              <p>
                Cliente: <strong>{d.client}</strong> • {d.items.length}{" "}
                serviço(s) • {d.language === "en" ? "English" : "Português"}
              </p>
              <p>
                Abra a prévia para verificar fotos, rodapés e todas as páginas.
                Se quiser corrigir algo, use Voltar.
              </p>
              <EditorPreview
                compact
                autoPreview
                draft={d}
                company={state.company}
                onChange={setD}
              />
            </section>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="text-button" onClick={onFull}>
            Preciso de mais opções → Abrir edição completa
          </button>
        </div>
        <div className="modal-actions guided-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => (step ? setStep(step - 1) : close())}
          >
            {step ? "Voltar" : "Cancelar"}
          </button>
          <button className="primary" disabled={busy}>
            {busy
              ? "Preparando…"
              : step === 2
                ? "Finalizar documento"
                : step === 0
                  ? "Continuar para serviços"
                  : "Conferir documento"}
          </button>
        </div>
      </LocalForm>
    </Modal>
  );
}
