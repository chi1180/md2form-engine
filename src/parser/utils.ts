import type { Parent } from "mdast";
import type { Text } from "../types/json.types";

export function extractPlainText(node: Parent): string {
  const parts: string[] = [];
  for (const child of node.children) {
    if (child.type === "text") {
      parts.push((child as Text).value);
    } else if ("children" in child && Array.isArray(child.children)) {
      parts.push(extractPlainText(child as Parent));
    }
  }
  return parts.join("").trim();
}

export function paragraphText(child: { type: string; children?: unknown[] }): string | null {
  if (child.type !== "paragraph" || !child.children?.length) return null;
  const text = extractPlainText(child as Parent);
  return text.length > 0 ? text : null;
}

export type RawPropertyLine = {
  property: string;
  value: string;
};

export function parsePropertyLines(text: string): RawPropertyLine[] {
  const lines: RawPropertyLine[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const splitLine = trimmed.split(/\s+/);
    const key = splitLine[0]?.replace(/^#+/, "") ?? "";
    if (!key) continue;
    const value = trimmed.slice(splitLine[0]!.length).trim();
    lines.push({ property: key, value });
  }
  return lines;
}

export const toPropertyValue = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export const parseBoolean = (value: string): boolean | undefined => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

export const parseNumber = (value: string): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

export const parseInteger = (value: string): number | undefined => {
  if (!/^-?\d+$/.test(value.trim())) return undefined;
  return Number.parseInt(value.trim(), 10);
};

export const parseCsvValues = (input: string): string[] => {
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
