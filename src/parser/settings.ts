import { diagnostic, type Diagnostic } from "../api/diagnostics";
import type { FormSettings } from "../types/form.types";

const KNOWN_SETTINGS_KEYS = new Set([
  "collectEmail",
  "allowMultipleResponses",
  "limitResponses",
  "showProgressBar",
  "shuffleQuestions",
  "themeColor",
  "backgroundImage",
  "font",
  "responseReceipt",
]);

const RESPONSE_RECEIPT_VALUES = new Set(["always", "never", "whenRequested"]);

export function parseSettings(
  raw: Record<string, unknown>,
): { settings?: FormSettings; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const settings: FormSettings = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!KNOWN_SETTINGS_KEYS.has(key)) {
      diagnostics.push(
        diagnostic(
          "UNKNOWN_SETTING_KEY",
          "warning",
          `Unknown frontmatter setting key "${key}"`,
          { path: `settings.${key}` },
        ),
      );
      continue;
    }

    switch (key) {
      case "collectEmail":
      case "allowMultipleResponses":
      case "showProgressBar":
      case "shuffleQuestions": {
        if (typeof value === "boolean") {
          settings[key] = value;
        } else {
          diagnostics.push(
            diagnostic(
              "INVALID_SETTING_VALUE",
              "error",
              `Setting "${key}" must be a boolean`,
              { path: `settings.${key}` },
            ),
          );
        }
        break;
      }
      case "limitResponses": {
        if (value === null) {
          settings.limitResponses = null;
        } else if (typeof value === "number" && Number.isFinite(value)) {
          settings.limitResponses = value;
        } else {
          diagnostics.push(
            diagnostic(
              "INVALID_SETTING_VALUE",
              "error",
              `Setting "limitResponses" must be a number or null`,
              { path: "settings.limitResponses" },
            ),
          );
        }
        break;
      }
      case "themeColor":
      case "backgroundImage":
      case "font": {
        if (typeof value === "string") {
          settings[key] = value;
        } else {
          diagnostics.push(
            diagnostic(
              "INVALID_SETTING_VALUE",
              "error",
              `Setting "${key}" must be a string`,
              { path: `settings.${key}` },
            ),
          );
        }
        break;
      }
      case "responseReceipt": {
        const str = String(value);
        if (RESPONSE_RECEIPT_VALUES.has(str)) {
          settings.responseReceipt = str as FormSettings["responseReceipt"];
        } else {
          diagnostics.push(
            diagnostic(
              "INVALID_SETTING_VALUE",
              "error",
              `Setting "responseReceipt" must be one of: always, never, whenRequested`,
              { path: "settings.responseReceipt" },
            ),
          );
        }
        break;
      }
    }
  }

  return {
    settings: Object.keys(settings).length > 0 ? settings : undefined,
    diagnostics,
  };
}
