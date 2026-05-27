# md2form API Design Policy

With the assumption of being called externally as a library, we keep the public interface small and predictable while directly addressing the robustness, maintainability, and extensibility issues raised in [PROBLEMS.md](./PROBLEMS.md).

---

## 1. Design Goals

| Goal | Meaning | Alignment with PROBLEMS.md |
|------|---------|---------------------------|
| **Robust** | Do not silently pass invalid input. Allow users to judge "was it successful?" and "what broke?" | Error ignoring, `unknown` residue, type vs runtime divergence |
| **Maintainable** | Keep the public API surface small. Implementation (remark / traversal logic) stays internal | `ParserEngine` leakage, double management, giant switch |
| **Scalable** | As use cases grow (batch processing, CLI, editor integration), don't proliferate APIs | Processor reuse, future plugins |
| **Type-safe** | TypeScript users can trust the type after successful parsing | Missing required fields, `label` / `description` confusion |

---

## 2. Conclusion: Should We Use Classes Extensively?

**No. The center of the public API should be functions + explicit result types.**

| Approach | Adopted | Reasoning |
|----------|---------|-----------|
| **Functions (recommended, default)** | ✅ | `import { parseForm } from "md2form"` alone is complete. Stateless, easy to test, tree-shake, and infer types |
| **Factory (optional)** | ✅ Limited | For high-frequency and batch scenarios. Share remark/unified build costs. `createParser(options)` → `{ parse(input) }` |
| **Public classes (`ParserEngine`, etc.)** | ❌ | Mutable state (`form`, `tree`) leaks, depends on call order, and makes PROBLEMS misidentifications look like "specification" |
| **Inheritance / plugin base classes** | ❌ For now | Extension points via `options` / future subpaths. Don't lock in class hierarchies too early |

**Internal implementation** can use classes (`ParserEngine` → private `FormParser`, etc.). Only the **boundary visible from npm** should lean toward functional style.

```
User
  └─ parseForm(markdown, options?)  ──►  ParseResult
  └─ createParser(options)?          ──►  { parse(markdown) → ParseResult }
        │
        ▼ (private)
      FormParser / remark pipeline
```

---

## 3. Public Surface Principles

### 3.1 Single Entry Point (for now)

Only `exports["."]` in `package.json` is **supported**.

- ✅ `parseForm` (or v2 name, see below)
- ✅ `FormDocument` and other **form domain types**
- ✅ `ParseResult`, `Diagnostic`, `ParseOptions`
- ❌ Direct source imports like `md2form/src/parseEngine` (remove from README)
- ❌ Re-export of remark / unified / gray-matter types / implementations

**Subpaths** (`md2form/types`, etc.) may be considered in the future for large projects needing only types. Don't add them initially.

### 3.2 Express Success and Failure via Result Type

The current `parseMarkdownToForm(): Promise<FormDocument>` locks in the "silent ignore" problem at the API level.

**Recommended signature (v2 target):**

```ts
type ParseResult = {
  /** Completed document after parsing (may include warnings) */
  document: FormDocument;
  /** Errors, warnings, info. Empty means no issues */
  diagnostics: Diagnostic[];
  /** false when strict and has errors. true otherwise */
  ok: boolean;
};

function parseForm(
  markdown: string,
  options?: ParseOptions,
): ParseResult;
```

- **Exceptions** only for "input totally unreadable" cases like YAML parse failure (`ParseError` thrown).
- Schema issues (`unknown` residue, missing required properties) **don't throw** → go to `diagnostics`, allowing callers to handle in CI / editors.

### 3.3 Split Usage Scenarios via `strict` Mode

```ts
type ParseOptions = {
  /**
   * true: error-level diagnostic makes ok === false.
   *       Don't trust document if needed (use with type guards).
   * false (default): return document as much as possible, put issues in diagnostics.
   */
  strict?: boolean;

  /** Fallback when title not found (default: "Untitled Form") */
  defaultTitle?: string;

  /** Validate settings as FormSettings (default: true recommended) */
  validateSettings?: boolean;
};
```

| User | Recommended Setting |
|------|---------------------|
| Production rendering (partial display even with broken MD) | `strict: false` + log diagnostics |
| CLI / CI / Editor | `strict: true` + `ok` for exit code |
| Type-safe TS app build | `strict: true` + `ParsedFormDocument` type guard (see below) |

### 3.4 Prioritize Synchronous API

No true async beyond `processor.run`, so **main is sync** `parseForm`.

