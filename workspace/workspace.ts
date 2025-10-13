import fs from "node:fs";
import path from "node:path";
import { ParserEngine } from "../src/parseEngine";

async function workspace() {
  // load sample text
  const sample = fs.readFileSync(
    path.join(__dirname, "sample-form.md"),
    "utf8",
  );
  if (sample) {
    const _Engine = new ParserEngine(sample);
    await _Engine.parse();

    // debug output
    fs.writeFileSync(
      "workspace.json",
      JSON.stringify(_Engine.form, null, 2),
      "utf-8",
    );
  } else {
    console.log("[--ERROR--] There is no sample file...");
  }
}

// run
workspace();
