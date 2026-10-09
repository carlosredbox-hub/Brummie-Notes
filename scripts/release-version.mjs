import fs from "node:fs";
const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
if (!/^\d+\.\d+\.\d+$/.test(version))
  throw new Error("Use versão estável major.minor.patch.");
const p = version.split(".").map(Number);
if (p[0] > 2000 || p[1] > 999 || p[2] > 999)
  throw new Error("Versão fora do intervalo Android.");
const tag = process.env.RELEASE_TAG;
if (tag && tag !== `v${version}`)
  throw new Error(
    `Tag ${tag} deve corresponder a v${version} do package.json.`,
  );
console.log(version);
