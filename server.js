import express from "express";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { types, validateDoc } from "./domain.js";
const app = express(),
  port = Number(process.env.PORT || 3000);
fs.mkdirSync(".data", { recursive: true });
const db = new DatabaseSync(process.env.DB_PATH || ".data/brummie.sqlite");
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS teams(id TEXT PRIMARY KEY,name TEXT,company TEXT);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,team TEXT REFERENCES teams(id),name TEXT,email TEXT UNIQUE,password TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user TEXT REFERENCES users(id),expires INTEGER);
CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,team TEXT,kind TEXT,data TEXT);
CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,team TEXT,number INTEGER,data TEXT,created TEXT,UNIQUE(team,number));`);
const id = () => randomBytes(16).toString("hex");
const hash = (p, s = randomBytes(16).toString("hex")) =>
  s + ":" + scryptSync(p, s, 64).toString("hex");
const verify = (p, h) => {
  const [s, v] = h.split(":");
  return timingSafeEqual(
    Buffer.from(v, "hex"),
    Buffer.from(hash(p, s).split(":")[1], "hex"),
  );
};
app.disable("x-powered-by");
app.use(express.json({ limit: "12mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});
const attempts = new Map();
app.post("/api/auth/:action", (req, res) => {
  try {
    const { name, email, password, company } = req.body,
      key = req.ip,
      now = Date.now();
    let a = attempts.get(key) || { n: 0, time: now };
    if (now - a.time > 600000) a = { n: 0, time: now };
    a.n++;
    attempts.set(key, a);
    if (a.n > 30)
      return res
        .status(429)
        .json({ error: "Aguarde alguns minutos para tentar novamente." });
    if (
      !email ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 10 ||
      password.length > 256
    )
      throw new Error("Use um e-mail válido e senha de 10 a 256 caracteres.");
    const normalized = email.toLowerCase().trim();
    let user;
    if (req.params.action === "register") {
      if (!name?.trim() || !company?.trim())
        throw new Error("Informe seu nome e empresa.");
      if (db.prepare("SELECT id FROM users WHERE email=?").get(normalized))
        throw new Error("Este e-mail já possui uma conta.");
      const team = id(),
        uid = id();
      db.exec("BEGIN");
      try {
        db.prepare("INSERT INTO teams VALUES (?,?,?)").run(
          team,
          company,
          JSON.stringify({
            name: company,
            color: "#0089cf",
            address: "",
            email: normalized,
            phone: "",
            website: "",
            payment: "",
            terms: "Cancelamento e espera conforme condições acordadas.",
          }),
        );
        db.prepare("INSERT INTO users VALUES (?,?,?,?,?)").run(
          uid,
          team,
          name,
          normalized,
          hash(password),
        );
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
      user = db.prepare("SELECT * FROM users WHERE id=?").get(uid);
    } else if (req.params.action === "login") {
      user = db.prepare("SELECT * FROM users WHERE email=?").get(normalized);
      if (!user || !verify(password, user.password))
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
    } else return res.sendStatus(404);
    const token = id();
    db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
      token,
      user.id,
      now + 7 * 86400000,
    );
    res.cookie("session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 7 * 86400000,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.use("/api", (req, res, next) => {
  const token = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("session="))
    ?.slice(8);
  req.user = db
    .prepare(
      "SELECT u.id,u.team,u.name,u.email FROM sessions s JOIN users u ON s.user=u.id WHERE s.token=? AND s.expires>?",
    )
    .get(token || "", Date.now());
  if (!req.user) return res.status(401).json({ error: "Entre na sua conta." });
  req.token = token;
  next();
});
app.post("/api/logout", (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token=?").run(req.token);
  res.clearCookie("session");
  res.json({ ok: true });
});
app.get("/api/state", (req, res) => {
  const team = req.user.team;
  res.json({
    user: req.user,
    company: JSON.parse(
      db.prepare("SELECT company FROM teams WHERE id=?").get(team).company,
    ),
    records: db
      .prepare("SELECT * FROM records WHERE team=?")
      .all(team)
      .map((r) => ({ ...JSON.parse(r.data), id: r.id, kind: r.kind })),
    documents: db
      .prepare("SELECT * FROM documents WHERE team=? ORDER BY number DESC")
      .all(team)
      .map((d) => ({
        ...JSON.parse(d.data),
        id: d.id,
        number: d.number,
        created: d.created,
      })),
  });
});
app.put("/api/company", (req, res) => {
  if (!req.body.name?.trim())
    return res.status(400).json({ error: "Informe a empresa." });
  db.prepare("UPDATE teams SET company=? WHERE id=?").run(
    JSON.stringify(req.body),
    req.user.team,
  );
  res.json({ ok: true });
});
app.post("/api/records/:kind", (req, res) => {
  if (
    !["client", "driver", "vehicle"].includes(req.params.kind) ||
    !req.body.name?.trim()
  )
    return res.status(400).json({ error: "Cadastro inválido." });
  const rid = id();
  db.prepare("INSERT INTO records VALUES (?,?,?,?)").run(
    rid,
    req.user.team,
    req.params.kind,
    JSON.stringify(req.body),
  );
  res.json({ id: rid });
});
app.delete("/api/records/:id", (req, res) => {
  db.prepare("DELETE FROM records WHERE id=? AND team=?").run(
    req.params.id,
    req.user.team,
  );
  res.json({ ok: true });
});
app.post("/api/documents", (req, res) => {
  try {
    const d = validateDoc(req.body),
      did = id();
    db.exec("BEGIN IMMEDIATE");
    try {
      const n = db
        .prepare(
          "SELECT COALESCE(MAX(number),0)+1 AS n FROM documents WHERE team=?",
        )
        .get(req.user.team).n;
      d.company = JSON.parse(
        db.prepare("SELECT company FROM teams WHERE id=?").get(req.user.team)
          .company,
      );
      db.prepare("INSERT INTO documents VALUES (?,?,?,?,?)").run(
        did,
        req.user.team,
        n,
        JSON.stringify(d),
        new Date().toISOString(),
      );
      db.exec("COMMIT");
      res.json({ id: did, number: n });
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.patch("/api/documents/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM documents WHERE id=? AND team=?")
    .get(req.params.id, req.user.team);
  if (!row) return res.sendStatus(404);
  if (!["Rascunho", "Emitido", "Pago", "Cancelado"].includes(req.body.status))
    return res.status(400).json({ error: "Status inválido." });
  const d = JSON.parse(row.data);
  if (d.type === "recibo" && req.body.status !== "Pago")
    return res
      .status(400)
      .json({ error: "Recibos mantêm o pagamento confirmado." });
  d.status = req.body.status;
  db.prepare("UPDATE documents SET data=? WHERE id=?").run(
    JSON.stringify(d),
    row.id,
  );
  res.json({ ok: true });
});
app.get("/api/documents/:id/pdf", (req, res) => {
  const row = db
    .prepare("SELECT * FROM documents WHERE id=? AND team=?")
    .get(req.params.id, req.user.team);
  if (!row) return res.sendStatus(404);
  const d = JSON.parse(row.data),
    en = d.language === "en",
    c = d.company,
    financial = ["invoice", "fatura", "orcamento", "recibo"].includes(d.type),
    money = (v) =>
      new Intl.NumberFormat(en ? "en-US" : "pt-BR", {
        style: "currency",
        currency: d.currency,
      }).format(v),
    num = String(row.number).padStart(5, "0");
  const pdf = new PDFDocument({ size: "A4", margin: 46, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${d.type}-${num}.pdf"`,
  );
  pdf.pipe(res);
  pdf.font("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
  const color = /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : "#0089cf";
  const line = (t, size = 10, col = "#243832") => {
    pdf
      .fillColor(col)
      .fontSize(size)
      .text(String(t || ""));
    pdf.moveDown(0.5);
  };
  const room = (h = 100) => {
    if (pdf.y + h > 750) pdf.addPage();
  };
  line(c.name, 25, color);
  line(
    en
      ? {
          invoice: "Invoice",
          fatura: "Statement",
          voucher: "Booking confirmation",
          nota: "Service information",
          orcamento: "Quotation",
          recibo: "Payment receipt",
        }[d.type]
      : types[d.type],
    20,
  );
  line(`#${num}  •  ${d.status}  •  ${d.date}`);
  if (d.status === "Cancelado")
    line(en ? "CANCELLED" : "CANCELADO", 18, "#b42b38");
  line(en ? "CLIENT" : "CLIENTE", 9, color);
  line(d.client, 15);
  line(d.email);
  line(`${en ? "Due / Valid until" : "Vencimento / Validade"}: ${d.due}`);
  pdf.moveDown();
  for (const item of d.items) {
    room(145);
    line(item.description, 13, color);
    line(
      `${item.date || d.date} ${item.time || ""}  •  ${item.origin || ""} → ${item.destination || ""}`,
    );
    line(
      `${en ? "Passengers" : "Passageiros"}: ${item.pax || 1}  •  ${item.unit || "serviço"}: ${item.quantity}`,
    );
    if (item.flight) line(`${en ? "Flight" : "Voo"}: ${item.flight}`);
    if (financial)
      line(
        `${money(item.price)} × ${item.quantity} + ${money(item.extra || 0)} = ${money(item.total)}`,
        11,
      );
  }
  if (financial) {
    room(120);
    line(`${en ? "Subtotal" : "Subtotal"}: ${money(d.subtotal)}`);
    line(`${en ? "Discount" : "Desconto"}: ${money(d.discount)}`);
    line(`${en ? "TOTAL" : "VALOR TOTAL"}  ${money(d.total)}`, 23, color);
    if (c.payment)
      line(`${en ? "Payment details" : "Dados de pagamento"}: ${c.payment}`);
  }
  const photo = (data, x, y, w, h) => {
    if (/^data:image\/(png|jpeg);base64,/.test(data || "")) {
      try {
        pdf.image(Buffer.from(data.split(",")[1], "base64"), x, y, {
          fit: [w, h],
        });
      } catch {}
    }
  };
  if (d.driver?.name) {
    room(185);
    line(en ? "YOUR CHAUFFEUR" : "SEU MOTORISTA", 12, color);
    const y = pdf.y;
    photo(d.driver.photo, 46, y, 80, 80);
    pdf.text(d.driver.name, 145, y);
    pdf.text(
      `${en ? "Languages" : "Idiomas"}: ${d.driver.languages || ""}`,
      145,
      y + 24,
    );
    pdf.text(d.driver.phone || "", 145, y + 48);
    pdf.y = y + 95;
    pdf.x = 46;
  }
  if (d.vehicle?.name) {
    room(195);
    line(en ? "YOUR VEHICLE" : "SEU VEÍCULO", 12, color);
    const y = pdf.y;
    photo(d.vehicle.photo, 46, y, 170, 110);
    pdf.text(d.vehicle.name, 235, y);
    pdf.text(
      `${en ? "Plate" : "Placa"}: ${d.vehicle.plate || ""}`,
      235,
      y + 24,
    );
    pdf.text(d.vehicle.category || "", 235, y + 48);
    pdf.y = y + 125;
    pdf.x = 46;
  }
  if (d.notes) {
    room(100);
    line(en ? "SERVICE NOTES" : "OBSERVAÇÕES", 10, color);
    line(d.notes);
  }
  if (c.terms) {
    room(100);
    line(en ? "Terms" : "Condições", 10, color);
    line(c.terms);
  }
  room(40);
  line(
    en
      ? "Informational document. Not a tax invoice."
      : "Documento informativo. Não substitui nota fiscal.",
    8,
    "#718079",
  );
  const pages = pdf.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    pdf.switchToPage(i);
    pdf
      .fontSize(8)
      .fillColor("#718079")
      .text(
        [c.address, c.phone, c.website].filter(Boolean).join(" • "),
        46,
        785,
        { width: 490, lineBreak: false },
      );
    pdf.text(`${i + 1}/${pages.count}`, 510, 770, { lineBreak: false });
  }
  pdf.end();
});
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Rota não encontrada." }),
);
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
app.use((err, req, res, next) => {
  console.error(err.message);
  if (!res.headersSent)
    res.status(500).json({ error: "Não foi possível concluir a operação." });
});
app.listen(port, "0.0.0.0", () => console.log(`Brummie listening on ${port}`));
