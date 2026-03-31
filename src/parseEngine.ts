import matter from "gray-matter";
import type { Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { removePosition } from "unist-util-remove-position";
import type {
  BooleanField,
  CheckboxField,
  DateField,
  DropdownField,
  ElementType,
  FileUploadField,
  FormDocument,
  FormElement,
  FormElementBase,
  LikertField,
  MatrixField,
  MediaField,
  NumberField,
  Page,
  RadioField,
  RatingField,
  ScaleField,
  SectionHeader,
  SignatureField,
  ShortText,
  TextInputElement,
  TimeField,
  LongText,
} from "./types/form.types";
import type { Text } from "./types/json.types";

/* config */
const DEFAULT_FORM_TITLE = "Untitled Form";

const SUPPORTED_ELEMENT_TYPES = new Set<ElementType>([
  "short_text",
  "long_text",
  "number",
  "email",
  "phone",
  "dropdown",
  "radio",
  "checkbox",
  "date",
  "time",
  "rating",
  "likert",
  "matrix",
  "scale",
  "file_upload",
  "signature",
  "image",
  "video",
  "boolean",
  "section_header",
]);

const PROPERTY_SUPPORT: Record<string, Set<ElementType>> = {
  required: new Set([
    "short_text",
    "long_text",
    "number",
    "email",
    "phone",
    "dropdown",
    "radio",
    "checkbox",
    "date",
    "time",
    "rating",
    "likert",
    "matrix",
    "scale",
    "file_upload",
    "signature",
    "boolean",
  ]),
  visible: new Set([
    "short_text",
    "long_text",
    "number",
    "email",
    "phone",
    "dropdown",
    "radio",
    "checkbox",
    "date",
    "time",
    "rating",
    "likert",
    "matrix",
    "scale",
    "file_upload",
    "signature",
    "image",
    "video",
    "boolean",
    "section_header",
  ]),
  placeholder: new Set(["short_text", "long_text", "number", "email", "phone"]),
  maxLength: new Set(["short_text", "long_text"]),
  default: new Set([
    "short_text",
    "long_text",
    "number",
    "email",
    "phone",
    "dropdown",
    "radio",
    "checkbox",
    "date",
    "time",
    "rating",
    "scale",
    "boolean",
  ]),
  min: new Set(["number", "scale"]),
  max: new Set(["number", "scale"]),
  step: new Set(["number", "scale"]),
  integerOnly: new Set(["number"]),
  options: new Set(["dropdown", "radio", "checkbox"]),
  allowOther: new Set(["dropdown", "radio"]),
  searchable: new Set(["dropdown"]),
  minSelected: new Set(["checkbox"]),
  maxSelected: new Set(["checkbox"]),
  includeTime: new Set(["date"]),
  minDate: new Set(["date"]),
  maxDate: new Set(["date"]),
  minTime: new Set(["time"]),
  maxTime: new Set(["time"]),
  stepMinutes: new Set(["time"]),
  scale: new Set(["rating"]),
  labels: new Set(["rating"]),
  icon: new Set(["rating"]),
  statements: new Set(["likert"]),
  scaleLabels: new Set(["likert"]),
  requiredPerStatement: new Set(["likert"]),
  rows: new Set(["matrix"]),
  columns: new Set(["matrix"]),
  cellType: new Set(["matrix"]),
  requiredPerRow: new Set(["matrix"]),
  minLabel: new Set(["scale"]),
  maxLabel: new Set(["scale"]),
  allowedTypes: new Set(["file_upload"]),
  maxFiles: new Set(["file_upload"]),
  maxSizeMB: new Set(["file_upload"]),
  captureMode: new Set(["signature"]),
  src: new Set(["image", "video"]),
  alt: new Set(["image"]),
  width: new Set(["image", "video"]),
  height: new Set(["image", "video"]),
  caption: new Set(["image", "video"]),
  onLabel: new Set(["boolean"]),
  offLabel: new Set(["boolean"]),
  title: new Set(["section_header"]),
  subtitle: new Set(["section_header"]),
};

const toPropertyValue = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const parseBoolean = (value: string): boolean | undefined => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const parseNumber = (value: string): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const parseInteger = (value: string): number | undefined => {
  if (!/^-?\d+$/.test(value)) return undefined;
  return Number.parseInt(value, 10);
};

const parseCsvValues = (input: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  let escaped = false;

  for (const char of input.trim()) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values.map((val) => toPropertyValue(val));
};

const parseDefaultByType = (element: FormElement, rawValue: string): unknown => {
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
      const parsed = parseNumber(value);
      return parsed;
    }
    case "checkbox":
      return parseCsvValues(value);
    case "boolean":
      return parseBoolean(value);
    default:
      return undefined;
  }
};

