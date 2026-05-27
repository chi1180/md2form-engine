import fs from "node:fs";
import path from "node:path";
import { parseForm } from "../src/api/parseForm";

const samplePath = path.join(import.meta.dir, "sample-form.md");
const outPath = path.join(import.meta.dir, "workspace.json");

const sample = fs.readFileSync(samplePath, "utf8");
const result = parseForm(sample, { strict: false, validateSettings: true });

fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

console.log(`[md2form] wrote ${outPath}`);
console.log(`[md2form] ok=${result.ok} diagnostics=${result.diagnostics.length}`);
if (result.diagnostics.length > 0) {
  for (const d of result.diagnostics) {
    console.log(`  [${d.severity}] ${d.code}: ${d.message}`);
  }
}
