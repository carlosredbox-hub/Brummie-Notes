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
    env: { ...process.env, XDG_CONFIG_HOME: tmp, XDG_CACHE_HOME: tmp },
  });
  const page = await app.firstWindow();
  await page.getByLabel("Endereço HTTPS do app").fill("http://example.com");
  await page.getByRole("button", { name: "Conectar" }).click();
  await page.getByRole("alert").getByText(/HTTPS/).waitFor();
  assert.equal(await page.evaluate(() => typeof window.require), "undefined");
  console.log("Electron connection screen and HTTPS validation passed.");
} finally {
  await app?.close();
  rmSync(tmp, { recursive: true, force: true });
}