const isPropertySupportedForType = (property: string, type: ElementType): boolean => {
  const supportedTypes = PROPERTY_SUPPORT[property];
  if (!supportedTypes) return false;
  return supportedTypes.has(type);
};

export class ParserEngine {
  mdContent: string = "";
  tree: Root | null = null;
  processor = unified().use(remarkParse);
  form: FormDocument = {
    title: DEFAULT_FORM_TITLE,
    pages: [],
  };

  constructor(mdContent: string) {
    this.mdContent = mdContent;
  }

  async parse() {
    const contentData = matter(this.mdContent);
    this.form.settings = contentData.data;

    const parsedData = this.processor.parse(contentData.content) as Root;
    const tree = (await this.processor.run(parsedData)) as Root;
    removePosition(tree, { force: true });
    this.tree = tree;

    /* Markdown data translator */

    const root_children = this.tree.children;
    for (const child of root_children) {
      //
      // conditional expressions
      //
      const isFormTitle =
        child.type === "heading" &&
        child.depth === 1 &&
        child.children[0]?.type === "text";

      const isFormDescription =
        this.form.title.length > 0 &&
        this.form.pages.length === 0 &&
        child.type === "paragraph" &&
        child.children[0]?.type === "text";

      const isSectionTitle =
        child.type === "heading" &&
        child.depth === 2 &&
        child.children[0]?.type === "text";

      const isPageDescription =
        this.form.pages.at(-1)?.description?.length === 0 &&
        this.form.pages.at(-1)?.elements.length === 0 &&
        child.type === "paragraph" &&
        child.children[0]?.type === "text";

      const isQuestionTitle =
        this.form.pages.at(-1) !== undefined &&
        child.type === "heading" &&
        child.depth === 3 &&
        child.children[0]?.type === "text";

      const isQuestion =
        this.form.pages.at(-1)?.elements.at(-1)?.type === "unknown" &&
        child.type === "paragraph" &&
        child.children[0]?.type === "text";

      //
      // Condition handling
      //
      if (isFormTitle) {
        this.form.title = (child.children[0] as Text).value;
      } else if (isFormDescription) {
        this.form.description = (child.children[0] as Text).value;
      } else if (isSectionTitle) {
        this.form.pages.push({
          title: (child.children[0] as Text).value,
          description: "",
          elements: [],
        });
      } else if (isPageDescription) {
        (this.form.pages.at(-1) as Page).description = (
          child.children[0] as Text
        ).value;
      } else if (isQuestionTitle) {
        (this.form.pages.at(-1) as Page).elements.push({
          type: "unknown",
          description: (child.children[0] as Text).value,
        });
      } else if (isQuestion) {
        const lines = (child.children[0] as Text).value.split("\n");
        for (const line of lines) {
          // const [key, val] = line.split(" ");
          const splitLine = line.split(" ");
          const key = splitLine[0]?.trim() || "";
          const val = splitLine.slice(1).join(" ").trim();
          const property = key?.replace("#", "");
          const currentElement = this.form.pages.at(-1)?.elements.at(-1) as
            | FormElement
            | undefined;

          if (!currentElement) {
            continue;
          }

          if (property !== "type") {
            if (currentElement.type === "unknown") {
              continue;
            }

            if (!isPropertySupportedForType(property, currentElement.type)) {
              continue;
            }
          }

          switch (property) {
            case "type":
              if (SUPPORTED_ELEMENT_TYPES.has(val as ElementType)) {
                currentElement.type = val as ElementType;
              }
              break;
            case "placeholder":
              (currentElement as TextInputElement).placeholder =
                toPropertyValue(val);
              break;
            case "maxLength": {
              const parsed = parseInteger(val);
              if (parsed !== undefined) {
                (currentElement as ShortText | LongText).maxLength = parsed;
              }
              break;
            }
            case "default": {
              const parsedDefault = parseDefaultByType(currentElement, val);
              if (parsedDefault !== undefined) {
                (currentElement as
                  | TextInputElement
                  | DropdownField
                  | RadioField
                  | CheckboxField
                  | DateField
                  | TimeField
                  | RatingField
                  | ScaleField
                  | BooleanField
                ).default = parsedDefault as never;
              }
              break;
            }
            case "min":
              {
                const parsed = parseNumber(val);
                if (parsed !== undefined) {
                  (currentElement as NumberField | ScaleField).min = parsed;
                }
              }
              break;
            case "max":
              {
                const parsed = parseNumber(val);
                if (parsed !== undefined) {
                  (currentElement as NumberField | ScaleField).max = parsed;
                }
              }
              break;
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
            case "scale":
              {
                const parsed = parseInteger(val);
                if (parsed !== undefined) {
                  (currentElement as RatingField).scale = parsed;
                }
              }
              break;
            case "labels":
              {
                const [low, high] = parseCsvValues(val);
                (currentElement as RatingField).labels = {
                  low: low || "low",
                  high: high || "high",
                };
              }
              break;
            case "icon":
              (currentElement as RatingField).icon =
                (toPropertyValue(val) as RatingField["icon"]) || "star";
              break;
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
            case "rows":
              (currentElement as MatrixField).rows = parseCsvValues(val);
              break;
            case "columns":
              (currentElement as MatrixField).columns = parseCsvValues(val);
              break;
            case "cellType":
              (currentElement as MatrixField).cellType =
                (toPropertyValue(val) as MatrixField["cellType"]) || "radio";
              break;
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
              (currentElement as FileUploadField).allowedTypes =
                parseCsvValues(val);
              break;
            case "maxFiles":
              {
                const parsed = parseInteger(val);
                if (parsed !== undefined) {
                  (currentElement as FileUploadField).maxFiles = parsed;
                }
              }
              break;
            case "maxSizeMB":
              {
                const parsed = parseInteger(val);
                if (parsed !== undefined) {
                  (currentElement as FileUploadField).maxSizeMB = parsed;
                }
              }
              break;
            case "captureMode":
              (currentElement as SignatureField).captureMode =
                (toPropertyValue(val) as SignatureField["captureMode"]) || "draw";
              break;
            case "title":
              (currentElement as SectionHeader).title = toPropertyValue(val) || "";
              break;
            case "subtitle":
              (currentElement as SectionHeader).subtitle =
                toPropertyValue(val) || "";
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
              (currentElement as BooleanField).onLabel =
                toPropertyValue(val) || "Yes";
              break;
            case "offLabel":
              (currentElement as BooleanField).offLabel =
                toPropertyValue(val) || "No";
              break;
            case "visible": {
              const parsed = parseBoolean(val);
              if (parsed !== undefined) {
                (currentElement as FormElementBase).visible = parsed;
              }
              break;
            }
            case "required":
              {
                const parsed = parseBoolean(val);
                if (parsed !== undefined) {
                  (currentElement as FormElementBase).required = parsed;
                }
              }
              break;
            default:
              break;
          }
        }
      }
    }
  }
}
