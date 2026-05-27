# md2form-engine Implementation Issues List

Items resolved in branch `feat/v2-api-and-parser-fixes` (v2.0.0) are marked with ✅. Unresolved items are noted as before.

---

## Items Primarily Resolved in v2

| Area | Resolution |
|------|-----------|
| Public API | `parseForm` / `ParseResult` / `Diagnostic` / `createParser` / `validateDocument` |
| Error reporting | Return warnings/errors with diagnostic codes (don't silently ignore) |
| Form description misidentification | Use `titleSet` flag to prevent pre-H1 paragraphs as description |
| Property order | Two-phase application (`#type` confirmed before applying all properties) + `PROPERTY_BEFORE_TYPE` warning |
| Headings | Support strong/link in headings via `extractPlainText` |
| Question label | Unified as `label` field (heading text) |
| `unknown` type | Removed from public union. Undecided questions omit element + `MISSING_ELEMENT_TYPE` |
| Settings | Validate only known keys, `UNKNOWN_SETTING_KEY` / `INVALID_SETTING_VALUE` |
| Page description | Stop initializing `description: ""`, use `undefined` when unset |
| Orphan questions | `###` without page → `ORPHAN_QUESTION` |
| Multiple H1 | 2nd+ → `AMBIGUOUS_STRUCTURE` (info) |
| `####` and below | `AMBIGUOUS_STRUCTURE` (warning), prevent mistaken page description |
| Enum properties | Validate `icon` / `cellType` / `captureMode` invalid values |
| `#rows` (long_text) | Support added |
| Tests | `bun test tests/` |
| Internal structure | `parser/` + `api/` + `schema/`, removed `parseEngine.ts` exports |

---

## 1. Parser Structure / Design

| Severity | Issue | v2 |
|----------|-------|-----|
| High | **No error/warning output mechanism** | ✅ `Diagnostic` |
| High | **Single-pass flag-based linear scan** | ✅ Pending question + two-phase property (scan still one-pass but state clarified) |
| Medium | **`ParserEngine` is exported** | ✅ Private `FormParser`, public is `parseForm` |
| Medium | **`parse()` async but effectively sync** | ✅ Sync `parseForm` |
| Medium | **`PROPERTY_SUPPORT` and `form.types.ts` double-managed** | ✅ Consolidated in `schema/propertySupport.ts` (types separate but validation linked) |
| Low | **Giant single `switch`** | Partially split to `applyProperties.ts`. Full plugin-ization not yet |
| Low | **`json.types.ts` unused in parser** | Unresolved (excluded from public exports) |
| Low | **unified generated per instance** | ✅ Reused via `createParser` |

---

## 2. Structure Analysis Misidentification / Oversight

| Severity | Issue | v2 |
|----------|-------|-----|
| High | **Paragraph before H1 becomes form description** | ✅ |
| High | **Properties without page go into `description`** | ✅ `ORPHAN_QUESTION`, prevent misabsorption |
| High | **Heading with only link/strong** | ✅ `extractPlainText` |
| High | **Strong in heading** | ✅ |
| Medium | **2nd+ H1** | ✅ `AMBIGUOUS_STRUCTURE` |
| Medium | **`####` below becomes page description** | ✅ Warning, prevent misassignment |
| Medium | **Page description only empty string** | ✅ `undefined` until set |
| Medium | **Form description only last paragraph** | Unresolved (spec: 1 paragraph) |
| Medium | **Pre-H1 section** | ✅ Description misidentification fixed |
| Medium | **`---` breaks property paragraph** | Unresolved (separate paragraph not merged) |
| Low | **`#key` inside list** | Unresolved |
| Low | **Rich Markdown description** | Unresolved |

---

## 3. Question / Property Processing

| Severity | Issue | v2 |
|----------|-------|-----|
| High | **Skip non-`#type` while `unknown`** | ✅ Order-independent apply |
| High | **Unknown `#type` stays unknown** | ✅ `UNSUPPORTED_ELEMENT_TYPE`, element omitted |
| High | **Missing `#type` leaves `unknown`** | ✅ `MISSING_ELEMENT_TYPE`, element omitted |
| Medium | **`split(" ")` parse** | Unresolved (first token + rest join maintained) |
| Medium | **`type` without `#` also passes** | Unresolved (`#?` regex allows. Doc needs clarification) |
| Medium | **Properties only 1 paragraph** | Unresolved |
| Medium | **Label is `description`** | ✅ Changed to `label` |
| Medium | **Invalid enum output as-is** | ✅ Warning + default |
| Medium | **`#labels` only 2 elements** | Unresolved |
| Low | **Single quotes** | ✅ Stripped |
| Low | **CSV escape spec** | Unresolved |
| Low | **default failure silent** | ✅ `INVALID_PROPERTY_VALUE` warning |
| Low | **Checkbox default single value** | Unresolved |

---

## 4. Type Definition vs Runtime Output Divergence

| Severity | Issue | v2 |
|----------|-------|-----|
| High | **Required fields missing** | ✅ `validateDocument` |
| Medium | **Scale min/max required by type** | ✅ Runtime validation, type made optional |
| Medium | **Unimplemented properties (richText, etc.)** | Unresolved |
| Medium | **section_header title/description confusion** | Partial (heading is `label`) |
| Low | **`UnknownElement` in union** | ✅ Removed |
| Low | **Settings raw data** | ✅ `parseSettings` |

---

## 5. Frontmatter / Configuration

| Severity | Issue | v2 |
|----------|-------|-----|
| Medium | **No settings schema** | ✅ |
| Low | **Invalid YAML** | ✅ `ParseError` throw (wrapped) |
| Low | **Meaning interpretation (limitResponses, etc.)** | Unresolved (preserved only) |

---

## 6. Public API / Packaging

| Severity | Issue | v2 |
|----------|-------|-----|
| Medium | **README `src/parseEngine` path** | ✅ README updated |
| Medium | **Unorganized public API** | ✅ [API-DESIGN.md](./API-DESIGN.md) implemented |
| Low | **test / typecheck scripts** | ✅ |
| Low | **`@types/bun: latest`** | Unresolved |
| Low | **tsconfig jsx** | Unresolved |

---

## 7. Tests / Quality Assurance

| Severity | Issue | v2 |
|----------|-------|-----|
| High | **No automated tests** | ✅ `tests/parseForm.test.ts` |
| Medium | **No CI** | Unresolved |
| Low | **Sample MD snapshot** | Unresolved |

---

## 8. Workspace / Documentation

| Severity | Issue | v2 |
|----------|-------|-----|
| Medium | **workspace.json output destination** | ✅ `workspace/workspace.json` |
| Low | **Console typo** | ✅ |
| Low | **README vs implementation gap** | Partially updated |
| Low | **workspace.json git tracking** | Unresolved |

---

## 9. Security / Robustness

| Severity | Issue | v2 |
|----------|-------|-----|
| Low | **src URL validation missing** | Unresolved |
| Low | **No input size limit** | Unresolved |
| Low | **Abnormal input hard to diagnose** | ✅ diagnostics |

---

## 10. Code Quality / Maintainability

| Severity | Issue | v2 |
|----------|-------|-----|
| Medium | **Type assertion overuse** | Improved (consolidated in `applyProperties`) |
| Medium | **Page description empty check** | ✅ |
| Low | **Dead comments** | ✅ Removed (old parseEngine) |
| Low | **`""` vs `undefined`** | ✅ |
| Low | **Untitled vs unset distinction** | ✅ `MISSING_FORM_TITLE` warning |

---

## 12. Future Priority Items

1. Multi-block property paragraph joining, `---` separator support
2. CI (typecheck + test + sample snapshot)
3. Sync `richText` / `allowMultiple`, etc. between type and parser
4. Position-aware `Diagnostic.line/column`

---

*Last updated: v2.0.0 (`feat/v2-api-and-parser-fixes`)*
