import matter from "gray-matter";
import type { Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { removePosition } from "unist-util-remove-position";
import type {
  BooleanField,
  CheckboxField,
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
  TextInputElement,
  TimeField,
} from "./types/form.types";
import type { Text } from "./types/json.types";

/* config */
const DEFAULT_FORM_TITLE = "Untitled Form";

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

          switch (key?.replace("#", "")) {
            case "type":
              (this.form.pages.at(-1)?.elements.at(-1) as FormElement).type =
                val as ElementType;
              break;
            case "placeholder":
              (
                this.form.pages.at(-1)?.elements.at(-1) as TextInputElement
              ).placeholder = val;
              break;
            case "min":
              (
                this.form.pages.at(-1)?.elements.at(-1) as
                  | NumberField
                  | ScaleField
              ).min = parseInt(val, 10);
              break;
            case "max":
              (
                this.form.pages.at(-1)?.elements.at(-1) as
                  | NumberField
                  | ScaleField
              ).max = parseInt(val, 10);
              break;
            case "options":
              (
                this.form.pages.at(-1)?.elements.at(-1) as
                  | DropdownField
                  | RadioField
                  | CheckboxField
              ).options = val?.split(",").map((opt) => opt.trim()) || [""];
              break;
            case "minTime":
              (this.form.pages.at(-1)?.elements.at(-1) as TimeField).minTime =
                val;
              break;
            case "maxTime":
              (this.form.pages.at(-1)?.elements.at(-1) as TimeField).maxTime =
                val;
              break;
            case "scale":
              (this.form.pages.at(-1)?.elements.at(-1) as RatingField).scale =
                parseInt(val, 10);
              break;
            case "labels":
              (this.form.pages.at(-1)?.elements.at(-1) as RatingField).labels =
                {
                  low: val?.split(",")[0]?.trim() || "low",
                  high: val?.split(",")[1]?.trim() || "high",
                };
              break;
            case "icon":
              (this.form.pages.at(-1)?.elements.at(-1) as RatingField).icon =
                (val as RatingField["icon"]) || "star";
              break;
            case "statements":
              (
                this.form.pages.at(-1)?.elements.at(-1) as LikertField
              ).statements = val?.split(",").map((s) => s.trim()) || [""];
              break;
            case "scaleLabels":
              (
                this.form.pages.at(-1)?.elements.at(-1) as LikertField
              ).scaleLabels = val?.split(",").map((s) => s.trim()) || [""];
              break;
            case "rows":
              (this.form.pages.at(-1)?.elements.at(-1) as MatrixField).rows =
                val?.split(",").map((s) => s.trim()) || [""];
              break;
            case "columns":
              (this.form.pages.at(-1)?.elements.at(-1) as MatrixField).columns =
                val?.split(",").map((s) => s.trim()) || [""];
              break;
            case "cellType":
              (
                this.form.pages.at(-1)?.elements.at(-1) as MatrixField
              ).cellType = (val as MatrixField["cellType"]) || "radio";
              break;
            case "minLabel":
              (this.form.pages.at(-1)?.elements.at(-1) as ScaleField).minLabel =
                val;
              break;
            case "maxLabel":
              (this.form.pages.at(-1)?.elements.at(-1) as ScaleField).maxLabel =
                val;
              break;
            case "allowedTypes":
              (
                this.form.pages.at(-1)?.elements.at(-1) as FileUploadField
              ).allowedTypes = val?.split(",").map((s) => s.trim()) || [""];
              break;
            case "maxFiles":
              (
                this.form.pages.at(-1)?.elements.at(-1) as FileUploadField
              ).maxFiles = parseInt(val, 10);
              break;
            case "maxSizeMB":
              (
                this.form.pages.at(-1)?.elements.at(-1) as FileUploadField
              ).maxSizeMB = parseInt(val, 10);
              break;
            case "captureMode":
              (
                this.form.pages.at(-1)?.elements.at(-1) as SignatureField
              ).captureMode = (val as SignatureField["captureMode"]) || "draw";
              break;
            case "title":
              (this.form.pages.at(-1)?.elements.at(-1) as SectionHeader).title =
                val || "";
              break;
            case "subtitle":
              (
                this.form.pages.at(-1)?.elements.at(-1) as SectionHeader
              ).subtitle = val || "";
              break;
            case "src":
              (this.form.pages.at(-1)?.elements.at(-1) as MediaField).src =
                val || "";
              break;
            case "alt":
              (this.form.pages.at(-1)?.elements.at(-1) as MediaField).alt =
                val || "";
              break;
            case "caption":
              (this.form.pages.at(-1)?.elements.at(-1) as MediaField).caption =
                val || "";
              break;
            case "onLabel":
              (
                this.form.pages.at(-1)?.elements.at(-1) as BooleanField
              ).onLabel = val || "Yes";
              break;
            case "offLabel":
              (
                this.form.pages.at(-1)?.elements.at(-1) as BooleanField
              ).offLabel = val || "No";
              break;
            case "required":
              (
                this.form.pages.at(-1)?.elements.at(-1) as FormElementBase
              ).required = val === "true";
              break;
            default:
              throw new Error(`[--ERROR--] Unknown key: ${key}`);
          }
        }
      }
    }
  }
}
