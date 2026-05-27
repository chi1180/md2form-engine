import type { FormDocument } from "../types/form.types";
import type { Diagnostic } from "./diagnostics";

export type ParseResult = {
  document: FormDocument;
  diagnostics: Diagnostic[];
  ok: boolean;
};

/** パース成功後（error なし）のドキュメント */
export type ParsedFormDocument = FormDocument & {
  readonly __brand?: unique symbol;
};
