/**
 * AST types for the return value of parse()
 *
 * The parse() function builds a Markdown AST using remark-parse (via unified),
 * and removes positional information with unist-util-remove-position.
 * This file defines a lightweight, serializable, MDAST-like type set for that tree.
 *
 * Notes:
 * - Position fields are intentionally omitted.
 * - The union below covers the core/common MDAST nodes and allows unknown/custom nodes via BaseNode fallback.
 * - This is intentionally permissive to remain robust against plugins or future extensions.
 */

/**
 * A generic data bucket for nodes.
 */
export type Data = Record<string, unknown> | undefined;

/**
 * Minimal base node for all AST nodes.
 * Additional properties are allowed to tolerate extensions/plugins.
 */
export type BaseNode = {
  type: string;
  data?: Data;
  [key: string]: unknown;
};

/**
 * A node that can contain children.
 */
export type Parent = BaseNode & {
  children: Node[];
};

/**
 * A node that holds a string value (e.g., text, code, html, inlineCode).
 */
export type Literal = BaseNode & {
  value: string;
};

/**
 * Root of the Markdown document.
 */
export type Root = BaseNode & {
  type: "root";
  children: Node[];
};

/**
 * Block-level nodes
 */
export type Paragraph = Parent & {
  type: "paragraph";
};

export type Heading = Parent & {
  type: "heading";
  depth: number; // 1-6
};

export type ThematicBreak = BaseNode & {
  type: "thematicBreak";
};

export type Blockquote = Parent & {
  type: "blockquote";
};

export type List = Parent & {
  type: "list";
  ordered?: boolean;
  start?: number | null;
  spread?: boolean;
  children: ListItem[];
};

export type ListItem = Parent & {
  type: "listItem";
  checked?: boolean | null; // task list item
  spread?: boolean;
};

export type HTML = Literal & {
  type: "html";
};

export type Code = Literal & {
  type: "code";
  lang?: string | null;
  meta?: string | null;
};

/**
 * Definition and references (links/images)
 */
export type Definition = BaseNode & {
  type: "definition";
  identifier: string;
  label?: string | null;
  url: string;
  title?: string | null;
};

/**
 * Table nodes (common in GFM; included for completeness)
 */
export type Table = Parent & {
  type: "table";
  align?: Array<"left" | "right" | "center" | null> | null;
  children: TableRow[];
};

export type TableRow = Parent & {
  type: "tableRow";
  children: TableCell[];
};

export type TableCell = Parent & {
  type: "tableCell";
};

/**
 * Inline/phrasing content
 */
export type Text = Literal & {
  type: "text";
};

export type Emphasis = Parent & {
  type: "emphasis";
};

export type Strong = Parent & {
  type: "strong";
};

export type Delete = Parent & {
  type: "delete";
};

export type InlineCode = Literal & {
  type: "inlineCode";
};

export type Break = BaseNode & {
  type: "break";
};

export type Link = Parent & {
  type: "link";
  url: string;
  title?: string | null;
};

export type Image = BaseNode & {
  type: "image";
  url: string;
  alt?: string | null;
  title?: string | null;
};

export type LinkReference = Parent & {
  type: "linkReference";
  identifier: string;
  label?: string | null;
  referenceType?: "shortcut" | "collapsed" | "full";
};

export type ImageReference = BaseNode & {
  type: "imageReference";
  identifier: string;
  label?: string | null;
  referenceType?: "shortcut" | "collapsed" | "full";
  alt?: string | null;
};

/**
 * Footnotes (supported by remark if enabled; included for resilience)
 */
export type FootnoteDefinition = Parent & {
  type: "footnoteDefinition";
  identifier: string;
  label?: string | null;
};

export type FootnoteReference = BaseNode & {
  type: "footnoteReference";
  identifier: string;
  label?: string | null;
};

export type Footnote = Parent & {
  type: "footnote";
};

/**
 * Union of known node types plus a fallback for unknown/custom nodes.
 */
export type KnownMdastNode =
  | Root
  | Paragraph
  | Heading
  | ThematicBreak
  | Blockquote
  | List
  | ListItem
  | HTML
  | Code
  | Definition
  | Table
  | TableRow
  | TableCell
  | Text
  | Emphasis
  | Strong
  | Delete
  | InlineCode
  | Break
  | Link
  | Image
  | LinkReference
  | ImageReference
  | FootnoteDefinition
  | FootnoteReference
  | Footnote;

/**
 * Node can be any known MDAST node or a custom extension (BaseNode).
 */
export type Node = KnownMdastNode | BaseNode;

/**
 * The parse() return type (AST root).
 */
export type Tree = Root;
