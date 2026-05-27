import { diagnostic, type Diagnostic } from "./diagnostics";
import type { FormDocument, FormElement } from "../types/form.types";

export function validateDocument(document: FormDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const page of document.pages) {
    for (const element of page.elements) {
      diagnostics.push(...validateElement(element));
    }
  }

  return diagnostics;
}

function validateElement(element: FormElement): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const path = element.label ?? element.type;

  switch (element.type) {
    case "dropdown":
    case "radio":
    case "checkbox":
      if (!element.options?.length) {
        diagnostics.push(
          diagnostic(
            "MISSING_REQUIRED_FIELD",
            "error",
            `${element.type} "${path}" requires #options`,
            { path },
          ),
        );
      }
      break;
    case "likert":
      if (!element.statements?.length) {
        diagnostics.push(
          diagnostic(
            "MISSING_REQUIRED_FIELD",
            "error",
            `likert "${path}" requires #statements`,
            { path },
          ),
        );
      }
      if (!element.scaleLabels?.length) {
        diagnostics.push(
          diagnostic(
            "MISSING_REQUIRED_FIELD",
            "error",
            `likert "${path}" requires #scaleLabels`,
            { path },
          ),
        );
      }
      break;
    case "matrix":
      if (!element.rows?.length) {
        diagnostics.push(
          diagnostic(
            "MISSING_REQUIRED_FIELD",
            "error",
            `matrix "${path}" requires #rows`,
            { path },
          ),
        );
      }
      if (!element.columns?.length) {
        diagnostics.push(
          diagnostic(
            "MISSING_REQUIRED_FIELD",
            "error",
            `matrix "${path}" requires #columns`,
            { path },
          ),
        );
      }
      break;
    case "scale":
      if (element.min === undefined) {
        diagnostics.push(
          diagnostic(
            "MISSING_REQUIRED_FIELD",
            "error",
            `scale "${path}" requires #min`,
            { path },
          ),
        );
      }
      if (element.max === undefined) {
        diagnostics.push(
          diagnostic(
            "MISSING_REQUIRED_FIELD",
            "error",
            `scale "${path}" requires #max`,
            { path },
          ),
        );
      }
      break;
    case "image":
    case "video":
      if (!element.src) {
        diagnostics.push(
          diagnostic(
            "MISSING_REQUIRED_FIELD",
            "error",
            `${element.type} "${path}" requires #src`,
            { path },
          ),
        );
      }
      break;
    default:
      break;
  }

  return diagnostics;
}

export function isParsedDocument(
  result: { ok: boolean; diagnostics: Diagnostic[] },
): boolean {
  return result.ok;
}
