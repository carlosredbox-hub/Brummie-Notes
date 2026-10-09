import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { serverUrl } = createRequire(import.meta.url)("../desktop/url.cjs");
test("desktop only connects to a server HTTPS root, without credentials", () => {
  assert.equal(serverUrl(" https://example.com/ "), "https://example.com");
  assert.equal(
    serverUrl("https://example.com:8443"),
    "https://example.com:8443",
  );
  for (const v of [
    "http://example.com",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "https://user:pass@example.com",
    "https://example.com/other",
    "https://example.com/?token=x",
    "https://example.com/#x",
  ])
    assert.throws(() => serverUrl(v));
});
