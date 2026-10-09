import { reuseDocument } from "./reuse-document.js";
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  FileText,
  Users,
  Car,
  UserRound,
  Settings,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Search,
  ChevronDown,
  Download,
  Check,
  CheckCircle2,
  Clock,
  LogOut,
  X,
  Trash2,
  Copy,
  Globe,
  Mail,
  Menu,
  Receipt,
  ShieldCheck,
  Plane,
  MoreHorizontal,
} from "lucide-react";
import "./style.css";
import logo from "./assets/icon.png";
import {
  localApi,
  documentPdf,
  download,
  importArchive,
  originalPdf,
  exportBackup,
  restoreBackup,
} from "./offline-store.js";
import { readPdf, suggestions } from "./pdf-import.js";
const TYPES = {
    invoice: "Invoice",
    fatura: "Fatura",
    voucher: "Voucher de confirmação",
    nota: "Nota de atendimento",
    orcamento: "Orçamento",
    recibo: "Recibo",
  },
  NAV = [
    ["dashboard", "Visão geral", LayoutDashboard],
    ["documents", "Documentos", FileText],
    ["client", "Clientes", Users],
    ["driver", "Motoristas", UserRound],
    ["vehicle", "Frota", Car],
    ["settings", "Configurações", Settings],
  ];
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const amount = (v, c = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: c }).format(
    v || 0,
  );
const date = (v) =>
  v ? new Date(v + "T12:00:00").toLocaleDateString("pt-BR") : "—";
