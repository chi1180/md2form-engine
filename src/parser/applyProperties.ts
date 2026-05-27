import { diagnostic, type Diagnostic } from "../api/diagnostics";
import {
  isPropertySupportedForType,
  PROPERTY_SUPPORT,
  SUPPORTED_ELEMENT_TYPES,
} from "../schema/propertySupport";
import type {
  BooleanField,
  CheckboxField,
  DateField,
  DropdownField,
  ElementType,
  FileUploadField,
  FormElement,
  LikertField,
  LongText,
  MatrixField,
  MediaField,
  NumberField,
  RadioField,
  RatingField,
  ScaleField,
  SectionHeader,
  ShortText,
  SignatureField,
  TextInputElement,
  TimeField,
} from "../types/form.types";
import {
  parseBoolean,
  parseCsvValues,
  parseInteger,
  parseNumber,
  type RawPropertyLine,
  toPropertyValue,
} from "./utils";

const RATING_ICONS = new Set(["star", "heart", "circle"]);
const MATRIX_CELL_TYPES = new Set(["radio", "checkbox", "number", "short_text"]);
const CAPTURE_MODES = new Set(["draw", "type", "upload"]);

export type ApplyPropertiesResult = {
  element: FormElement | null;
  diagnostics: Diagnostic[];
};

function parseDefaultByType(element: FormElement, rawValue: string): unknown {
  const value = rawValue.trim();
  switch (element.type) {
    case "short_text":
    case "long_text":
    case "email":
    case "phone":
    case "dropdown":
    case "radio":
    case "date":
    case "time":
      return toPropertyValue(value);
    case "number":
    case "rating":
    case "scale": {
      return parseNumber(value);
    }
    case "checkbox":
      return parseCsvValues(value);
    case "boolean":
      return parseBoolean(value);
    default:
      return undefined;
  }
}

function propertyExists(property: string): boolean {
  return property in PROPERTY_SUPPORT;
}

export function applyProperties(
  label: string,
  rawLines: RawPropertyLine[],
): ApplyPropertiesResult {
  const diagnostics: Diagnostic[] = [];
  const path = label;

  let elementType: ElementType | null = null;
  let typeLineIndex = -1;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]!;
    if (line.property === "type") {
      typeLineIndex = i;
      const val = toPropertyValue(line.value);
      if (SUPPORTED_ELEMENT_TYPES.has(val as ElementType)) {
        elementType = val as ElementType;
      } else {
        diagnostics.push(
          diagnostic(
            "UNSUPPORTED_ELEMENT_TYPE",
            "error",
            `Unsupported element type "${val}" for question "${label}"`,
            { path },
          ),
        );
      }
      break;
    }
  }

  if (!elementType) {
    diagnostics.push(
      diagnostic(
        "MISSING_ELEMENT_TYPE",
        "error",
        `Question "${label}" is missing #type`,
        { path },
      ),
    );
    return { element: null, diagnostics };
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]!;
    if (line.property === "type") continue;
    if (typeLineIndex >= 0 && i < typeLineIndex) {
      diagnostics.push(
        diagnostic(
          "PROPERTY_BEFORE_TYPE",
          "warning",
          `Property #${line.property} appears before #type for question "${label}"`,
          { path },
        ),
      );
    }
  }

  const element = { type: elementType, label } as FormElement;

  for (const line of rawLines) {
    const { property, value: val } = line;
    if (property === "type") continue;

    if (!isPropertySupportedForType(property, elementType)) {
      diagnostics.push(
        diagnostic(
          "UNSUPPORTED_PROPERTY",
          "warning",
          propertyExists(property)
            ? `Property #${property} is not supported for type ${elementType} on "${label}"`
            : `Unknown property #${property} on "${label}"`,
          { path },
        ),
      );
      continue;
    }

    applySingleProperty(element, elementType, property, val, label, diagnostics);
  }

  return { element, diagnostics };
}

