import fs from "node:fs";
import path from "node:path";
import { parse } from "../index";

async function workspace() {
  // load sample text
  const sample = fs.readFileSync(
    path.join(__dirname, "sample-form.md"),
    "utf8",
  );
  if (sample) {
    const result = await parse(sample);
    console.dir(result, { depth: null });
  } else {
    console.log("[--ERROR--] There is no sample file...");
  }
}

// run
workspace();
