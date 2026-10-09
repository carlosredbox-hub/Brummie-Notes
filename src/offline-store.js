import { validateDoc } from "../domain.js";
import { makePdf } from "./offline-pdf.js";
const DB = "brummie-offline-v1";
let connection;
const id = () => crypto.randomUUID();
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const item = (description, price, quantity = 1, extra = 0) => ({
  description,
  price,
  quantity,
  extra,
  date: today(),
  time: "",
  origin: "",
  destination: "",
  pax: 1,
  flight: "",
  unit: "serviço",
});
const template = (name, type, items) => ({
  id: id(),
  kind: "template",
  name,
  content: {
    type,
    language: "pt",
    currency: "BRL",
    date: today(),
    due: today(),
    client: "",
    email: "",
    status: "Emitido",
    items,
    discount: 0,
    notes: "",
    driver: null,
    vehicle: null,
  },
});
function initial() {
  return {
    schema: 1,
    revision: 0,
    user: { id: "local", name: "Meu espaço", email: "" },
    company: {
      name: "Brummie Lines",
      color: "#0089cf",
      address: "",
      phone: "",
      website: "",
      payment: "",
      terms: "",
      logo: "",
    },
    documents: [],
    records: [
      template("Transfer executivo", "invoice", [item("Transfer IN", 400)]),
      template("Helicóptero • ida e volta", "invoice", [
        item("Transfer de helicóptero", 20000, 2, 9600),
      ]),
      template("Meet & Greet", "invoice", [
        item("Meet & Greet", 750),
        item("Meet & Greet • por passageiro", 1300, 2),
      ]),
      template("Confirmação de atendimento", "nota", [item("Transfer IN", 0)]),
      template("Disposição • 10 horas", "orcamento", [
        item("Disposição 10 horas", 1500),
      ]),
    ],
  };
}
async function database() {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore("workspace");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () =>
        reject(
          new Error(
            "Armazenamento local indisponível. Abra o HTML em Chrome/Edge ou no app.",
          ),
        );
    });
  return connection;
}
async function transaction(fn) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("workspace", "readwrite"),
      store = tx.objectStore("workspace"),
      req = store.get("data");
    let result;
    req.onsuccess = () => {
      try {
        const data = req.result || initial();
        result = fn(data);
        data.revision++;
        store.put(data, "data");
      } catch (e) {
        tx.abort();
        reject(e);
      }
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () =>
      reject(
        new Error(
          "Não foi possível salvar localmente. Verifique o espaço disponível e faça backup.",
        ),
      );
    tx.onabort = () => reject(new Error("Operação local cancelada."));
  });
}
export async function localApi(url, method = "GET", body) {
  return transaction((data) => {
    if (url === "/state")
      return {
        ...data,
        documents: data.documents.map(({ pdf, ...d }) => d),
        records: data.records.map(({ source, ...r }) => r),
      };
    if (url === "/company" && method === "PUT") {
      if (!body.name?.trim()) throw new Error("Informe a empresa.");
      data.company = body;
      return { ok: true };
    }
    if (url.startsWith("/records/") && method === "POST") {
      const kind = url.split("/")[2];
      if (
        !["client", "driver", "vehicle", "template"].includes(kind) ||
        !body.name?.trim()
      )
        throw new Error("Cadastro inválido.");
      const r = { ...body, id: id(), kind };
      data.records.push(r);
      return { id: r.id };
    }
    if (url.startsWith("/records/") && method === "DELETE") {
      data.records = data.records.filter((r) => r.id !== url.split("/")[2]);
      return { ok: true };
    }
    if (url === "/documents" && method === "POST") {
      const d = {
        ...validateDoc(body),
        id: id(),
        number: Math.max(0, ...data.documents.map((d) => d.number)) + 1,
        company: structuredClone(data.company),
        created: new Date().toISOString(),
      };
      data.documents.unshift(d);
      const known = data.records.some(
        (r) =>
          r.kind === "client" &&
          r.name.toLowerCase() === d.client.toLowerCase(),
      );
      if (!known)
        data.records.push({
          id: id(),
          kind: "client",
          name: d.client,
          email: d.email || "",
        });
      return { id: d.id, number: d.number };
    }
    if (url.startsWith("/documents/") && method === "PATCH") {
      const d = data.documents.find((d) => d.id === url.split("/")[2]);
      if (!d) throw new Error("Documento não encontrado.");
      validateDoc({ ...d, status: body.status });
      d.status = body.status;
      delete d.pdf;
      return { ok: true };
    }
    throw new Error("Operação local desconhecida.");
  });
}
export async function documentPdf(docId) {
  let doc = await transaction((data) =>
    data.documents.find((d) => d.id === docId),
  );
  if (!doc) throw new Error("Documento não encontrado.");
  if (doc.pdf) return doc.pdf;
  const blob = await makePdf(doc);
  await transaction((data) => {
    const current = data.documents.find((d) => d.id === docId);
    if (current?.status === doc.status) current.pdf = blob;
  });
  return blob;
}
export function download(blob, name) {
  if (window.BrummieAndroid?.saveFile) {
    const reader = new FileReader();
    reader.onload = () =>
      window.BrummieAndroid.saveFile(
        name,
        blob.type,
        reader.result.split(",")[1],
      );
    reader.readAsDataURL(blob);
    return;
  }
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function importArchive(file, text, review) {
  const source = new Blob([await file.arrayBuffer()], {
    type: "application/pdf",
  });
  return transaction((data) => {
    const archive = {
      id: id(),
      kind: "archive",
      name: file.name,
      text,
      source,
      created: new Date().toISOString(),
    };
    const content = validateDoc({ ...review, status: "Rascunho" });
    const t = {
      id: id(),
      kind: "template",
      name: review.modelName || file.name.replace(/\.pdf$/i, ""),
      content,
      sourceId: archive.id,
    };
    data.records.push(archive, t);
    if (
      !data.records.some(
        (r) =>
          r.kind === "client" &&
          r.name.toLowerCase() === review.client.toLowerCase(),
      )
    )
      data.records.push({
        id: id(),
        kind: "client",
        name: review.client,
        email: review.email || "",
      });
    return { ok: true };
  });
}
export async function originalPdf(archiveId) {
  const r = await transaction((data) =>
    data.records.find((r) => r.id === archiveId),
  );
  if (!r?.source) throw new Error("PDF original não encontrado.");
  download(r.source, r.name);
}
async function encode(value) {
  if (value instanceof Blob) {
    const bytes = new Uint8Array(await value.arrayBuffer());
    let s = "";
    for (let i = 0; i < bytes.length; i += 16384)
      s += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return { _blob: true, type: value.type, base64: btoa(s) };
  }
  if (Array.isArray(value)) return Promise.all(value.map(encode));
  if (value && typeof value === "object")
    return Object.fromEntries(
      await Promise.all(
        Object.entries(value).map(async ([k, v]) => [k, await encode(v)]),
      ),
    );
  return value;
}
function decode(value) {
  if (value?._blob) {
    const s = atob(value.base64);
    return new Blob([Uint8Array.from(s, (c) => c.charCodeAt(0))], {
      type: value.type,
    });
  }
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, decode(v)]),
    );
  return value;
}
export async function exportBackup() {
  const data = await transaction((d) => structuredClone(d));
  download(
    new Blob([JSON.stringify(await encode(data))], {
      type: "application/json",
    }),
    "Brummie-backup-" + today() + ".json",
  );
}
export async function restoreBackup(file) {
  if (file.size > 150 * 1024 * 1024) throw new Error("Backup acima de 150 MB.");
  const raw = JSON.parse(await file.text());
  if (
    raw.schema !== 1 ||
    !Array.isArray(raw.documents) ||
    !Array.isArray(raw.records) ||
    !raw.company?.name
  )
    throw new Error("Arquivo não é um backup Brummie válido.");
  for (const d of raw.documents) {
    validateDoc(d);
    if (!d.id || !d.company?.name || !Number.isInteger(d.number))
      throw new Error("Documento inválido no backup.");
  }
  const restored = decode(raw);
  return transaction((d) => {
    for (const k of Object.keys(d)) delete d[k];
    Object.assign(d, restored);
    return { ok: true };
  });
}
