import { ParseEngine } from "./src/services/parseEngine";

export async function parse(text: string) {
  const _ParseEngine = new ParseEngine(text);
  const tree = await _ParseEngine.makeTree();

  return tree;
}
