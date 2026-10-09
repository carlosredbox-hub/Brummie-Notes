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
async function api(url, method = "GET", data) {
  const r = await fetch("/api" + url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
  const b = await r.json();
  if (!r.ok) {
    const error = new Error(b.error || "Não foi possível concluir.");
    error.status = r.status;
    throw error;
  }
  return b;
}
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
function Auth({ onLogin }) {
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="auth">
      <div className="auth-story">
        <div className="brand">
          brummie<span>DOCUMENTS</span>
        </div>
        <div>
          <span className="eyebrow">MENOS PLANILHAS. MAIS VIAGENS.</span>
          <h1>
            Um atendimento
            <br />
            excepcional começa
            <br />
            nos detalhes.
          </h1>
          <p>
            Da primeira proposta à confirmação do motorista.
            <br />
            Todos os seus documentos, em um só lugar.
          </p>
          <div className="auth-pills">
            <span>
              <ShieldCheck size={17} /> Espaço por empresa
            </span>
            <span>
              <Globe size={17} /> Português & inglês
            </span>
          </div>
        </div>
        <small>Documentos claros. Operação conectada.</small>
      </div>
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api(
              "/auth/" + (register ? "register" : "login"),
              "POST",
              Object.fromEntries(new FormData(e.target)),
            );
            await onLogin();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="eyebrow">BEM-VINDO À BRUMMIE</span>
        <h2>
          {register ? "Crie seu espaço de trabalho" : "Bom ter você por aqui."}
        </h2>
        <p>
          {register
            ? "Configure sua empresa e comece a emitir documentos."
            : "Entre para organizar sua próxima operação."}
        </p>
        {register && (
          <>
            <Field label="Seu nome" name="name" required />
            <Field label="Nome da empresa" name="company" required />
          </>
        )}
        <Field label="E-mail" type="email" name="email" required />
        <Field
          label="Senha"
          type="password"
          name="password"
          minLength={10}
          maxLength={256}
          required
          autoComplete={register ? "new-password" : "current-password"}
        />
        {register && <small>Mínimo de 10 caracteres.</small>}
        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={busy}>
          {busy ? "Aguarde…" : register ? "Criar conta" : "Entrar"}
          <ArrowRight size={17} />
        </button>
        <p className="auth-switch">
          {register ? "Já tem uma conta?" : "Primeiro acesso?"}{" "}
          <button
            type="button"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </form>
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
    [connected, setConnected] = useState(true);
  const polling = useRef(false);
  async function refresh(quiet = false) {
    if (quiet && polling.current) return;
    polling.current = true;
    try {
      const next = await api("/state");
      if (quiet) setState((current) => (current ? next : current));
      else setState(next);
      setConnected(true);
    } catch (error) {
      if (error.status === 401) setState(null);
      setConnected(false);
    } finally {
      polling.current = false;
      setLoaded(true);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (!state?.user?.id) return;
    const update = () => {
      if (!document.hidden) refresh(true);
    };
    const timer = setInterval(update, 10000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("online", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("online", update);
    };
  }, [state?.user?.id]);
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
  if (!state) return <Auth onLogin={refresh} />;
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
    dashboard: "Visão geral",
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
          brummie<span>DOCUMENTS</span>
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
            <small>Minha conta</small>
          </span>
          <button
            className="icon"
            title="Sair"
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
                ? "Sincronizado com o servidor"
                : "Sem conexão • dados não atualizados"}
            </span>
            <span className="avatar light">
              {state.user.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <div className="content">
          {!connected && (
            <div className="error" role="status">
              Sem conexão com o servidor. Seus dados serão atualizados quando a
              conexão voltar.
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
                  ? "Uma visão completa dos seus documentos e próximos atendimentos."
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
              brummie <span>DOCUMENTS</span>
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
    <form
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
    </form>
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
      <form
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
      </form>
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
        ? {
            ...initial,
            date: today(),
            due: today(),
            status: initial.type === "recibo" ? "Pago" : "Emitido",
          }
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
      <form
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
      </form>
    </Modal>
  );
}
function Preview({ d, onClose, onCopy, onStatus }) {
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
          Duplicar
        </button>
        <a className="primary" href={"/api/documents/" + d.id + "/pdf"}>
          <Download size={16} />
          Baixar PDF
        </a>
      </div>
      <div className="paper-wrap">
        <article className="paper" style={{ "--doc-color": c.color }}>
          <header>
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