- v1's `parseMarkdownToForm` remains as **deprecated alias**, internally returning sync result (wrap with `Promise.resolve`) or remove in next major.
- Add `parseFormAsync` only when library handles file IO in the future.

---

## 4. Domain Model (Types) Cleanup

Use API design to absorb PROBLEMS' type divergence.

### 4.1 Unify Question Label as `label`

| Current | v2 |
|---------|-----|
| Heading text → `description` | Heading text → **`label`** |
| `description` is form/page/question supplement | Same (only from paragraph explanation) |

**Breaking change**, but aligns with library consumers' mental model. Include 1 migration guide.

### 4.2 Remove `unknown` from Public Union

Parsing-stage `unknown` stays **internal**.

- Exclude `UnknownElement` from public `FormElement`
- Undecided questions report diagnostic at parse end (e.g., `MISSING_ELEMENT_TYPE`)
  - `strict: false` → either **omit** elements or return via explicit `IncompleteElement` **separate type** (TBD, default: **omit + diagnostic** for clean JSON)
  - `strict: true` → `ok: false`

### 4.3 Post-Parse-Success-Only Type (Brand or Alias)

```ts
/** Obtainable only when diagnostics has no errors (with type guard) */
type ParsedFormDocument = FormDocument & {
  readonly __brand: unique symbol;
};

function isParsedDocument(
  result: ParseResult,
): result is ParseResult & { document: ParsedFormDocument; ok: true };
```

Internally, run **validate function** once (check required fields), converting PROBLEMS' "dropdown but no options" to `error`. This connects TS user trust with implementation.

### 4.4 Validate `FormSettings` During Parse

Don't embed raw `gray-matter` object as-is.

- Allow only known keys + type check
- Unknown key → `warning` (`UNKNOWN_SETTING_KEY`)
- Type mismatch → `error` (`INVALID_SETTING_VALUE`)

### 4.5 Exported Type Layers

| Layer | Example | Public |
|-------|---------|--------|
| Domain | `FormDocument`, `Page`, `ShortText`, … | ✅ Main |
| Parse meta | `ParseResult`, `Diagnostic`, `DiagnosticCode` | ✅ Main |
| MDAST | From `json.types.ts` | ❌ Private for now (consider `md2form/ast` if debug demand appears) |

---

## 5. Diagnostic Design (Robustness Core)

Many PROBLEMS can be "solved by reporting"—clear the API.

```ts
type Severity = "error" | "warning" | "info";

type DiagnosticCode =
  | "MISSING_FORM_TITLE"
  | "MISSING_ELEMENT_TYPE"
  | "UNSUPPORTED_ELEMENT_TYPE"
  | "UNSUPPORTED_PROPERTY"
  | "INVALID_PROPERTY_VALUE"
  | "MISSING_REQUIRED_FIELD"      // e.g., dropdown without options
  | "PROPERTY_BEFORE_TYPE"          // #required before #type
  | "ORPHAN_QUESTION"               // ### without page
  | "AMBIGUOUS_STRUCTURE"           // Multiple H1, #### question, etc.
  | "UNKNOWN_SETTING_KEY"
  | "INVALID_SETTING_VALUE";

type Diagnostic = {
  code: DiagnosticCode;
  severity: Severity;
  message: string;
  /** Future: position in MD */
  line?: number;
  column?: number;
  /** Related question label or property name */
  path?: string;
};
```

**Rules:**

- `error` … causes `ok: false` in `strict: true`. Don't use this element in production.
- `warning` … document returned but fix recommended (`unknown` equivalent, ignored properties)
- `info` … allowed by spec but take note (2nd H1, etc.)

---

## 6. Recommended API List (v2 Target)

### 6.1 Required (Main Entry)

```ts
// Sync, only recommended entry point
export function parseForm(
  markdown: string,
  options?: ParseOptions,
): ParseResult;

// Types & diagnostics
export type { FormDocument, FormElement, Page, FormSettings, /* ... */ };
export type { ParseResult, ParseOptions, Diagnostic, DiagnosticCode, Severity };

export function isParsedDocument(result: ParseResult): boolean;
export function validateDocument(doc: FormDocument): Diagnostic[];
```

### 6.2 Optional (Performance)

```ts
export type Parser = {
  parse(markdown: string): ParseResult;
};

/** Reuse unified processor (for batch conversion) */
export function createParser(options?: ParseOptions): Parser;
```

### 6.3 Deprecated (v1 compat)

```ts
/** @deprecated Remove in v2. Use parseForm */
export function parseMarkdownToForm(
  markdown: string,
): Promise<FormDocument>;
```

