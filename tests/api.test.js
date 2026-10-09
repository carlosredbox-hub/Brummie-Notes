import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
test("accounts isolate data; invoice generation and bilingual PDF work", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "brummie-test-"));
  const child = spawn(process.execPath, ["server.js"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: "3012",
      DB_PATH: join(tmp, "test.sqlite"),
    },
    stdio: "pipe",
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Server timeout")),
        15000,
      );
      child.stdout.on("data", (s) => {
        if (s.toString().includes("listening")) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.on("error", reject);
    });
    const base = "http://127.0.0.1:3012/api";
    const req = async (p, m = "GET", d, c = "") =>
      fetch(base + p, {
        method: m,
        headers: { "Content-Type": "application/json", cookie: c },
        body: d ? JSON.stringify(d) : undefined,
      });
    assert.equal((await req("/state")).status, 401);
    const a = await req("/auth/register", "POST", {
      name: "Ana",
      company: "Test transport",
      email: "ana@example.test",
      password: "Testpassword123",
    });
    assert.equal(a.status, 200);
    const cookie = a.headers.get("set-cookie").split(";")[0];
    const rec = await req(
      "/records/driver",
      "POST",
      {
        name: "Motorista",
        photo:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jHXYAAAAASUVORK5CYII=",
        languages: "Português, Inglês",
        phone: "123",
      },
      cookie,
    );
    assert.equal(rec.status, 200);
    const driverId = (await rec.json()).id;
    const driver = (
      await (await req("/state", "GET", null, cookie)).json()
    ).records.find((r) => r.id === driverId);
    const d = {
      type: "invoice",
      language: "en",
      currency: "BRL",
      client: "Client test",
      date: "2026-10-09",
      due: "2026-10-10",
      status: "Emitido",
      driver,
      items: [
        { description: "Helicopter", quantity: 2, price: 20000, extra: 9600 },
        { description: "Luggage car", quantity: 1, price: 1200 },
      ],
      discount: 0,
    };
    const created = await req("/documents", "POST", d, cookie);
    assert.equal(created.status, 200);
    const doc = await created.json();
    const state = await (await req("/state", "GET", null, cookie)).json();
    assert.equal(state.documents[0].total, 50800);
    assert.equal(state.documents[0].company.name, "Test transport");
    const pdf = await req("/documents/" + doc.id + "/pdf", "GET", null, cookie);
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get("content-type"), "application/pdf");
    const bytes = Buffer.from(await pdf.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    assert.ok(bytes.length > 5000);
    assert.ok(bytes.toString("latin1").includes("/Subtype /Image"));
    const b = await req("/auth/register", "POST", {
      name: "Other",
      company: "Other team",
      email: "other@example.test",
      password: "Otherpassword123",
    });
    const c2 = b.headers.get("set-cookie").split(";")[0];
    assert.equal(
      (await req("/documents/" + doc.id + "/pdf", "GET", null, c2)).status,
      404,
    );
    assert.equal(
      (await (await req("/state", "GET", null, c2)).json()).documents.length,
      0,
    );
    assert.equal(
      (await req("/documents", "POST", { ...d, discount: 999999 }, cookie))
        .status,
      400,
    );
    assert.equal(
      (await req("/documents", "POST", { ...d, type: "recibo" }, cookie))
        .status,
      400,
    );
    assert.equal(
      (await req("/documents/" + doc.id, "PATCH", { status: "Pago" }, cookie))
        .status,
      200,
    );
    await req("/logout", "POST", null, cookie);
    assert.equal((await req("/state", "GET", null, cookie)).status, 401);
  } finally {
    child.kill();
    await new Promise((r) => child.once("exit", r));
    rmSync(tmp, { recursive: true, force: true });
  }
});
