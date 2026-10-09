import fs from "node:fs";
import path from "node:path";
const [packPath, outputPath] = process.argv.slice(2);
if (!packPath || !outputPath)
  throw new Error(
    "Usage: node scripts/build-reference-html.mjs PRIVATE_PACK.json OUTPUT.html",
  );
const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
if (pack.schema !== 1 || !pack.id || !Array.isArray(pack.records))
  throw new Error("Invalid reference pack");
const safeJson = JSON.stringify(pack)
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");
const baseHtml = fs.readFileSync("dist/index.html", "utf8");
// Bundled libraries can contain the literal string </head> inside JavaScript.
const insertion = baseHtml.lastIndexOf("</head>");
if (insertion < 0) throw new Error("Compiled HTML has no closing head");
const html =
  baseHtml.slice(0, insertion) +
  `<script>window.__BRUMMIE_REFERENCE_PACK__=${safeJson};</script>` +
  baseHtml.slice(insertion);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html);
console.log(
  `Private offline HTML prepared with ${pack.records.filter((r) => r.kind === "archive").length} PDFs and ${pack.records.filter((r) => r.kind === "template").length} templates.`,
);