Implementation: Internally call `parseForm`, return just `document` even if `ok === false` for v1 compat (behavior unchanged). Note as deprecated in README.

### 6.4 Don't Expose

| Symbol | Reason |
|--------|--------|
| `ParserEngine` | Mutable, order-dependent, hard to test |
| `tree` / remark `Root` | Parse internals. Debug via diagnostic + future subpath |
| `PROPERTY_SUPPORT` | Spec single source is schema / validator |
| `json.types` all | Irrelevant to domain consumers |

---

## 7. Implementation Layer (Internal Structure)

Internal split to keep API clean.

```
src/
  index.ts              … public re-export only (thin)
  api/
    parseForm.ts        … public function, ParseResult
    options.ts
    diagnostics.ts
  parser/
    FormParser.ts       … old ParserEngine (private)
    buildDocument.ts    … AST → FormDocument
    applyProperties.ts
    validate.ts         … for ParsedFormDocument
  schema/               … single source (future: property/type definitions)
  types/
    form.types.ts
```

- **Schema-driven**: Consolidate `PROPERTY_SUPPORT` and `form.types` two-management into `schema/` (PROBLEMS §1, §4).
- **Two-phase parse**: Collect properties as raw first, apply all after `#type` confirmed (PROBLEMS §3 order issue).
- **Heading text**: Unify via `extractPlainText(heading)` (PROBLEMS §2).

---

## 8. Extensibility (Scale) Reserve

Not in initial API but design doesn't block it.

| Future | Extension Method |
|--------|------------------|
| Custom element types | `ParseOptions.plugins` or separate package `md2form-plugin-*` |
| Markdown extensions (GFM tables, etc.) | Replace internal remark config via `createParser` options |
| Position-aware diagnostic | Mandate `Diagnostic.line/column` |
| JSON Schema output | Generate from same schema as `validateDocument` |
| WASM / Browser | Sync `parseForm` + lightweight deps. Public API unchanged |

**Versioning:**

- Semantic versioning
- Optional `schemaVersion: 1` on `FormDocument` (bump for breaking changes)

---

## 9. Usage Examples (Expected)

### 9.1 General Library Use

```ts
import { parseForm, isParsedDocument } from "md2form";

const result = parseForm(markdown, { strict: true, validateSettings: true });

if (!isParsedDocument(result)) {
  for (const d of result.diagnostics) {
    console.error(d.code, d.message);
  }
  throw new Error("Invalid form markdown");
}

renderForm(result.document);
```

### 9.2 CI

```ts
const { ok, diagnostics } = parseForm(fs.readFileSync("form.md", "utf8"), {
  strict: true,
});
if (!ok) {
  process.exitCode = 1;
  console.error(formatDiagnostics(diagnostics));
}
```

### 9.3 Batch (Factory)

```ts
import { createParser } from "md2form";

const parser = createParser({ strict: false });
for (const file of files) {
  const { document, diagnostics } = parser.parse(read(file));
  // ...
}
```

---

## 10. Migration (v1.1.x → v2)

| v1 | v2 |
|----|-----|
| `await parseMarkdownToForm(md)` | `parseForm(md)` |
| Question heading `element.description` | `element.label` |
| `type: "unknown"` element | Removed → see `diagnostics` |
| `ParserEngine` direct use | Not supported. Use `createParser` |
| Import all types | `import type { FormDocument } from "md2form"` only |

---

## 11. Decision Summary

1. **Public API function-first**. Classes internal only.
2. **`ParseResult` + `Diagnostic`** ensure robustness. Don't silently ignore.
3. **`strict` / `validateSettings`** branch usage scenarios.
4. **Sync `parseForm` is primary**. Async for compat only.
5. **Clean up domain types** (`label`, `unknown` private, post-parse validation).
6. **Single entry `md2form`**. Hide impl paths, MDAST.
7. **Optional `createParser`**. For batch only.
8. Implementation: **schema single source + two-phase parse** addresses PROBLEMS root causes.

---

## 12. Next Actions (Implementation Order)

1. Add `Diagnostic` / `ParseResult` / `ParseOptions` types (behavior still v1 for now)
2. Implement `parseForm`, make `parseMarkdownToForm` thin wrapper
3. Parse-end `validateDocument` + diagnostic generation
4. `label` rename and `unknown` removal (breaking change → major v2)
5. Move `ParserEngine` to `parser/`, remove export
6. Align README / PROBLEMS docs with this document

---

*Related: [PROBLEMS.md](./PROBLEMS.md) · Current public surface: `src/index.ts` (v1.1.7)*
