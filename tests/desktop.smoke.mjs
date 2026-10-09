import { _electron as electron } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const tmp = mkdtempSync(join(tmpdir(), "brummie-electron-"));
let app;
try {
  app = await electron.launch({
    executablePath: process.env.ELECTRON_EXECUTABLE || undefined,
    args: ["--user-data-dir=" + tmp, "."],
    cwd: process.cwd(),
    env: { ...process.env, XDG_CONFIG_HOME: tmp },
  });
  const page = await app.firstWindow();
  await page
    .getByText("Seus documentos anteriores são o ponto de partida do próximo.")
    .waitFor();
  await page.getByRole("button", { name: "Meus modelos", exact: true }).click();
  await page
    .getByRole("heading", { name: "Transfer executivo", exact: true })
    .waitFor();
  assert.equal(await page.evaluate(() => typeof window.require), "undefined");
  console.log("Offline Electron application and templates passed.");
} finally {
  await app?.close();
  rmSync(tmp, { recursive: true, force: true });
}
