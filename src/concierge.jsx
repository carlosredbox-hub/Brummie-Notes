import React, { useState, useEffect } from "react";
import { brandProfiles, conciergeTypes } from "./document-branding.js";
import { reuseDocument } from "./reuse-document.js";
import { wifiQr } from "./qr.js";
import { guideSections, hotelTerms } from "./presets.js";
import { calculateOvertime, calculateInternal } from "../domain.js";
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const tomorrow = () =>
  new Date(Date.parse(today()) + 86400000).toISOString().slice(0, 10);
const item = () => ({
  description: "Experiência",
  quantity: 1,
  price: 0,
  extra: 0,
  date: today(),
  time: "",
  unit: "serviço",
  origin: "",
  destination: "",
  pax: 1,
  flight: "",
});
export function conciergeDefault(type) {
  return {
    type,
    brand:
      type === "guia"
        ? "realestate"
        : type === "hospedagem"
          ? "luxury"
          : "lines",
    language: "pt",
    currency: "BRL",
    client: type === "guia" ? "Hóspedes" : "",
    email: "",
    date: today(),
    due: today(),
    status: "Emitido",
    items: type === "proposta" ? [item()] : [],
    discount: 0,
    notes: "",
    driver: null,
    vehicle: null,
    showPrices: true,
    cover: { enabled: type !== "interno", title: "", place: "", dateLabel: "" },
    overtime: {
      baseHours: 10,
      ratePct: 10,
      days: [
        {
          date: today(),
          lines: [
            {
              vehicle: "Veículo",
              dailyRate: 0,
              quantity: 1,
              start: "09:00",
              end: "19:00",
              extraHours: "",
            },
          ],
        },
      ],
    },
    internal: {
      kind: "fechamento",
      partner: "",
      lines: [{ label: "Serviço", qty: 1, unit: 0 }],
    },
    attachments: [],
    guide: {
      title: "Bem-vindo à sua estadia",
      propertyCode: "",
      address: "",
      accessInstructions: "",
      wifi: { ssid: "", password: "", encryption: "WPA" },
      sections: guideSections.map((section) => ({ ...section, image: "" })),
      layout: "a4",
    },
    stay: {
      hotelName: "",
      hotelTaxId: "",
      hotelAddress: "",
      requester: "Brummie",
      guests: "",
      checkIn: today(),
      checkOut: tomorrow(),
      checkInTime: "15:00",
      checkOutTime: "12:00",
      rooms: [{ description: "Quarto", quantity: 1, nightlyRate: 0 }],
      payments: [],
      terms: hotelTerms.pt,
    },
    proposal: {
      title: "Uma experiência feita para você",
      venue: "",
      eventDate: today(),
      inclusions: "",
      paymentTerms: "",
      schedule: "",
    },
  };
}
export function ConciergeForm({ initial, type, state, onClose, onSave, ui }) {
  const { Modal, Field, Photo, LocalForm } = ui;
  const [d, setD] = useState(() => {
    const defaults = conciergeDefault(type);
    if (!initial) return defaults;
    const reused = reuseDocument(initial, today());
    return {
      ...defaults,
      ...reused,
      guide: {
        ...defaults.guide,
        ...reused.guide,
        wifi: { ...defaults.guide.wifi, ...reused.guide?.wifi },
      },
      stay: { ...defaults.stay, ...reused.stay },
      proposal: { ...defaults.proposal, ...reused.proposal },
      overtime: { ...defaults.overtime, ...reused.overtime },
    };
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [qr, setQr] = useState(null);
  const set = (key, value) => setD((current) => ({ ...current, [key]: value }));
  const patch = (key, field, value) =>
    setD((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value },
    }));
  const listPatch = (key, list, index, field, value) =>
    setD((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [list]: current[key][list].map((r, i) =>
          i === index ? { ...r, [field]: value } : r,
        ),
      },
    }));
  const field = (label, key, required = false, t = "text") => (
    <Field
      label={label}
      value={d[key] || ""}
      required={required}
      type={t}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const nested = (label, group, key, required = false, t = "text") => (
    <Field
      label={label}
      value={d[group]?.[key] || ""}
      required={required}
      type={t}
      onChange={(e) => patch(group, key, e.target.value)}
    />
  );
  const area = (label, group, key) => (
    <Field label={label}>
      <textarea
        rows={4}
        value={d[group]?.[key] || ""}
        onChange={(e) => patch(group, key, e.target.value)}
      />
    </Field>
  );
  useEffect(() => {
    let live = true;
    if (d.type === "guia")
      wifiQr(d.guide.wifi)
        .then((value) => live && setQr(value))
        .catch(() => live && setQr(null));
    return () => {
      live = false;
    };
  }, [
    d.type,
    d.guide?.wifi?.ssid,
    d.guide?.wifi?.password,
    d.guide?.wifi?.encryption,
  ]);
  const g = d.guide,
    s = d.stay,
    p = d.proposal;
  const nights =
    s?.checkIn && s?.checkOut
      ? Math.max(0, (Date.parse(s.checkOut) - Date.parse(s.checkIn)) / 86400000)
      : 0;
  let overtimeResult;
  try {
    if (d.type === "horas") overtimeResult = calculateOvertime(d.overtime);
  } catch {}
  let internalResult;
  try {
    if (d.type === "interno") internalResult = calculateInternal(d.internal);
  } catch {}
  const total =
    d.type === "interno"
      ? internalResult?.total || 0
      : d.type === "horas"
        ? overtimeResult?.total || 0
        : d.type === "hospedagem"
          ? s.rooms.reduce(
              (v, r) => v + Number(r.quantity) * Number(r.nightlyRate) * nights,
              0,
            )
          : d.items.reduce(
              (v, r) =>
                v + Number(r.quantity) * Number(r.price) + Number(r.extra || 0),
              0,
            ) - Number(d.discount || 0);
  const archives = state.records.filter(
    (r) => r.kind === "archive" && (d.type === "interno" || !r.confidential),
  );
  return (
    <Modal title={`Novo ${conciergeTypes[d.type]}`} onClose={onClose} wide>
      <LocalForm
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave(d);
          } catch (e) {
            setError(e.message);
            setBusy(false);
          }
        }}
      >
        <div className="modal-body concierge-editor">
          {d.type === "interno" && (
            <div className="import-warning">
              Interno — não enviar ao cliente. Demonstrativo editável, com dados
              preenchidos apenas neste dispositivo.
            </div>
          )}
          <div className="form-section">
            <h3>01 · Identidade & cliente</h3>
            <div className="form-grid three">
              <Field label="Marca do documento">
                <select
                  value={d.brand || "lines"}
                  onChange={(e) => set("brand", e.target.value)}
                >
                  {Object.entries(brandProfiles).map(([id, b]) => (
                    <option key={id} value={id}>
                      {state.company.brandProfiles?.[id]?.name || b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Idioma do documento">
                <select
                  value={d.language}
                  onChange={(e) => set("language", e.target.value)}
                >
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                </select>
              </Field>
              <Field label="Moeda">
                <select
                  value={d.currency}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  {["BRL", "USD", "EUR"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              {d.type !== "interno" &&
                field("Cliente / titular", "client", true)}
              {field("E-mail do cliente", "email", false, "email")}
              {field("Data de emissão", "date", true, "date")}
              {field("Validade", "due", true, "date")}
            </div>
          </div>
          {d.type === "guia" && (
            <>
              <div className="form-section">
                <h3>02 · Imóvel & acesso</h3>
                <div className="form-grid">
                  {nested("Título do guia", "guide", "title", true)}
                  {nested("Código do imóvel", "guide", "propertyCode")}
                  {nested("Endereço do imóvel", "guide", "address", true)}
                  <Field label="Layout do guia">
                    <select
                      value={g.layout}
                      onChange={(e) => patch("guide", "layout", e.target.value)}
                    >
                      <option value="a4">PDF A4 + HTML móvel</option>
                      <option value="mobile">Guia móvel + PDF A4</option>
                    </select>
                  </Field>
                </div>
                {area(
                  "Instruções de chegada e acesso",
                  "guide",
                  "accessInstructions",
                )}
                <Field label="Foto de capa do imóvel">
                  <Photo
                    value={g.coverImage}
                    onChange={(value) => patch("guide", "coverImage", value)}
                  />
                </Field>
              </div>
              <div className="form-section">
                <h3>03 · Wi-Fi com QR local</h3>
                <div className="form-grid three">
                  <Field label="Nome da rede Wi-Fi">
                    <input
                      value={g.wifi.ssid}
                      onChange={(e) =>
                        patch("guide", "wifi", {
                          ...g.wifi,
                          ssid: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Senha do Wi-Fi">
                    <input
                      value={g.wifi.password}
                      onChange={(e) =>
                        patch("guide", "wifi", {
                          ...g.wifi,
                          password: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Segurança do Wi-Fi">
                    <select
                      value={g.wifi.encryption}
                      onChange={(e) =>
                        patch("guide", "wifi", {
                          ...g.wifi,
                          encryption: e.target.value,
                        })
                      }
                    >
                      <option value="WPA">WPA / WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Sem senha</option>
                    </select>
                  </Field>
                </div>
                {qr && (
                  <img
                    src={qr}
                    className="wifi-qr"
                    alt="QR Wi-Fi gerado localmente"
                  />
                )}
                <p>
                  O QR é criado neste dispositivo. Preencha apenas os dados que
                  deseja compartilhar com seus hóspedes.
                </p>
              </div>
              <div className="form-section">
                <h3>04 · Seções do Home Guide</h3>
                {g.sections.map((section, index) => (
                  <div className="concierge-block" key={section.id}>
                    <Field label={`Título da seção ${index + 1}`}>
                      <input
                        required
                        value={section.title}
                        onChange={(e) =>
                          listPatch(
                            "guide",
                            "sections",
                            index,
                            "title",
                            e.target.value,
                          )
                        }
                      />
                    </Field>
                    <Field label={`Texto da seção ${index + 1}`}>
                      <textarea
                        required
                        rows={4}
                        value={section.text}
                        onChange={(e) =>
                          listPatch(
                            "guide",
                            "sections",
                            index,
                            "text",
                            e.target.value,
                          )
                        }
                      />
                    </Field>
                    <Field label={`Imagem da seção ${index + 1}`}>
                      <Photo
                        value={section.image}
                        onChange={(value) =>
                          listPatch("guide", "sections", index, "image", value)
                        }
                      />
                    </Field>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        patch(
                          "guide",
                          "sections",
                          g.sections.filter((_, i) => i !== index),
                        )
                      }
                    >
                      Remover seção
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    patch("guide", "sections", [
                      ...g.sections,
                      {
                        id: `section-${Date.now()}`,
                        title: "Nova seção",
                        text: "",
                        image: "",
                        icon: "home",
                      },
                    ])
                  }
                >
                  Adicionar seção
                </button>
              </div>
            </>
          )}
          {d.type === "hospedagem" && (
            <>
              <div className="form-section">
                <h3>02 · Hotel & estadia</h3>
                <div className="form-grid">
                  {nested("Nome do hotel", "stay", "hotelName", true)}
                  {nested("CNPJ do hotel", "stay", "hotelTaxId")}
                  {nested("Endereço do hotel", "stay", "hotelAddress")}
                  {nested("Solicitante", "stay", "requester")}
                  {nested("Check-in", "stay", "checkIn", true, "date")}
                  {nested("Check-out", "stay", "checkOut", true, "date")}
                  {nested(
                    "Hora de check-in",
                    "stay",
                    "checkInTime",
                    false,
                    "time",
                  )}
                  {nested(
                    "Hora de check-out",
                    "stay",
                    "checkOutTime",
                    false,
                    "time",
                  )}
                </div>
                {area("Hóspedes / composição", "stay", "guests")}
                <div className="editor-summary">{nights} diária(s)</div>
              </div>
              <div className="form-section">
                <h3>03 · Quartos & valores</h3>
                {s.rooms.map((r, i) => (
                  <div className="concierge-block" key={i}>
                    <div className="form-grid three">
                      {[
                        ["Descrição do quarto", "description", "text"],
                        ["Quantidade de quartos", "quantity", "number"],
                        ["Valor da diária", "nightlyRate", "number"],
                      ].map(([label, key, t]) => (
                        <Field label={`${label} ${i + 1}`} key={key}>
                          <input
                            required
                            type={t}
                            min={key === "quantity" ? 1 : 0}
                            step={key === "quantity" ? 1 : 0.01}
                            value={r[key]}
                            onChange={(e) =>
                              listPatch("stay", "rooms", i, key, e.target.value)
                            }
                          />
                        </Field>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        patch(
                          "stay",
                          "rooms",
                          s.rooms.filter((_, n) => n !== i),
                        )
                      }
                    >
                      Remover quarto
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    patch("stay", "rooms", [
                      ...s.rooms,
                      { description: "Quarto", quantity: 1, nightlyRate: 0 },
                    ])
                  }
                >
                  Adicionar quarto
                </button>
              </div>
              <div className="form-section">
                <h3>04 · Pagamentos registrados</h3>
                {s.payments.map((r, i) => (
                  <div className="concierge-block" key={i}>
                    <div className="form-grid three">
                      {[
                        ["Descrição do pagamento", "description", "text"],
                        ["Valor pago", "amount", "number"],
                        ["Data do pagamento", "date", "date"],
                      ].map(([label, key, t]) => (
                        <Field label={`${label} ${i + 1}`} key={key}>
                          <input
                            required
                            type={t}
                            min="0"
                            step="0.01"
                            value={r[key]}
                            onChange={(e) =>
                              listPatch(
                                "stay",
                                "payments",
                                i,
                                key,
                                e.target.value,
                              )
                            }
                          />
                        </Field>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        patch(
                          "stay",
                          "payments",
                          s.payments.filter((_, n) => n !== i),
                        )
                      }
                    >
                      Remover pagamento
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    patch("stay", "payments", [
                      ...s.payments,
                      { description: "Sinal", amount: 0, date: today() },
                    ])
                  }
                >
                  Adicionar pagamento
                </button>
                {area("Condições do hotel / cancelamento", "stay", "terms")}
              </div>
            </>
          )}
          {d.type === "proposta" && (
            <>
              <div className="form-section">
                <h3>02 · Sua experiência</h3>
                <div className="form-grid">
                  {nested("Título da proposta", "proposal", "title", true)}
                  {nested("Local da experiência", "proposal", "venue")}
                  {nested(
                    "Data do evento",
                    "proposal",
                    "eventDate",
                    false,
                    "date",
                  )}
                </div>
                <Field label="Imagem de capa da proposta">
                  <Photo
                    value={p.coverImage}
                    onChange={(value) => patch("proposal", "coverImage", value)}
                  />
                </Field>
                {area("O que está incluído", "proposal", "inclusions")}
                {area("Programação / horários", "proposal", "schedule")}
                {area("Condições de pagamento", "proposal", "paymentTerms")}
              </div>
              <div className="form-section">
                <h3>03 · Itens selecionados para esta proposta</h3>
                <p>
                  Inclua os serviços escolhidos. Salve modelos separados para
                  opções alternativas, para evitar somá-las no mesmo total.
                </p>
                {d.items.map((r, i) => (
                  <div className="concierge-block" key={i}>
                    <div className="form-grid">
                      {[
                        ["Serviço", "description", "text"],
                        ["Quantidade", "quantity", "number"],
                        ["Preço", "price", "number"],
                        ["Adicional", "extra", "number"],
                      ].map(([label, key, t]) => (
                        <Field label={`${label} ${i + 1}`} key={key}>
                          <input
                            required
                            type={t}
                            min={key === "quantity" ? 0.01 : 0}
                            step="0.01"
                            value={r[key]}
                            onChange={(e) =>
                              set(
                                "items",
                                d.items.map((x, n) =>
                                  n === i ? { ...x, [key]: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </Field>
                      ))}
                    </div>
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
                      Remover item
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary"
                  onClick={() => set("items", [...d.items, item()])}
                >
                  Adicionar item da proposta
                </button>
                {field("Desconto", "discount", false, "number")}
              </div>
            </>
          )}
          {d.type === "horas" && (
            <div className="form-section">
              <h3>02 · Jornada & horas extras</h3>
              <div className="form-grid">
                <Field label="Horas contratadas">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={d.overtime.baseHours}
                    onChange={(e) =>
                      patch("overtime", "baseHours", e.target.value)
                    }
                  />
                </Field>
                <Field label="Percentual da diária por hora extra">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={d.overtime.ratePct}
                    onChange={(e) =>
                      patch("overtime", "ratePct", e.target.value)
                    }
                  />
                </Field>
              </div>
              <p>
                Fim anterior ou igual ao início representa término no dia
                seguinte. Horas calculadas são arredondadas para cima; uma
                exceção manual deve ser revisada.
              </p>
              {d.overtime.days.map((day, di) => (
                <div className="concierge-block" key={di}>
                  <Field label={`Data da jornada ${di + 1}`}>
                    <input
                      type="date"
                      required
                      value={day.date}
                      onChange={(e) =>
                        listPatch(
                          "overtime",
                          "days",
                          di,
                          "date",
                          e.target.value,
                        )
                      }
                    />
                  </Field>
                  {day.lines.map((line, li) => (
                    <div className="overtime-line" key={li}>
                      <div className="form-grid three">
                        {[
                          ["Veículo", "vehicle", "text"],
                          ["Diária por veículo", "dailyRate", "number"],
                          ["Quantidade de veículos", "quantity", "number"],
                          ["Início", "start", "time"],
                          ["Fim", "end", "time"],
                          [
                            "Horas extras manuais (opcional)",
                            "extraHours",
                            "number",
                          ],
                        ].map(([label, key, t]) => (
                          <Field
                            key={key}
                            label={`${label} ${di + 1}.${li + 1}`}
                          >
                            <input
                              required={key !== "extraHours"}
                              type={t}
                              min="0"
                              step="0.01"
                              value={line[key] ?? (key === "quantity" ? 1 : "")}
                              onChange={(e) => {
                                const days = d.overtime.days.map((x, n) =>
                                  n === di
                                    ? {
                                        ...x,
                                        lines: x.lines.map((r, j) =>
                                          j === li
                                            ? { ...r, [key]: e.target.value }
                                            : r,
                                        ),
                                      }
                                    : x,
                                );
                                patch("overtime", "days", days);
                              }}
                            />
                          </Field>
                        ))}
                      </div>
                      {overtimeResult?.days[di]?.lines[li] && (
                        <p>
                          {overtimeResult.days[di].lines[li].extraHours} hora(s)
                          extra(s)
                          {overtimeResult.days[di].lines[li].overridden
                            ? " · exceção manual"
                            : ""}{" "}
                          ·{" "}
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: d.currency,
                          }).format(overtimeResult.days[di].lines[li].amount)}
                        </p>
                      )}
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          patch(
                            "overtime",
                            "days",
                            d.overtime.days.map((x, n) =>
                              n === di
                                ? {
                                    ...x,
                                    lines: x.lines.filter((_, j) => j !== li),
                                  }
                                : x,
                            ),
                          )
                        }
                      >
                        Remover veículo
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      patch(
                        "overtime",
                        "days",
                        d.overtime.days.map((x, n) =>
                          n === di
                            ? {
                                ...x,
                                lines: [
                                  ...x.lines,
                                  {
                                    vehicle: "Veículo",
                                    dailyRate: 0,
                                    quantity: 1,
                                    start: "09:00",
                                    end: "19:00",
                                    extraHours: "",
                                  },
                                ],
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    Adicionar veículo à jornada
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      patch(
                        "overtime",
                        "days",
                        d.overtime.days.filter((_, n) => n !== di),
                      )
                    }
                  >
                    Remover dia
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  patch("overtime", "days", [
                    ...d.overtime.days,
                    {
                      date: today(),
                      lines: [
                        {
                          vehicle: "Veículo",
                          dailyRate: 0,
                          quantity: 1,
                          start: "09:00",
                          end: "19:00",
                          extraHours: "",
                        },
                      ],
                    },
                  ])
                }
              >
                Adicionar dia de jornada
              </button>
            </div>
          )}
          {d.type === "interno" && (
            <div className="form-section">
              <h3>02 · Demonstrativo interno</h3>
              <div className="form-grid">
                <Field label="Tipo de demonstrativo">
                  <select
                    value={d.internal.kind}
                    onChange={(e) => patch("internal", "kind", e.target.value)}
                  >
                    <option value="fechamento">Fechamento da operação</option>
                    <option value="repasse">Repasse / comissão</option>
                  </select>
                </Field>
                {nested("Parceiro / operação", "internal", "partner", true)}
              </div>
              {d.internal.lines.map((line, i) => (
                <div className="concierge-block" key={i}>
                  <Field label={`Descrição interna ${i + 1}`}>
                    <input
                      required
                      value={line.label}
                      onChange={(e) =>
                        listPatch(
                          "internal",
                          "lines",
                          i,
                          "label",
                          e.target.value,
                        )
                      }
                    />
                  </Field>
                  <Field label={`Modo de cálculo ${i + 1}`}>
                    <select
                      value={line.pct !== undefined ? "percent" : "unit"}
                      onChange={(e) =>
                        patch(
                          "internal",
                          "lines",
                          d.internal.lines.map((x, n) =>
                            n === i
                              ? {
                                  label: x.label,
                                  ...(e.target.value === "percent"
                                    ? { base: 0, pct: 0 }
                                    : { qty: 1, unit: 0 }),
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="unit">Quantidade × valor</option>
                      <option value="percent">Base × percentual</option>
                    </select>
                  </Field>
                  <div className="form-grid">
                    {(line.pct !== undefined
                      ? [
                          ["Base da comissão", "base"],
                          ["Percentual da comissão", "pct"],
                        ]
                      : [
                          ["Quantidade interna", "qty"],
                          ["Valor unitário interno", "unit"],
                        ]
                    ).map(([label, key]) => (
                      <Field key={key} label={`${label} ${i + 1}`}>
                        <input
                          required
                          type="number"
                          min={key === "qty" ? 0.01 : 0}
                          max={key === "pct" ? 100 : undefined}
                          step="0.01"
                          value={line[key]}
                          onChange={(e) =>
                            listPatch(
                              "internal",
                              "lines",
                              i,
                              key,
                              e.target.value,
                            )
                          }
                        />
                      </Field>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      patch(
                        "internal",
                        "lines",
                        d.internal.lines.filter((_, n) => n !== i),
                      )
                    }
                  >
                    Remover linha interna
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  patch("internal", "lines", [
                    ...d.internal.lines,
                    { label: "Serviço", qty: 1, unit: 0 },
                  ])
                }
              >
                Adicionar linha interna
              </button>
            </div>
          )}
          {d.type === "horas" &&
            field(
              "Total impresso no original (opcional)",
              "printedTotal",
              false,
              "number",
            )}
          <div className="form-section">
            <h3>Capa & versão do documento</h3>
            <label className="attachment-choice">
              <input
                type="checkbox"
                checked={!!d.cover.enabled}
                onChange={(e) => patch("cover", "enabled", e.target.checked)}
              />
              Incluir capa com foto e identidade da marca
            </label>
            <div className="form-grid">
              {nested("Título da capa (opcional)", "cover", "title")}
              {nested("Cidade / local da capa", "cover", "place")}
            </div>
            {d.type !== "guia" && (
              <label className="attachment-choice">
                <input
                  type="checkbox"
                  checked={d.showPrices !== false}
                  onChange={(e) => set("showPrices", e.target.checked)}
                />
                Mostrar valores no documento do cliente
              </label>
            )}
          </div>
          <div className="form-section">
            <h3>Documentos originais anexos</h3>
            <p>
              Os preços e condições presentes nos anexos originais não são
              ocultados pela opção de versão sem valores. Selecione PDFs
              importados na biblioteca. Eles serão acrescentados ao PDF final,
              preservando páginas e códigos do fornecedor.
            </p>
            {archives.length ? (
              archives.map((a) => (
                <label className="attachment-choice" key={a.id}>
                  <input
                    type="checkbox"
                    checked={d.attachments?.some((x) => x.id === a.id) || false}
                    onChange={(e) =>
                      set(
                        "attachments",
                        e.target.checked
                          ? [
                              ...(d.attachments || []),
                              { id: a.id, name: a.name },
                            ]
                          : (d.attachments || []).filter((x) => x.id !== a.id),
                      )
                    }
                  />
                  {a.name}
                </label>
              ))
            ) : (
              <p>Importe um PDF anterior para disponibilizar anexos.</p>
            )}
          </div>
          <Field label="Observações adicionais">
            <textarea
              rows={3}
              value={d.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
          {d.type !== "guia" && (
            <div className="editor-summary">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: d.currency,
              }).format(Number.isFinite(total) ? total : 0)}
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <span>Conteúdo reutilizável · PDF pronto para o cliente</span>
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Preparando…" : "Gerar documento"}
          </button>
        </div>
      </LocalForm>
    </Modal>
  );
}

export function ConciergePaper({ d }) {
  const en = d.language === "en",
    c = d.company;
  const [qr, setQr] = useState(null);
  useEffect(() => {
    let live = true;
    if (d.type === "guia") wifiQr(d.guide.wifi).then((q) => live && setQr(q));
    return () => {
      live = false;
    };
  }, [d.id]);
  const money = (n) =>
    new Intl.NumberFormat(en ? "en-US" : "pt-BR", {
      style: "currency",
      currency: d.currency,
    }).format(n || 0);
  const g = d.guide,
    s = d.stay,
    p = d.proposal,
    o = d.overtime;
  return (
    <article
      className="paper concierge-paper"
      style={{ "--doc-color": c.color }}
    >
      <header className="concierge-paper-head">
        <div>
          <small>{c.name}</small>
          <h1>
            {d.cover?.title ||
              (d.type === "guia"
                ? g.title
                : d.type === "hospedagem"
                  ? s.hotelName
                  : d.type === "proposta"
                    ? p.title
                    : en
                      ? "Extra hours"
                      : "Horas extras")}
          </h1>
          <p>{d.cover?.place || g?.address || s?.hotelAddress || p?.venue}</p>
        </div>
        {c.logo && <img src={c.logo} alt={c.name} />}
      </header>
      {d.type === "interno" && (
        <div className="import-warning">INTERNO — NÃO ENVIAR AO CLIENTE</div>
      )}
      <div className="concierge-paper-meta">
        <span>{d.client}</span>
        <span>
          {d.date} · {String(d.number).padStart(5, "0")}
        </span>
      </div>
      {d.type === "guia" && (
        <>
          {g.propertyCode && <p>{g.propertyCode}</p>}
          {g.coverImage && (
            <img className="concierge-cover" src={g.coverImage} alt="" />
          )}
          {g.accessInstructions && (
            <section>
              <h2>{en ? "Arrival & access" : "Chegada & acesso"}</h2>
              <p>{g.accessInstructions}</p>
            </section>
          )}
          {qr && (
            <section>
              <h2>Wi-Fi</h2>
              <p>{g.wifi.ssid}</p>
              {g.wifi.encryption !== "nopass" && (
                <p>
                  {en ? "Password" : "Senha"}: {g.wifi.password}
                </p>
              )}
              <img className="wifi-qr" src={qr} alt="QR Wi-Fi" />
            </section>
          )}
          {g.sections.map((section, i) => (
            <section key={section.id || i}>
              <h2>{section.title}</h2>
              {section.image && (
                <img className="concierge-cover" src={section.image} alt="" />
              )}
              <p>{section.text}</p>
            </section>
          ))}
        </>
      )}
      {d.type === "hospedagem" && (
        <>
          <section>
            <h2>{en ? "Your stay" : "Sua estadia"}</h2>
            <p>
              {s.checkIn} {s.checkInTime} → {s.checkOut} {s.checkOutTime}
            </p>
            <p>
              {s.nights} {en ? "nights" : "diárias"}
            </p>
            <p>{s.guests}</p>
            <p>
              {s.requester} {s.hotelTaxId}
            </p>
          </section>
          <section>
            <h2>{en ? "Rooms" : "Quartos"}</h2>
            {s.rooms.map((r, i) => (
              <p key={i}>
                {r.description} · {r.quantity} × {s.nights}{" "}
                {en ? "nights" : "diárias"}
                {d.showPrices !== false && (
                  <>
                    {" "}
                    × {money(r.nightlyRate)} ={" "}
                    <strong>{money(r.amount)}</strong>
                  </>
                )}
              </p>
            ))}
            {d.showPrices !== false && (
              <>
                <h2>{money(s.total)}</h2>
                <p>
                  {en ? "Payments" : "Pagamentos"}: {money(s.paid)} ·{" "}
                  {en ? "Balance" : "Saldo"}: {money(s.balance)}
                </p>
                {s.payments.map((payment, i) => (
                  <p key={i}>
                    {payment.description} · {payment.date} ·{" "}
                    {money(payment.amount)}
                  </p>
                ))}
              </>
            )}
          </section>
          {s.terms && (
            <section>
              <h2>{en ? "Terms" : "Condições"}</h2>
              <p>{s.terms}</p>
            </section>
          )}
        </>
      )}
      {d.type === "proposta" && (
        <>
          {p.coverImage && (
            <img className="concierge-cover" src={p.coverImage} alt="" />
          )}
          <section>
            <h2>{en ? "Your proposal" : "Sua proposta"}</h2>
            {d.items.map((item, i) => (
              <p key={i}>
                {item.description} · {item.quantity} {item.unit}
                {d.showPrices !== false && <> · {money(item.total)}</>}
              </p>
            ))}
            {d.showPrices !== false && <h2>{money(d.total)}</h2>}
          </section>
          {[
            ["O que está incluído", p.inclusions],
            ["Programação", p.schedule],
            ["Condições de pagamento", p.paymentTerms],
          ]
            .filter(([, v]) => v)
            .map(([title, value]) => (
              <section key={title}>
                <h2>{title}</h2>
                <p>{value}</p>
              </section>
            ))}
        </>
      )}
      {d.discrepancy !== 0 && d.type === "horas" && (
        <div className="import-warning">
          Diferença entre total calculado e total do original:{" "}
          {money(d.discrepancy)}. Revise antes de enviar.
        </div>
      )}
      {d.type === "horas" &&
        o.days.map((day, di) => (
          <section key={di}>
            <h2>{day.date}</h2>
            {day.lines.map((line, li) => (
              <div className="overtime-summary" key={li}>
                <h3>{line.vehicle}</h3>
                <p>
                  {line.start} → {line.end} · {line.extraHours}{" "}
                  {en ? "extra hours" : "horas extras"}
                  {line.overridden && " · exceção manual"}
                </p>
                {d.showPrices !== false && (
                  <strong>{money(line.amount)}</strong>
                )}
              </div>
            ))}
          </section>
        ))}
      {d.type === "horas" && d.showPrices !== false && (
        <h2>{money(d.total)}</h2>
      )}
      {d.type === "interno" && (
        <section>
          <h2>{d.internal.partner}</h2>
          {d.internal.lines.map((line, i) => (
            <p key={i}>
              {line.label} ·{" "}
              {line.pct !== undefined
                ? `${money(line.base)} × ${line.pct}%`
                : `${line.qty} × ${money(line.unit)}`}{" "}
              = <strong>{money(line.amount)}</strong>
            </p>
          ))}
          <h2>{money(d.internal.total)}</h2>
        </section>
      )}
      {d.notes && (
        <section>
          <h2>{en ? "Additional information" : "Observações"}</h2>
          <p>{d.notes}</p>
        </section>
      )}
      {d.attachments?.length > 0 && (
        <section>
          <h2>{en ? "Original attachments" : "Originais anexados"}</h2>
          {d.attachments.map((a) => (
            <p key={a.id}>{a.name}</p>
          ))}
        </section>
      )}
      <footer>
        {[c.address, c.phone, c.website].filter(Boolean).join(" · ")}
        <p>
          {en
            ? "Informational document. Not a tax invoice."
            : "Documento informativo. Não substitui nota fiscal."}
        </p>
      </footer>
    </article>
  );
}

export function DocumentCoverPreview({ d }) {
  if (!d.cover?.enabled || d.confidential) return null;
  const c = d.company,
    image = d.cover.image || d.guide?.coverImage || c.coverImage;
  const title =
    d.cover.title ||
    d.guide?.title ||
    d.proposal?.title ||
    conciergeTypes[d.type] ||
    {
      invoice: "Invoice",
      fatura: "Fatura",
      voucher: "Voucher de confirmação",
      nota: "Nota de atendimento",
      orcamento: "Orçamento",
      recibo: "Recibo",
    }[d.type];
  const dateLabel =
    d.cover.dateLabel ||
    (d.stay
      ? `${d.stay.checkIn} — ${d.stay.checkOut}`
      : d.proposal?.eventDate || d.date);
  return (
    <article className="document-cover" style={{ "--doc-color": c.color }}>
      <header>
        {c.logo ? <img src={c.logo} alt={c.name} /> : <h2>{c.name}</h2>}
      </header>
      {image && (
        <img className="document-cover-photo" src={image} alt="Foto de capa" />
      )}
      <div>
        <h1>{title}</h1>
        <p>{[d.cover.place, dateLabel].filter(Boolean).join(" • ")}</p>
        <h2>{d.client}</h2>
      </div>
    </article>
  );
}
