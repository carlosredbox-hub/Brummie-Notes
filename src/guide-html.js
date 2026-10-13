import sans from "./assets/fonts/OpenSans-Regular.ttf?inline";
import serif from "./assets/fonts/Cormorant-Regular.ttf?inline";
import { wifiQr } from "./qr.js";
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const photo = (src) =>
  /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=\s]+$/.test(src || "")
    ? src
    : "";
export async function makeGuideHtml(d) {
  const g = d.guide,
    c = d.company,
    en = d.language === "en",
    qr = await wifiQr(g.wifi),
    col = /^#[a-f0-9]{6}$/i.test(c.color || "") ? c.color : "#b67842";
  const html = `<!doctype html><html lang="${en ? "en" : "pt-BR"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(g.title)} · ${escape(c.name)}</title><style>@font-face{font-family:BrummieSans;src:url(${sans})}@font-face{font-family:BrummieSerif;src:url(${serif})}*{box-sizing:border-box}body{margin:0;background:#f5f3ed;color:#293a32;font:15px/1.75 BrummieSans,system-ui,sans-serif}main{max-width:820px;margin:0 auto;padding:30px 20px}header{padding:35px 25px;background:white;border-top:0;border-radius:4px 4px 18px 18px}h1{font:46px/1.15 BrummieSerif,Georgia,serif;margin:16px 0}h2{font:24px/1.4 BrummieSerif,Georgia,serif;color:${col};margin-top:0}.eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${col}}.content{white-space:pre-wrap;overflow-wrap:anywhere}section{padding:34px;background:#fff;margin-top:20px;border:0;border-radius:0}.cover,.section-photo{width:100%;max-height:360px;object-fit:cover;border-radius:10px;margin-bottom:20px}.qr{width:180px;height:180px;display:block;margin:12px 0}.credentials{font-weight:600;overflow-wrap:anywhere}footer{padding:28px 0;font-size:12px;color:#7c847d;border-top:1px solid #dce2db;margin-top:25px}@media print{body{background:white}section{break-inside:avoid}main{max-width:none}}</style></head><body><main><header>${photo(c.logo) ? `<img src="${photo(c.logo)}" alt="" style="max-width:210px;max-height:100px">` : ""}<div class="eyebrow">${escape(c.name)} · ${en ? "Home guide" : "Guia do imóvel"}</div><h1>${escape(g.title)}</h1><p>${escape(g.propertyCode)} · ${escape(g.address)}</p>${d.status === "Cancelado" ? `<strong>${en ? "CANCELLED" : "CANCELADO"}</strong>` : ""}${photo(g.coverImage) ? `<img class="cover" src="${photo(g.coverImage)}" alt="">` : ""}</header>${g.accessInstructions ? `<section><h2>${en ? "Arrival & access" : "Chegada & acesso"}</h2><div class="content">${escape(g.accessInstructions)}</div></section>` : ""}${qr ? `<section><h2>Wi-Fi</h2><p>${en ? "Scan to join the network" : "Escaneie para conectar à rede"}</p><img class="qr" src="${qr}" alt="QR Wi-Fi"><div class="credentials">${escape(g.wifi.ssid)}</div>${g.wifi.encryption === "nopass" ? "" : `<div class="content">${en ? "Password" : "Senha"}: ${escape(g.wifi.password)}</div>`}</section>` : ""}${g.sections.map((s) => `<section><h2>${escape(s.title)}</h2>${photo(s.image) ? `<img class="section-photo" src="${photo(s.image)}" alt="${escape(s.title)}">` : ""}<div class="content">${escape(s.text)}</div></section>`).join("")}${d.notes ? `<section><h2>${en ? "Additional information" : "Informações adicionais"}</h2><div class="content">${escape(d.notes)}</div></section>` : ""}<footer><strong>${escape(c.name)}</strong><br>${escape([c.address, c.phone, c.website].filter(Boolean).join(" · "))}<br>${en ? "Informational document" : "Documento informativo"} · ${escape(g.propertyCode || String(d.number))}</footer></main></body></html>`;
  return new Blob([html], { type: "text/html" });
}
