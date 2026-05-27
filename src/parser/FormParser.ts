import matter from "gray-matter";
import type { Heading, Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { removePosition } from "unist-util-remove-position";
import { diagnostic, type Diagnostic } from "../api/diagnostics";
import type { ResolvedParseOptions } from "../api/options";
import type { FormDocument, Page } from "../types/form.types";
import { applyProperties } from "./applyProperties";
import { parseSettings } from "./settings";
import {
  extractPlainText,
  paragraphText,
  parsePropertyLines,
  type RawPropertyLine,
} from "./utils";

type MarkdownProcessor = {
  parse: (content: string) => Root;
  runSync: (tree: Root) => Root;
};

export function createMarkdownProcessor(): MarkdownProcessor {
  return unified().use(remarkParse) as unknown as MarkdownProcessor;
}

type PendingQuestion = {
  label: string;
  rawLines: RawPropertyLine[];
};

export class FormParser {
  private readonly processor: MarkdownProcessor;

  constructor(
    private readonly options: ResolvedParseOptions,
    processor?: MarkdownProcessor,
  ) {
    this.processor = processor ?? createMarkdownProcessor();
  }

  parse(markdown: string): { document: FormDocument; diagnostics: Diagnostic[] } {
    const diagnostics: Diagnostic[] = [];
    let contentData: ReturnType<typeof matter>;

    try {
      contentData = matter(markdown);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse frontmatter: ${message}`);
    }

    const { settings, diagnostics: settingsDiagnostics } = parseSettings(
      contentData.data as Record<string, unknown>,
    );
    diagnostics.push(...settingsDiagnostics);

    const parsedData = this.processor.parse(contentData.content);
    const tree = this.processor.runSync(parsedData);
    removePosition(tree, { force: true });

    let titleSet = false;
    let formTitle = this.options.defaultTitle;
    let formDescription: string | undefined;
    let formDescriptionSet = false;
    let h1Count = 0;
    const pages: Page[] = [];
    let currentPage: Page | null = null;
    let pendingQuestion: PendingQuestion | null = null;

    const flushPendingQuestion = () => {
      if (!pendingQuestion || !currentPage) return;
      const { element, diagnostics: propDiagnostics } = applyProperties(
        pendingQuestion.label,
        pendingQuestion.rawLines,
      );
      diagnostics.push(...propDiagnostics);
      if (element) {
        currentPage.elements.push(element);
      }
      pendingQuestion = null;
    };

    for (const child of tree.children) {
      if (child.type === "heading") {
        const heading = child as Heading;
        const text = extractPlainText(heading);
        if (!text) continue;

        if (heading.depth === 1) {
          h1Count++;
          if (h1Count > 1) {
            diagnostics.push(
              diagnostic(
                "AMBIGUOUS_STRUCTURE",
                "info",
                `Additional form title "# ${text}" ignored; only the first H1 is used`,
              ),
            );
            continue;
          }
          flushPendingQuestion();
          formTitle = text;
          titleSet = true;
          continue;
        }

        if (heading.depth === 2) {
          flushPendingQuestion();
          currentPage = { title: text, elements: [] };
          pages.push(currentPage);
          continue;
        }

        if (heading.depth === 3) {
          if (!currentPage) {
            diagnostics.push(
              diagnostic(
                "ORPHAN_QUESTION",
                "error",
                `Question "### ${text}" has no section (##); add a section before questions`,
                { path: text },
              ),
            );
            continue;
          }
          flushPendingQuestion();
          pendingQuestion = { label: text, rawLines: [] };
          continue;
        }

        if (heading.depth >= 4) {
          diagnostics.push(
            diagnostic(
              "AMBIGUOUS_STRUCTURE",
              "warning",
              `Heading depth ${heading.depth} "${text}" is not supported as a question; use ###`,
              { path: text },
            ),
          );
        }
        continue;
      }

      const text = paragraphText(child as { type: string; children?: unknown[] });
      if (!text) continue;

      if (pendingQuestion && currentPage) {
        const looksLikeProperties = text
          .split("\n")
          .some((line) => /^#?\w+/.test(line.trim()));
        if (looksLikeProperties) {
          pendingQuestion.rawLines.push(...parsePropertyLines(text));
          continue;
        }
      }

      if (titleSet && !formDescriptionSet && pages.length === 0 && !pendingQuestion) {
        formDescription = text;
        formDescriptionSet = true;
        continue;
      }

      if (
        currentPage &&
        currentPage.elements.length === 0 &&
        !pendingQuestion &&
        currentPage.description === undefined
      ) {
        currentPage.description = text;
        continue;
      }
    }

    flushPendingQuestion();

    if (!titleSet) {
      diagnostics.push(
        diagnostic(
          "MISSING_FORM_TITLE",
          "warning",
          `No H1 form title found; using "${this.options.defaultTitle}"`,
        ),
      );
    }

    const document: FormDocument = {
      schemaVersion: 2,
      title: formTitle,
      pages,
    };
    if (formDescription) document.description = formDescription;
    if (settings) document.settings = settings;

    return { document, diagnostics };
  }
}
