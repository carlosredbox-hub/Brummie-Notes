import { validateDoc } from "../domain.js";

// Reference packs are supplied locally with the private HTML, never fetched.
export function applyReferencePack(data, pack) {
  if (!pack || data.importedReferencePacks?.includes(pack.id)) return;
  if (pack.schema !== 1 || !pack.id || !Array.isArray(pack.records))
    throw new Error("Biblioteca de referência inválida.");
  const ids = new Set();
  const records = pack.records.map((record) => {
    if (!record.id || ids.has(record.id))
      throw new Error("Referências duplicadas.");
    ids.add(record.id);
    if (record.kind === "template") validateDoc(record.content);
    if (record.kind === "archive") {
      if (
        record.source?.type !== "application/pdf" ||
        typeof record.source.base64 !== "string"
      )
        throw new Error("PDF de referência inválido.");
      const bytes = atob(record.source.base64);
      return {
        ...record,
        source: new Blob([Uint8Array.from(bytes, (c) => c.charCodeAt(0))], {
          type: "application/pdf",
        }),
      };
    }
    if (!["template", "client", "vehicle", "driver"].includes(record.kind))
      throw new Error("Cadastro de referência inválido.");
    return structuredClone(record);
  });
  const existing = new Set(data.records.map((r) => r.id));
  data.records.push(...records.filter((r) => !existing.has(r.id)));
  for (const key of ["address", "phone", "website"]) {
    if (!data.company[key] && pack.company?.[key])
      data.company[key] = pack.company[key];
  }
  data.importedReferencePacks = [
    ...(data.importedReferencePacks || []),
    pack.id,
  ];
}
