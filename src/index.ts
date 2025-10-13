import { ParserEngine } from "./parseEngine";

export async function parseMarkdownToForm(markdown: string) {
  const _Engine = new ParserEngine(markdown);
  await _Engine.parse();
  return _Engine.form;
}