const api = localApi;
function Field({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children ? (
        React.cloneElement(children, { "aria-label": label })
      ) : (
        <input aria-label={label} {...props} />
      )}
    </label>
  );
}
function Photo({ value, onChange }) {
  return (
    <label className="upload">
      {value ? <img src={value} /> : <Car size={24} />}
      <span>
        {value ? "Trocar foto" : "Adicionar foto"}
        <small>JPG ou PNG • até 2 MB</small>
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => {
          const f = e.target.files[0];
          if (!f) return;
          if (f.size > 2 * 1024 * 1024)
            return alert("Use uma foto de até 2 MB.");
          if (!["image/png", "image/jpeg"].includes(f.type))
            return alert("Use JPG ou PNG.");
          const r = new FileReader();
          r.onload = () => onChange(r.result);
          r.readAsDataURL(f);
        }}
      />
    </label>
  );
}
function LocalForm({ onSubmit, children, ...props }) {
  return (
    <form
      {...props}
      onSubmit={onSubmit}
      onClick={(event) => {
        const button = event.target.closest("button");
        if (
          !button ||
          button.type !== "submit" ||
          !event.currentTarget.contains(button)
        )
          return;
        // This app saves locally; no browser form navigation is needed.
        event.preventDefault();
        if (event.currentTarget.reportValidity()) onSubmit(event);
      }}
    >
      {children}
    </form>
  );
}
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className={"modal " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <div>
            <span className="eyebrow">BRUMMIE DOCUMENTS</span>
            <h2>{title}</h2>
          </div>
          <button className="icon" onClick={onClose} aria-label="Fechar">
            <X />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function App() {
  const [state, setState] = useState(null),
    [loaded, setLoaded] = useState(false),
    [page, setPage] = useState("dashboard"),
    [modal, setModal] = useState(null),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Todos"),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [connected, setConnected] = useState(true),
    [startupError, setStartupError] = useState("");
  const polling = useRef(false);
  async function refresh(quiet = false) {
    if (quiet && polling.current) return;
    polling.current = true;
    try {
      const next = await api("/state");
      if (quiet) setState((current) => (current ? next : current));
      else setState(next);
      setConnected(true);
      setStartupError("");
    } catch (error) {
      if (error.status === 401) setState(null);
      setConnected(false);
      setStartupError(
        error.message || "Não foi possível iniciar o aplicativo.",
      );
    } finally {
      polling.current = false;
      setLoaded(true);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  const notify = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 4000);
  };
  const done = async () => {
    setModal(null);
    await refresh();
    notify("Salvo com sucesso.");
  };
  if (!loaded) return <div className="loading">Preparando seu espaço…</div>;
  if (!state)
    return (
      <div className="empty">
        <h2>Não foi possível iniciar o aplicativo</h2>
        <p>{startupError}</p>
        <p>
          Abra o HTML em Chrome/Edge ou no app. Seus documentos precisam de
          acesso ao armazenamento do dispositivo.
        </p>
        <button className="primary" onClick={() => refresh()}>
          Tentar novamente
        </button>
      </div>
    );
  const docs = state.documents,
    records = state.records;
  const matches = (d) =>
    (filter === "Todos" || d.type === filter) &&
    (d.client + " " + TYPES[d.type] + " " + String(d.number).padStart(5, "0"))
      .toLowerCase()
      .includes(search.toLowerCase());
  const totals = {};
  for (const d of docs.filter(
    (d) =>
      ["invoice", "fatura"].includes(d.type) &&
      ["Emitido", "Pago"].includes(d.status),
  )) {
    const c = d.currency;
    totals[c] ??= { paid: 0, pending: 0 };
    totals[c][d.status === "Pago" ? "paid" : "pending"] += d.total;
  }
  const sum = (k) =>
    Object.keys(totals).length
      ? Object.entries(totals)
          .map(([c, v]) => amount(v[k], c))
          .join(" · ")
      : amount(0);
  const create = (type = "invoice") => setModal({ kind: "document", type });
  const titles = {
    dashboard: "Meu facilitador",
    templates: "Meus modelos",
    archives: "Biblioteca de PDFs",
    documents: "Documentos",
    client: "Clientes",
    driver: "Motoristas",
    vehicle: "Frota",
    settings: "Configurações",
  };
  const table = (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>DOCUMENTO</th>
            <th>CLIENTE</th>
            <th>EMISSÃO</th>
            <th>VALOR</th>
            <th>STATUS</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {docs
            .filter(matches)
            .slice(0, page === "dashboard" ? 5 : 1000)
            .map((d) => (
              <tr key={d.id}>
                <td>
                  <button
                    className="doc-link"
                    onClick={() => setModal({ kind: "preview", doc: d })}
                  >
                    <span className="doc-icon">
                      <FileText size={19} />
                    </span>
                    <span>
                      {TYPES[d.type]}
                      <small>BRM-{String(d.number).padStart(5, "0")}</small>
                    </span>
                  </button>
                </td>
                <td>
                  {d.client}
                  <small>
                    {d.items.length} serviço{d.items.length > 1 ? "s" : ""}
                  </small>
                </td>
                <td>{date(d.date)}</td>
                <td className="money">
                  {["nota", "voucher"].includes(d.type)
                    ? "—"
                    : amount(d.total, d.currency)}
                </td>
                <td>
                  <span className={"badge " + d.status}>
                    {d.status === "Pago" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <span className="dot" />
                    )}
                    {d.status}
                  </span>
                </td>
                <td>
                  <button
                    className="icon"
                    aria-label={"Abrir " + d.number}
                    onClick={() => setModal({ kind: "preview", doc: d })}
                  >
                    <ArrowUpRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {!docs.filter(matches).length && (
        <div className="empty">
          <FileText size={30} />
          <h3>
            {search
              ? "Nenhum documento encontrado"
              : "Seu próximo atendimento começa aqui"}
          </h3>
          <p>Crie uma invoice, proposta ou confirmação em poucos passos.</p>
          <button onClick={() => create()} className="primary">
            <Plus size={16} /> Criar documento
          </button>
        </div>
      )}
    </div>
  );
  return (
    <div className="shell">
      <aside className={mobile ? "open" : ""}>
        <div className="brand">
          <img className="brand-bird" src={logo} alt="Brummie Lines" />
          brummie<span>OFFLINE STUDIO</span>
        </div>
        <button className="workspace" onClick={() => setPage("settings")}>
          <span className="workspace-logo">
            {state.company.name.slice(0, 1)}
          </span>
          <span>
            {state.company.name}
            <small>Espaço de trabalho</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <span className="nav-label">PRINCIPAL</span>
        <nav>
          {NAV.slice(0, 2).map(([k, l, I]) => (
            <button
              key={k}
              className={page === k ? "active" : ""}
              onClick={() => {
                setPage(k);
                setSearch("");
                setMobile(false);
              }}
            >
              <I size={19} />
              {l}
              {k === "documents" && (
                <span className="nav-count">{docs.length}</span>
              )}
            </button>
          ))}
          <span className="nav-label">CADASTROS</span>
          <button
            className={page === "templates" ? "active" : ""}
            onClick={() => {
              setPage("templates");
              setMobile(false);
            }}
          >
            <Copy size={19} />
            Meus modelos
          </button>
          <button
            className={page === "archives" ? "active" : ""}
            onClick={() => {
              setPage("archives");
              setMobile(false);
            }}
          >
            <FileText size={19} />
            Biblioteca de PDFs
          </button>
          {NAV.slice(2, 5).map(([k, l, I]) => (
            <button
              key={k}
              className={page === k ? "active" : ""}
              onClick={() => {
                setPage(k);
                setMobile(false);
              }}
            >
              <I size={19} />
              {l}
            </button>
          ))}
          <span className="nav-label">ESPAÇO DE TRABALHO</span>
          <button
            className={page === "settings" ? "active" : ""}
            onClick={() => setPage("settings")}
          >
            <Settings size={19} />
            Configurações
          </button>
        </nav>
        <div className="sidebar-note">
          <span className="note-symbol">✦</span>
          <h4>Detalhes que fazem a diferença.</h4>
          <p>Envie a ficha do motorista e do veículo junto à confirmação.</p>
          <button onClick={() => create("nota")}>
            Criar nota de atendimento <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="profile">
          <span className="avatar">
            {state.user.name.slice(0, 2).toUpperCase()}
          </span>
          <span>
            {state.user.name}
            <small>Dados locais</small>
          </span>
          <button
            className="icon"
            title="Configurações locais"
            onClick={async () => {
              await api("/logout", "POST");
              setState(null);
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button
            className="icon mobile-menu"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Espaço de trabalho <span>/</span> <strong>{titles[page]}</strong>
          </div>
          <div className="top-right">
            <span className="system-status">
              <span />{" "}
              {connected
                ? state.storageMode === "session"
                  ? "Prévia • memória temporária"
                  : "Offline • salvo neste dispositivo"
                : "Armazenamento indisponível"}
            </span>
            <span className="avatar light">
              {state.user.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <div className="content">
          {state.storageMode === "session" && (
            <div className="import-warning" role="status">
              Modo de prévia: este visualizador bloqueou o armazenamento
              permanente. Você pode testar o app e gerar documentos. Exporte um
              backup antes de fechar; as alterações desta sessão serão perdidas
              ao recarregar.
            </div>
          )}
          {!connected && (
            <div className="error" role="status">
              Armazenamento local indisponível. Confira o espaço do dispositivo
              e exporte um backup.
            </div>
          )}
          <div className="page-head">
            <div>
              <div className="eyebrow">
                {page === "dashboard"
                  ? "SEU DIA, BEM ORGANIZADO"
                  : "DOCUMENTOS & OPERAÇÕES"}
              </div>
              <h1>
                {page === "dashboard"
                  ? `Olá, ${state.user.name.split(" ")[0]}.`
                  : titles[page]}
                {page === "dashboard" && (
                  <span className="greeting-dot">.</span>
                )}
              </h1>
              <p>
                {page === "dashboard"
                  ? "Seus documentos anteriores são o ponto de partida do próximo."
                  : page === "documents"
                    ? "Do orçamento ao recibo. Tudo organizado, do seu jeito."
                    : page === "settings"
                      ? "A identidade da sua empresa em cada documento."
                      : "Cadastros reutilizáveis para agilizar cada atendimento."}
              </p>
            </div>
            {page !== "settings" && (
              <button
                className="primary"
                onClick={() =>
                  ["client", "driver", "vehicle"].includes(page)
                    ? setModal({ kind: "record", type: page })
                    : create()
                }
              >
                <Plus size={18} />
                {["client", "driver", "vehicle"].includes(page)
                  ? "Novo cadastro"
                  : "Novo documento"}
              </button>
            )}
          </div>
          <div className="offline-tools">
            <button
              className="secondary"
              onClick={() => setModal({ kind: "import" })}
            >
              <Plus size={16} />
              Importar PDF anterior
            </button>
            <button
              className="secondary"
              onClick={async () => {
                try {
                  await exportBackup();
                  notify("Backup exportado.");
                } catch (e) {
                  notify(e.message);
                }
              }}
            >
              <Download size={16} />
              Exportar backup
            </button>
            <label className="secondary restore-label">
              Restaurar backup
              <input
                type="file"
                accept="application/json,.json"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  e.target.value = "";
                  if (
                    !file ||
                    !confirm(
                      "Restaurar substituirá os dados locais. Exporte um backup antes de continuar.",
                    )
                  )
                    return;
                  try {
                    await restoreBackup(file);
                    await refresh();
                    notify("Backup restaurado.");
                  } catch (e) {
                    notify(e.message);
                  }
                }}
              />
            </label>
            <small>Sem login. Sem servidor. Seus arquivos ficam aqui.</small>
          </div>
          {page === "templates" && (
            <div className="record-grid">
              {records
                .filter((r) => r.kind === "template")
                .map((r) => (
                  <article className="panel template-card" key={r.id}>
                    <div className="tile green">
                      <Copy />
                    </div>
                    <h3>{r.name}</h3>
                    <p>
                      {TYPES[r.content.type]} • {r.content.items.length}{" "}
                      serviço(s)
                    </p>
                    <small>{r.content.client || "Cliente a definir"}</small>
                    {r.content.referenceReview && (
                      <p className="import-warning">
                        {r.content.referenceReview}
                      </p>
                    )}
                    <button
                      className="primary"
                      onClick={() =>
                        setModal({
                          kind: "document",
                          type: r.content.type,
                          doc: r.content,
                        })
                      }
                    >
                      Usar modelo <ArrowRight size={16} />
                    </button>
                    <button
                      className="icon"
                      aria-label={"Excluir modelo " + r.name}
                      onClick={async () => {
                        if (confirm("Excluir este modelo?")) {
                          await api("/records/" + r.id, "DELETE");
                          await refresh();
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
            </div>
          )}
          {page === "archives" && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>PDFs anteriores, guardados localmente</h2>
                  <p>
                    O original é preservado. Os modelos usam os dados que você
                    revisou.
                  </p>
                </div>
              </div>
              {records
                .filter((r) => r.kind === "archive")
                .map((r) => (
                  <div className="archive-row" key={r.id}>
                    <FileText size={24} />
                    <div>
                      <strong>{r.name}</strong>
                      <small>
                        {new Date(r.created).toLocaleDateString("pt-BR")}
                      </small>
                    </div>
                    <button
                      className="secondary"
                      onClick={async () => {
                        try {
                          await originalPdf(r.id);
                        } catch (e) {
                          notify(e.message);
                        }
                      }}
                    >
                      Baixar original
                    </button>
                    {records
                      .filter(
                        (t) =>
                          t.kind === "template" &&
                          (t.sourceId === r.id || t.sourceIds?.includes(r.id)),
                      )
                      .map((t) => (
                        <button
                          key={t.id}
                          className="primary"
                          onClick={() =>
                            setModal({
                              kind: "document",
                              type: t.content.type,
                              doc: t.content,
                            })
                          }
                        >
                          Usar: {t.name} <Copy size={15} />
                        </button>
                      ))}
                  </div>
                ))}
              {!records.some((r) => r.kind === "archive") && (
                <div className="empty">
                  <FileText size={32} />
                  <h3>Seus PDFs também fazem parte da memória.</h3>
                  <p>
                    Importe um documento anterior para guardar o original e
                    criar um modelo.
                  </p>
                  <button
                    className="primary"
                    onClick={() => setModal({ kind: "import" })}
                  >
                    Importar PDF
                  </button>
                </div>
              )}
            </section>
          )}

          {page === "dashboard" && (
            <>
              <div className="stats">
                <Stat
                  label="DOCUMENTOS EMITIDOS"
                  value={docs.filter((d) => d.status !== "Rascunho").length}
                  sub="No seu espaço de trabalho"
                  icon={FileText}
                  color="green"
                />
                <Stat
                  label="A RECEBER"
                  value={sum("pending")}
                  sub="Invoices e faturas em aberto"
                  icon={Clock}
                  color="orange"
                />
                <Stat
                  label="RECEBIDO"
                  value={sum("paid")}
                  sub="Pagamentos confirmados"
                  icon={Receipt}
                  color="blue"
                />
                <Stat
                  label="CLIENTES CADASTRADOS"
                  value={records.filter((r) => r.kind === "client").length}
                  sub="Relacionamentos que continuam"
                  icon={Users}
                  color="purple"
                />
              </div>
              <section className="quick-section">
                <div className="section-title">
                  <h2>O que vamos preparar hoje?</h2>
                  <span>ESCOLHA UM DOCUMENTO</span>
                </div>
                <div className="quick-grid">
                  {[
                    [
                      "invoice",
                      "Invoice & fatura",
                      "Cobranças claras, em qualquer idioma.",
                      FileText,
                      "green",
                    ],
                    [
                      "voucher",
                      "Voucher de confirmação",
                      "Todos os detalhes de uma boa viagem.",
                      Plane,
                      "blue",
                    ],
                    [
                      "orcamento",
                      "Orçamento",
                      "Uma proposta à altura do seu serviço.",
                      Receipt,
                      "orange",
                    ],
                    [
                      "nota",
                      "Nota de atendimento",
                      "Motorista, veículo e tranquilidade.",
                      UserRound,
                      "purple",
                    ],
                  ].map(([t, l, s, I, c]) => (
                    <button
                      className="quick-card"
                      onClick={() => create(t)}
                      key={t}
                    >
                      <div className={"tile " + c}>
                        <I size={22} />
                      </div>
                      <ArrowUpRight className="quick-arrow" size={18} />
                      <h3>{l}</h3>
                      <p>{s}</p>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          {["dashboard", "documents"].includes(page) && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>
                    {page === "dashboard"
                      ? "Documentos recentes"
                      : "Todos os documentos"}{" "}
                    <span className="count">{docs.length}</span>
                  </h2>
                  <p>Acompanhe cada etapa do seu atendimento.</p>
                </div>
                {page === "dashboard" ? (
                  <button
                    className="text-button"
                    onClick={() => {
                      setPage("documents");
                      setFilter("Todos");
                    }}
                  >
                    Ver todos <ArrowRight size={15} />
                  </button>
                ) : (
                  <label className="search">
                    <Search size={17} />
                    <input
                      placeholder="Buscar cliente ou documento"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                )}
              </div>
              <div className="tabs">
                {[
                  ["Todos", "Todos"],
                  ["invoice", "Invoices"],
                  ["fatura", "Faturas"],
                  ["voucher", "Vouchers"],
                  ["orcamento", "Orçamentos"],
                  ["nota", "Notas"],
                  ["recibo", "Recibos"],
                ].map(([k, l]) => (
                  <button
                    className={filter === k ? "selected" : ""}
                    key={k}
                    onClick={() => setFilter(k)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {table}
            </section>
          )}
          {["client", "driver", "vehicle"].includes(page) && (
            <div className="record-grid">
              {records
                .filter((r) => r.kind === page)
                .map((r) => (
                  <article className="record-card" key={r.id}>
                    {r.photo ? (
                      <img className="record-photo" src={r.photo} />
                    ) : (
                      <div className="record-placeholder">
                        {page === "vehicle" ? (
                          <Car size={32} />
                        ) : (
                          <UserRound size={32} />
                        )}
                      </div>
                    )}
                    <div>
                      <h3>{r.name}</h3>
                      <p>
                        {r.languages ||
                          r.category ||
                          r.email ||
                          "Cadastro de cliente"}
                      </p>
                      <span className="badge Emitido">
                        {r.plate || r.phone || r.document || "Ativo"}
                      </span>
                      <button
                        className="icon delete"
                        aria-label={"Excluir " + r.name}
                        onClick={async () => {
                          if (
                            confirm(
                              "Excluir este cadastro? Documentos já emitidos serão preservados.",
                            )
                          ) {
                            await api("/records/" + r.id, "DELETE");
                            await refresh();
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              {!records.filter((r) => r.kind === page).length && (
                <div className="empty panel">
                  <Users size={32} />
                  <h3>Vamos começar seu cadastro?</h3>
                  <p>
                    Salve os dados uma vez e reutilize em todos os documentos.
                  </p>
                  <button
                    className="primary"
                    onClick={() => setModal({ kind: "record", type: page })}
                  >
                    <Plus size={16} /> Novo cadastro
                  </button>
                </div>
              )}
            </div>
          )}
          {page === "settings" && (
            <SettingsForm
              company={state.company}
              onSave={async (c) => {
                await api("/company", "PUT", c);
                await refresh();
                notify(
                  "Configurações salvas. Novos documentos usarão estes dados.",
                );
              }}
            />
          )}
          <footer className="page-footer">
            <span>
              brummie <span>OFFLINE STUDIO</span>
            </span>
            <small>Feito para levar seu atendimento mais longe.</small>
          </footer>
        </div>
      </main>
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {modal?.kind === "import" && (
        <ImportPdf
          onClose={() => setModal(null)}
          onSave={async (file, text, review) => {
            await importArchive(file, text, review);
            await done();
            setPage("templates");
          }}
        />
      )}
      {modal?.kind === "record" && (
        <RecordForm
          type={modal.type}
          onClose={() => setModal(null)}
          onSave={async (d) => {
            await api("/records/" + modal.type, "POST", d);
            await done();
          }}
        />
      )}
      {modal?.kind === "document" && (
        <DocForm
          initial={modal.doc}
          type={modal.type}
          state={state}
          onClose={() => setModal(null)}
          onSave={async (d) => {
            const saved = await api("/documents", "POST", d);
            await refresh();
            const full = await api("/state");
            setModal({
              kind: "preview",
              doc: full.documents.find((x) => x.id === saved.id),
            });
            notify("Documento criado. Seu PDF está pronto.");
          }}
        />
      )}
      {modal?.kind === "preview" && (
        <Preview
          d={modal.doc}
          onClose={() => setModal(null)}
          onCopy={() =>
            setModal({ kind: "document", type: modal.doc.type, doc: modal.doc })
          }
          onTemplate={async (name) => {
            if (!name?.trim()) return;
            try {
              await api("/records/template", "POST", {
                name: name.trim(),
                content: modal.doc,
              });
              await refresh();
              notify("Modelo salvo para reutilizar.");
            } catch (e) {
              notify(e.message);
            }
          }}
          onStatus={async (status) => {
            try {
              await api("/documents/" + modal.doc.id, "PATCH", { status });
              await refresh();
              setModal({ ...modal, doc: { ...modal.doc, status } });
            } catch (e) {
              notify(e.message);
            }
          }}
        />
      )}
    </div>
  );
}
function Stat({ label, value, sub, icon: I, color }) {
  return (
    <article className="stat">
      <div>
        <span>{label}</span>
        <div className={"stat-icon " + color}>
          <I size={18} />
        </div>
      </div>
      <h2>{value}</h2>
      <p>{sub}</p>
    </article>
  );
}
function SettingsForm({ company, onSave }) {
  const [c, setC] = useState(company),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const f = (key, label, type = "text") => (
    <Field
      label={label}
      value={c[key] || ""}
      type={type}
      onChange={(e) => setC({ ...c, [key]: e.target.value })}
    />
  );
  return (
    <LocalForm
      className="panel form-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave(c);
          setError("");
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Identidade da empresa</h2>
      <p>Os dados ficam registrados em cada documento no momento da emissão.</p>
      <div className="form-grid">
        {f("name", "Nome da empresa")}
        {f("email", "E-mail", "email")}
        {f("phone", "Telefone")}
        {f("website", "Website")}
        {f("address", "Endereço")}
        {f("color", "Cor dos documentos", "color")}
      </div>
      <Field label="Dados de pagamento">
        <textarea
          value={c.payment || ""}
          onChange={(e) => setC({ ...c, payment: e.target.value })}
          placeholder="Beneficiário, banco, agência, conta e chave PIX"
        />
      </Field>
      <Field label="Condições gerais">
        <textarea
          value={c.terms || ""}
          onChange={(e) => setC({ ...c, terms: e.target.value })}
        />
      </Field>
      {error && <div className="error">{error}</div>}
      <button className="primary" disabled={busy}>
        <Check size={17} />
        Salvar configurações
      </button>
    </LocalForm>
  );
}
function RecordForm({ type, onClose, onSave }) {
  const [d, setD] = useState({
      name: "",
      languages: "Português, Inglês",
      category: "Sedan Executivo",
      photo: "",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const f = (key, label, required = false) => (
    <Field
      label={label}
      required={required}
      value={d[key] || ""}
      onChange={(e) => setD({ ...d, [key]: e.target.value })}
    />
  );
  return (
    <Modal
      title={
        "Novo " +
        { client: "cliente", driver: "motorista", vehicle: "veículo" }[type]
      }
      onClose={onClose}
    >
      <LocalForm
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave(d);
          } catch (e) {
            setError(e.message);
            setBusy(false);
          }
        }}
      >
        <div className="modal-body">
          {type !== "client" && (
            <Photo
              value={d.photo}
              onChange={(photo) => setD({ ...d, photo })}
            />
          )}
          <div className="form-grid">
            {f("name", type === "vehicle" ? "Modelo / Nome" : "Nome", true)}
            {type === "vehicle" ? (
              <>
                {f("plate", "Placa", true)}
                {f("category", "Categoria")}
                {f("capacity", "Capacidade (passageiros)")}
              </>
            ) : (
              <>
                {f("email", "E-mail")}
                {f("phone", "Telefone")}
                {type === "driver"
                  ? f("languages", "Idiomas")
                  : f("document", "CPF / CNPJ")}
              </>
            )}
          </div>
          {error && <div className="error">{error}</div>}
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" disabled={busy}>
            Salvar cadastro <Check size={16} />
          </button>
        </div>
      </LocalForm>
    </Modal>
  );
}
const newItem = () => ({
  description: "Transfer IN",
  date: today(),
  time: "",
  origin: "",
  destination: "",
  pax: 1,
  quantity: 1,
  unit: "serviço",
  price: 0,
  extra: 0,
  flight: "",
});
function DocForm({ initial, type, state, onClose, onSave }) {
  const [d, setD] = useState(
      initial
        ? reuseDocument(initial, today())
        : {
            type,
            language: "pt",
            currency: "BRL",
            client: "",
            email: "",
            date: today(),
            due: today(),
            status: type === "recibo" ? "Pago" : "Emitido",
            items: [newItem()],
            discount: 0,
            driver: null,
            vehicle: null,
            notes: "",
          },
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = (k, v) => setD({ ...d, [k]: v });
  const update = (idx, key, v) =>
    setD({
      ...d,
      items: d.items.map((item, i) =>
        i === idx ? { ...item, [key]: v } : item,
      ),
    });
  const total = Math.max(
    0,
    d.items.reduce(
      (s, i) => s + Number(i.quantity) * Number(i.price) + Number(i.extra),
      0,
    ) - Number(d.discount),
  );
  const f = (k, l, t = "text") => (
    <Field
      label={l}
      type={t}
      required={["client", "date", "due"].includes(k)}
      value={d[k]}
      onChange={(e) => set(k, e.target.value)}
    />
  );
  return (
    <Modal title="Novo documento" onClose={onClose} wide>
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
        <div className="modal-body">
          {d.referenceReview && (
            <p className="import-warning">
              Referência anterior: {d.referenceReview} As datas dos serviços
              foram reposicionadas a partir de hoje, preservando os intervalos.
            </p>
          )}
          <div className="form-section">
            <h3>
              <span>01</span> Documento & cliente
            </h3>
            <div className="form-grid three">
              <Field label="Tipo de documento">
                <select
                  value={d.type}
                  onChange={(e) =>
                    setD({
                      ...d,
                      type: e.target.value,
                      status: e.target.value === "recibo" ? "Pago" : "Emitido",
                    })
                  }
                >
                  {Object.entries(TYPES).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Idioma">
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
            </div>
            <Field label="Usar cliente cadastrado">
              <select
                value=""
                onChange={(e) => {
                  const r = state.records.find((r) => r.id === e.target.value);
                  if (r) setD({ ...d, client: r.name, email: r.email || "" });
                }}
              >
                <option value="">Selecionar cliente (opcional)</option>
                {state.records
                  .filter((r) => r.kind === "client")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="form-grid">
              {f("client", "Nome do cliente / Empresa")}
              {f("email", "E-mail do cliente", "email")}
              {f("date", "Data de emissão", "date")}
              {f(
                "due",
                d.type === "orcamento"
                  ? "Validade da proposta"
                  : "Vencimento / Data do serviço",
                "date",
              )}
            </div>
          </div>
          <div className="form-section">
            <h3>
              <span>02</span> Serviços
            </h3>
            {d.items.map((i, idx) => (
              <div className="service-form" key={idx}>
                <div className="service-label">
                  SERVIÇO {idx + 1}
                  {d.items.length > 1 && (
                    <button
                      type="button"
                      className="icon"
                      onClick={() =>
                        set(
                          "items",
                          d.items.filter((_, n) => n !== idx),
                        )
                      }
                      aria-label="Remover serviço"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="form-grid three">
                  <Field label="Serviço">
                    <input
                      list="services"
                      value={i.description}
                      required
                      onChange={(e) =>
                        update(idx, "description", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Data">
                    <input
                      type="date"
                      value={i.date}
                      required
                      onChange={(e) => update(idx, "date", e.target.value)}
                    />
                  </Field>
                  <Field label="Horário">
                    <input
                      type="time"
                      value={i.time}
                      onChange={(e) => update(idx, "time", e.target.value)}
                    />
                  </Field>
                  <Field label="Origem">
                    <input
                      value={i.origin}
                      onChange={(e) => update(idx, "origin", e.target.value)}
                    />
                  </Field>
                  <Field label="Destino">
                    <input
                      value={i.destination}
                      onChange={(e) =>
                        update(idx, "destination", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Voo / Referência">
                    <input
                      value={i.flight}
                      onChange={(e) => update(idx, "flight", e.target.value)}
                    />
                  </Field>
                </div>
                <div className="form-grid four">
                  <Field label="Passageiros">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      required
                      value={i.pax}
                      onChange={(e) => update(idx, "pax", e.target.value)}
                    />
                  </Field>
                  <Field label="Quantidade">
                    <input
                      type="number"
                      min="0.01"
                      max="10000"
                      step="0.01"
                      required
                      value={i.quantity}
                      onChange={(e) => update(idx, "quantity", e.target.value)}
                    />
                  </Field>
                  <Field label="Unidade">
                    <select
                      value={i.unit}
                      onChange={(e) => update(idx, "unit", e.target.value)}
                    >
                      {[
                        "serviço",
                        "passageiro",
                        "hora",
                        "dia",
                        "km",
                        "veículo",
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Preço unitário">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={i.price}
                      onChange={(e) => update(idx, "price", e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Adicional / Atendimento / Hora extra">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={i.extra}
                    onChange={(e) => update(idx, "extra", e.target.value)}
                  />
                </Field>
              </div>
            ))}
            <datalist id="services">
              {[
                "Transfer IN",
                "Transfer OUT",
                "Transfer entre cidades",
                "Disposição 05 horas",
                "Disposição 10 horas",
                "Disposição 24 horas",
                "Transfer de helicóptero",
                "Carro de bagagens",
                "Meet & Greet",
                "Guia bilíngue",
                "Van executiva",
                "Evento corporativo",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </datalist>
            <button
              type="button"
              className="text-button"
              onClick={() => set("items", [...d.items, newItem()])}
            >
              <Plus size={16} />
              Adicionar serviço
            </button>
          </div>
          <div className="form-section">
            <h3>
              <span>03</span> Motorista & veículo
            </h3>
            <p>
              Inclua as fotos e os dados que ajudam seu cliente a encontrar o
              atendimento.
            </p>
            <div className="form-grid">
              {[
                ["driver", "Motorista"],
                ["vehicle", "Veículo"],
              ].map(([k, l]) => (
                <Field label={l} key={k}>
                  <select
                    value={d[k]?.id || ""}
                    onChange={(e) =>
                      set(
                        k,
                        state.records.find((r) => r.id === e.target.value) ||
                          null,
                      )
                    }
                  >
                    <option value="">Não incluir</option>
                    {state.records
                      .filter((r) => r.kind === k)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.plate ? "• " + r.plate : ""}
                        </option>
                      ))}
                  </select>
                </Field>
              ))}
            </div>
            {!state.records.some((r) => r.kind === "driver") && (
              <small>
                Cadastre motoristas e veículos no menu para incluir nome,
                idiomas, placa e fotos.
              </small>
            )}
            <Field label="Observações / Instruções ao cliente">
              <textarea
                placeholder="Ponto de encontro, bagagem, tempo de espera, idiomas do atendimento…"
                value={d.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Field>
          </div>
          <div className="total-bar">
            <Field label="Desconto">
              <input
                type="number"
                min="0"
                step="0.01"
                value={d.discount}
                onChange={(e) => set("discount", e.target.value)}
              />
            </Field>
            <div>
              <small>
                {["nota", "voucher"].includes(d.type)
                  ? "VALORES NÃO APARECEM NESTE DOCUMENTO"
                  : "TOTAL DO DOCUMENTO"}
              </small>
              <h2>{amount(total, d.currency)}</h2>
            </div>
          </div>
          <Field label="Status">
            <select
              value={d.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {(d.type === "recibo"
                ? ["Pago"]
                : ["Emitido", "Rascunho", "Pago"]
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          {error && <div className="error">{error}</div>}
        </div>
        <div className="modal-actions">
          <span>
            <ShieldCheck size={15} />
            Documento informativo, sem validade fiscal
          </span>
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Gerando…" : "Gerar documento"}
            <ArrowRight size={16} />
          </button>
        </div>
      </LocalForm>
    </Modal>
  );
}
function Preview({ d, onClose, onCopy, onStatus, onTemplate }) {
  const [modelName, setModelName] = useState(TYPES[d.type] + " • " + d.client);
  const en = d.language === "en",
    financial = !["voucher", "nota"].includes(d.type),
    c = d.company;
  return (
    <Modal title="Seu documento está pronto" onClose={onClose} wide>
      <div className="preview-toolbar">
        <span className={"badge " + d.status}>{d.status}</span>
        <select
          aria-label="Alterar status"
          value={d.status}
          onChange={(e) => onStatus(e.target.value)}
        >
          {(d.type === "recibo"
            ? ["Pago"]
            : ["Rascunho", "Emitido", "Pago", "Cancelado"]
          ).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="secondary" onClick={onCopy}>
          <Copy size={15} />
          Reutilizar
        </button>
        <input
          aria-label="Nome para salvar modelo"
          placeholder="Nome do modelo"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
        />
        <button
          className="secondary"
          disabled={!modelName.trim()}
          onClick={() => onTemplate(modelName)}
        >
          <Copy size={15} />
          Salvar modelo
        </button>
        <button
          className="primary"
          onClick={async () => {
            try {
              download(
                await documentPdf(d.id),
                `${d.type}-${String(d.number).padStart(5, "0")}.pdf`,
              );
            } catch (e) {
              alert(e.message);
            }
          }}
        >
          <Download size={16} />
          Baixar PDF
        </button>
      </div>
      <div className="paper-wrap">
        <article className="paper" style={{ "--doc-color": c.color }}>
          <header>
            <img className="paper-logo" src={logo} alt="Brummie Lines" />
            <div className="paper-brand">
              {c.name}
              <small>PRIVATE TRANSPORT & EXPERIENCES</small>
            </div>
            <div>
              <h2>
                {en
                  ? {
                      invoice: "Invoice",
                      fatura: "Statement",
                      voucher: "Booking confirmation",
                      nota: "Service information",
                      orcamento: "Quotation",
                      recibo: "Payment receipt",
                    }[d.type]
                  : TYPES[d.type]}
              </h2>
              <span>BRM-{String(d.number).padStart(5, "0")}</span>
            </div>
          </header>
          <div className="paper-client">
            <div>
              <small>{en ? "PREPARED FOR" : "PREPARADO PARA"}</small>
              <h2>{d.client}</h2>
              <p>{d.email}</p>
            </div>
            <div>
              <small>{en ? "ISSUED" : "EMISSÃO"}</small>
              <p>{date(d.date)}</p>
              <small>
                {en ? "DUE / VALID UNTIL" : "VENCIMENTO / VALIDADE"}
              </small>
              <p>{date(d.due)}</p>
            </div>
          </div>
          {d.status === "Cancelado" && (
            <div className="error">{en ? "CANCELLED" : "CANCELADO"}</div>
          )}
          {d.items.map((i, n) => (
            <div className="paper-service" key={n}>
              <div className="service-index">
                {String(n + 1).padStart(2, "0")}
              </div>
              <div>
                <h3>{i.description}</h3>
                <p>
                  {date(i.date)} {i.time} • {i.origin || "—"} →{" "}
                  {i.destination || "—"}
                </p>
                <small>
                  {i.pax} {en ? "passengers" : "passageiros"} • {i.quantity}{" "}
                  {i.unit}
                  {i.flight && " • " + (en ? "Flight " : "Voo ") + i.flight}
                </small>
                {financial && (
                  <small>
                    {amount(i.price, d.currency)} × {i.quantity} +{" "}
                    {amount(i.extra, d.currency)}
                  </small>
                )}
              </div>
              {financial && <strong>{amount(i.total, d.currency)}</strong>}
            </div>
          ))}
          {financial && (
            <div className="paper-totals">
              <p>
                {en ? "Subtotal" : "Subtotal"}{" "}
                <span>{amount(d.subtotal, d.currency)}</span>
              </p>
              <p>
                {en ? "Discount" : "Desconto"}{" "}
                <span>{amount(d.discount, d.currency)}</span>
              </p>
              <h2>
                {en ? "Total" : "Valor total"}{" "}
                <span>{amount(d.total, d.currency)}</span>
              </h2>
            </div>
          )}
          {(d.driver || d.vehicle) && (
            <div className="paper-people">
              {[d.driver, d.vehicle].filter(Boolean).map((r, i) => (
                <div key={i}>
                  {r.photo && <img src={r.photo} />}
                  <small>
                    {r.kind === "driver"
                      ? en
                        ? "YOUR CHAUFFEUR"
                        : "SEU MOTORISTA"
                      : en
                        ? "YOUR VEHICLE"
                        : "SEU VEÍCULO"}
                  </small>
                  <h3>{r.name}</h3>
                  <p>{r.languages || r.category}</p>
                  <strong>{r.plate || r.phone}</strong>
                </div>
              ))}
            </div>
          )}
          {d.notes && (
            <div className="paper-note">
              <small>
                {en ? "SERVICE INFORMATION" : "INFORMAÇÕES DO ATENDIMENTO"}
              </small>
              <p>{d.notes}</p>
            </div>
          )}
          {financial && c.payment && (
            <div className="paper-note">
              <small>{en ? "PAYMENT DETAILS" : "DADOS DE PAGAMENTO"}</small>
              <p>{c.payment}</p>
            </div>
          )}
          {c.terms && (
            <div className="paper-note">
              <small>{en ? "TERMS" : "CONDIÇÕES"}</small>
              <p>{c.terms}</p>
            </div>
          )}
          <footer>
            {[c.address, c.phone, c.website].filter(Boolean).join(" • ")}
            <small>
              {en
                ? "Informational document. Not a tax invoice."
                : "Documento informativo. Não substitui nota fiscal."}
            </small>
          </footer>
        </article>
      </div>
    </Modal>
  );
}
createRoot(document.getElementById("root")).render(<App />);
function ImportPdf({ onClose, onSave }) {
  const [file, setFile] = useState(null),
    [text, setText] = useState(""),
    [d, setD] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="Memorizar um PDF anterior" onClose={onClose} wide>
      <LocalForm
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave(file, text, d);
          } catch (e) {
            setError(e.message);
            setBusy(false);
          }
        }}
      >
        <div className="modal-body">
          <p className="import-explanation">
            Importe o original, revise os dados sugeridos e salve um modelo.
            Seus arquivos não são enviados para nenhum servidor.
          </p>
          <Field label="PDF anterior (até 25 MB)">
            <input
              type="file"
              accept="application/pdf,.pdf"
              required
              onChange={async (e) => {
                const f = e.target.files[0];
                if (!f) return;
                setBusy(true);
                setError("");
                try {
                  const t = await readPdf(f),
                    s = suggestions(t);
                  setFile(f);
                  setText(t);
                  setD({
                    type: s.type,
                    client: s.client,
                    language: "pt",
                    currency: "BRL",
                    date: today(),
                    due: today(),
                    email: "",
                    status: "Rascunho",
                    discount: 0,
                    modelName: f.name.replace(/\.pdf$/i, ""),
                    items: [
                      {
                        ...newItem(),
                        description: s.description,
                        price: s.price,
                      },
                    ],
                    notes: "",
                  });
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </Field>
          {busy && <p>Lendo o PDF localmente…</p>}
          {d && (
            <>
              <div className="form-grid">
                <Field
                  label="Nome do modelo"
                  required
                  value={d.modelName}
                  onChange={(e) => setD({ ...d, modelName: e.target.value })}
                />
                <Field
                  label="Cliente (revise)"
                  required
                  value={d.client}
                  onChange={(e) => setD({ ...d, client: e.target.value })}
                />
                <Field label="Tipo">
                  <select
                    value={d.type}
                    onChange={(e) => setD({ ...d, type: e.target.value })}
                  >
                    {["invoice", "fatura", "voucher", "nota", "orcamento"].map(
                      (t) => (
                        <option value={t} key={t}>
                          {TYPES[t]}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
                <Field
                  label="Valor sugerido (revise)"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={d.items[0].price}
                  onChange={(e) =>
                    setD({
                      ...d,
                      items: [{ ...d.items[0], price: e.target.value }],
                    })
                  }
                />
              </div>
              <Field
                label="Serviço / descrição"
                required
                value={d.items[0].description}
                onChange={(e) =>
                  setD({
                    ...d,
                    items: [{ ...d.items[0], description: e.target.value }],
                  })
                }
              />
              <div className="import-warning">
                A extração sugere dados; não reconstrói automaticamente todas as
                linhas ou o layout. O maior valor encontrado é uma sugestão, que
                deve ser conferida. PDFs digitalizados sem texto podem ser
                guardados, mas exigem preenchimento manual.
              </div>
              <Field label="Texto extraído para conferir">
                <textarea
                  className="extracted-text"
                  value={
                    text ||
                    "Nenhum texto extraído. Preencha os campos acima manualmente."
                  }
                  readOnly
                />
              </Field>
            </>
          )}
          {error && <div className="error">{error}</div>}
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" disabled={!d || busy}>
            Guardar PDF e modelo <Check size={16} />
          </button>
        </div>
      </LocalForm>
    </Modal>
  );
}