function applySingleProperty(
  currentElement: FormElement,
  elementType: ElementType,
  property: string,
  val: string,
  label: string,
  diagnostics: Diagnostic[],
): void {
  const path = label;

  switch (property) {
    case "placeholder":
      (currentElement as TextInputElement).placeholder = toPropertyValue(val);
      break;
    case "maxLength": {
      const parsed = parseInteger(val);
      if (parsed !== undefined) {
        (currentElement as ShortText | LongText).maxLength = parsed;
      } else {
        diagnostics.push(
          diagnostic(
            "INVALID_PROPERTY_VALUE",
            "warning",
            `Invalid #maxLength for "${label}"`,
            { path },
          ),
        );
      }
      break;
    }
    case "rows": {
      if (elementType === "long_text") {
        const parsed = parseInteger(val);
        if (parsed !== undefined) {
          (currentElement as LongText).rows = parsed;
        }
      } else if (elementType === "matrix") {
        (currentElement as MatrixField).rows = parseCsvValues(val);
      }
      break;
    }
    case "default": {
      const parsedDefault = parseDefaultByType(currentElement, val);
      if (parsedDefault !== undefined) {
        (currentElement as { default?: unknown }).default = parsedDefault;
      } else {
        diagnostics.push(
          diagnostic(
            "INVALID_PROPERTY_VALUE",
            "warning",
            `Invalid #default for "${label}"`,
            { path },
          ),
        );
      }
      break;
    }
    case "min": {
      const parsed = parseNumber(val);
      if (parsed !== undefined) {
        (currentElement as NumberField | ScaleField).min = parsed;
      }
      break;
    }
    case "max": {
      const parsed = parseNumber(val);
      if (parsed !== undefined) {
        (currentElement as NumberField | ScaleField).max = parsed;
      }
      break;
    }
    case "step": {
      const parsed = parseNumber(val);
      if (parsed !== undefined) {
        (currentElement as NumberField | ScaleField).step = parsed;
      }
      break;
    }
    case "integerOnly": {
      const parsed = parseBoolean(val);
      if (parsed !== undefined) {
        (currentElement as NumberField).integerOnly = parsed;
      }
      break;
    }
    case "options":
      (currentElement as DropdownField | RadioField | CheckboxField).options =
        parseCsvValues(val);
      break;
    case "allowOther": {
      const parsed = parseBoolean(val);
      if (parsed !== undefined) {
        (currentElement as DropdownField | RadioField).allowOther = parsed;
      }
      break;
    }
    case "searchable": {
      const parsed = parseBoolean(val);
      if (parsed !== undefined) {
        (currentElement as DropdownField).searchable = parsed;
      }
      break;
    }
    case "minSelected": {
      const parsed = parseInteger(val);
      if (parsed !== undefined) {
        (currentElement as CheckboxField).minSelected = parsed;
      }
      break;
    }
    case "maxSelected": {
      const parsed = parseInteger(val);
      if (parsed !== undefined) {
        (currentElement as CheckboxField).maxSelected = parsed;
      }
      break;
    }
    case "includeTime": {
      const parsed = parseBoolean(val);
      if (parsed !== undefined) {
        (currentElement as DateField).includeTime = parsed;
      }
      break;
    }
    case "minDate":
      (currentElement as DateField).minDate = toPropertyValue(val);
      break;
    case "maxDate":
      (currentElement as DateField).maxDate = toPropertyValue(val);
      break;
    case "minTime":
      (currentElement as TimeField).minTime = toPropertyValue(val);
      break;
    case "maxTime":
      (currentElement as TimeField).maxTime = toPropertyValue(val);
      break;
    case "stepMinutes": {
      const parsed = parseInteger(val);
      if (parsed !== undefined) {
        (currentElement as TimeField).stepMinutes = parsed;
      }
      break;
    }
    case "scale": {
      const parsed = parseInteger(val);
      if (parsed !== undefined) {
        (currentElement as RatingField).scale = parsed;
      }
      break;
    }
    case "labels": {
      const [low, high] = parseCsvValues(val);
      (currentElement as RatingField).labels = {
        low: low || "low",
        high: high || "high",
      };
      break;
    }
    case "icon": {
      const icon = toPropertyValue(val);
      if (RATING_ICONS.has(icon)) {
        (currentElement as RatingField).icon = icon as RatingField["icon"];
      } else {
        diagnostics.push(
          diagnostic(
            "INVALID_PROPERTY_VALUE",
            "warning",
            `Invalid #icon "${icon}" for "${label}", using "star"`,
            { path },
          ),
        );
        (currentElement as RatingField).icon = "star";
      }
      break;
    }
    case "statements":
      (currentElement as LikertField).statements = parseCsvValues(val);
      break;
    case "scaleLabels":
      (currentElement as LikertField).scaleLabels = parseCsvValues(val);
      break;
    case "requiredPerStatement": {
      const parsed = parseBoolean(val);
      if (parsed !== undefined) {
        (currentElement as LikertField).requiredPerStatement = parsed;
      }
      break;
    }
    case "columns":
      (currentElement as MatrixField).columns = parseCsvValues(val);
      break;
    case "cellType": {
      const cell = toPropertyValue(val);
      if (MATRIX_CELL_TYPES.has(cell)) {
        (currentElement as MatrixField).cellType =
          cell as MatrixField["cellType"];
      } else {
        diagnostics.push(
          diagnostic(
            "INVALID_PROPERTY_VALUE",
            "warning",
            `Invalid #cellType "${cell}" for "${label}", using "radio"`,
            { path },
          ),
        );
        (currentElement as MatrixField).cellType = "radio";
      }
      break;
    }
    case "requiredPerRow": {
      const parsed = parseBoolean(val);
      if (parsed !== undefined) {
        (currentElement as MatrixField).requiredPerRow = parsed;
      }
      break;
    }
    case "minLabel":
      (currentElement as ScaleField).minLabel = toPropertyValue(val);
      break;
    case "maxLabel":
      (currentElement as ScaleField).maxLabel = toPropertyValue(val);
      break;
    case "allowedTypes":
      (currentElement as FileUploadField).allowedTypes = parseCsvValues(val);
      break;
    case "maxFiles": {
      const parsed = parseInteger(val);
      if (parsed !== undefined) {
        (currentElement as FileUploadField).maxFiles = parsed;
      }
      break;
    }
    case "maxSizeMB": {
      const parsed = parseInteger(val);
      if (parsed !== undefined) {
        (currentElement as FileUploadField).maxSizeMB = parsed;
      }
      break;
    }
    case "captureMode": {
      const mode = toPropertyValue(val);
      if (CAPTURE_MODES.has(mode)) {
        (currentElement as SignatureField).captureMode =
          mode as SignatureField["captureMode"];
      } else {
        diagnostics.push(
          diagnostic(
            "INVALID_PROPERTY_VALUE",
            "warning",
            `Invalid #captureMode "${mode}" for "${label}", using "draw"`,
            { path },
          ),
        );
        (currentElement as SignatureField).captureMode = "draw";
      }
      break;
    }
    case "title":
      (currentElement as SectionHeader).title = toPropertyValue(val) || "";
      break;
    case "subtitle":
      (currentElement as SectionHeader).subtitle = toPropertyValue(val) || "";
      break;
    case "src":
      (currentElement as MediaField).src = toPropertyValue(val) || "";
      break;
    case "alt":
      (currentElement as MediaField).alt = toPropertyValue(val) || "";
      break;
    case "width": {
      const parsed = toPropertyValue(val);
      if (parsed === "auto") {
        (currentElement as MediaField).width = "auto";
      } else {
        const width = parseNumber(parsed);
        if (width !== undefined) {
          (currentElement as MediaField).width = width;
        }
      }
      break;
    }
    case "height": {
      const parsed = toPropertyValue(val);
      if (parsed === "auto") {
        (currentElement as MediaField).height = "auto";
      } else {
        const height = parseNumber(parsed);
        if (height !== undefined) {
          (currentElement as MediaField).height = height;
        }
      }
      break;
    }
    case "caption":
      (currentElement as MediaField).caption = toPropertyValue(val) || "";
      break;
    case "onLabel":
      (currentElement as BooleanField).onLabel = toPropertyValue(val) || "Yes";
      break;
    case "offLabel":
      (currentElement as BooleanField).offLabel = toPropertyValue(val) || "No";
      break;
    case "visible": {
      const parsed = parseBoolean(val);
      if (parsed !== undefined) {
        currentElement.visible = parsed;
      }
      break;
    }
    case "required": {
      const parsed = parseBoolean(val);
      if (parsed !== undefined) {
        currentElement.required = parsed;
      }
      break;
    }
    default:
      break;
  }
}
