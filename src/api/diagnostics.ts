export type Severity = "error" | "warning" | "info";

export type DiagnosticCode =
  | "MISSING_FORM_TITLE"
  | "MISSING_ELEMENT_TYPE"
  | "UNSUPPORTED_ELEMENT_TYPE"
  | "UNSUPPORTED_PROPERTY"
  | "INVALID_PROPERTY_VALUE"
  | "MISSING_REQUIRED_FIELD"
  | "PROPERTY_BEFORE_TYPE"
  | "ORPHAN_QUESTION"
  | "AMBIGUOUS_STRUCTURE"
  | "UNKNOWN_SETTING_KEY"
  | "INVALID_SETTING_VALUE";

export type Diagnostic = {
  code: DiagnosticCode;
  severity: Severity;
  message: string;
  line?: number;
  column?: number;
  path?: string;
};

export function diagnostic(
  code: DiagnosticCode,
  severity: Severity,
  message: string,
  extra?: Pick<Diagnostic, "line" | "column" | "path">,
): Diagnostic {
  return { code, severity, message, ...extra };
}

export function hasErrorSeverity(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((d) => d.severity === "error");
}

export function computeOk(
  diagnostics: Diagnostic[],
  strict: boolean,
): boolean {
  if (!strict) return true;
  return !hasErrorSeverity(diagnostics);
}
