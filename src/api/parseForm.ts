import { createMarkdownProcessor, FormParser } from "../parser/FormParser";
import { computeOk } from "./diagnostics";
import { resolveParseOptions, type ParseOptions } from "./options";
import type { ParseResult } from "./result";
import { isParsedDocument, validateDocument } from "./validate";

export type Parser = {
  parse(markdown: string): ParseResult;
};

export function parseForm(markdown: string, options?: ParseOptions): ParseResult {
  const resolved = resolveParseOptions(options);
  const parser = new FormParser(resolved);
  const { document, diagnostics: parseDiagnostics } = parser.parse(markdown);

  const validationDiagnostics =
    resolved.validateSettings !== false ? validateDocument(document) : [];

  const diagnostics = [...parseDiagnostics, ...validationDiagnostics];
  const ok = computeOk(diagnostics, resolved.strict);

  return { document, diagnostics, ok };
}

export function createParser(options?: ParseOptions): Parser {
  const resolved = resolveParseOptions(options);
  const processor = createMarkdownProcessor();
  const formParser = new FormParser(resolved, processor);

  return {
    parse(markdown: string): ParseResult {
      const { document, diagnostics: parseDiagnostics } = formParser.parse(markdown);
      const validationDiagnostics =
        resolved.validateSettings !== false ? validateDocument(document) : [];
      const diagnostics = [...parseDiagnostics, ...validationDiagnostics];
      const ok = computeOk(diagnostics, resolved.strict);
      return { document, diagnostics, ok };
    },
  };
}

export { isParsedDocument };

/** @deprecated Use `parseForm` instead. Returns document only (ignores strict / ok). */
export function parseMarkdownToForm(markdown: string): Promise<ParseResult["document"]> {
  return Promise.resolve(parseForm(markdown).document);
}
