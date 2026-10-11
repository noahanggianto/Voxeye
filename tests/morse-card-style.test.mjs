import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Morse guide uses the same padded-card containment as the camera", async () => {
  const css = await readFile(new URL("../src/style.css", import.meta.url), "utf8");

  assert.match(css, /\.morse-card\s*\{[^}]*padding:\s*24px;/s);
  assert.match(css, /\.morse-letter-grid\s*\{[^}]*max-height:\s*min\(320px,\s*48vh\);[^}]*overflow:\s*auto;/s);
});
