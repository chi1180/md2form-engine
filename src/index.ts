import { ParserEngine } from "./parseEngine";

// Re-export all types
export * from "./types/form.types";
export * from "./types/json.types";

export async function parseMarkdownToForm(markdown: string) {
  const _Engine = new ParserEngine(markdown);
  await _Engine.parse();
  return _Engine.form;
}
