import { describe, expect, test } from "bun:test";
import { hasErrorSeverity, parseForm } from "../src/index";

describe("parseForm", () => {
  test("parses basic form with label on elements", () => {
    const md = `---
collectEmail: true
---
# Contact

Intro text

## Section
### Name
#type short_text
#required true
`;
    const result = parseForm(md);
    expect(result.document.title).toBe("Contact");
    expect(result.document.description).toBe("Intro text");
    expect(result.document.pages[0]?.elements[0]).toMatchObject({
      type: "short_text",
      label: "Name",
      required: true,
    });
    expect(result.document.schemaVersion).toBe(2);
  });

  test("does not treat preamble as form description", () => {
    const md = `Preamble only

# Real Title`;
    const result = parseForm(md);
    expect(result.document.title).toBe("Real Title");
    expect(result.document.description).toBeUndefined();
  });

  test("applies properties before #type in same block", () => {
    const md = `# T
## S
### Q
#required true
#type short_text`;
    const result = parseForm(md);
    const el = result.document.pages[0]?.elements[0];
    expect(el?.type).toBe("short_text");
    expect(el?.required).toBe(true);
    expect(
      result.diagnostics.some((d) => d.code === "PROPERTY_BEFORE_TYPE"),
    ).toBe(true);
  });

  test("orphan question without section", () => {
    const md = `# T
### Orphan
#type short_text`;
    const result = parseForm(md, { strict: true });
    expect(result.ok).toBe(false);
    expect(result.document.pages[0]?.elements.length ?? 0).toBe(0);
    expect(result.diagnostics.some((d) => d.code === "ORPHAN_QUESTION")).toBe(
      true,
    );
  });

  test("missing element type omits element and reports error", () => {
    const md = `# T
## S
### No Type`;
    const result = parseForm(md, { strict: true });
    expect(result.document.pages[0]?.elements.length).toBe(0);
    expect(
      result.diagnostics.some((d) => d.code === "MISSING_ELEMENT_TYPE"),
    ).toBe(true);
    expect(hasErrorSeverity(result.diagnostics)).toBe(true);
  });

  test("strict fails on invalid settings", () => {
    const md = `---
collectEmail: not-a-bool
---
# T`;
    const result = parseForm(md, { strict: true, validateSettings: true });
    expect(result.ok).toBe(false);
    expect(
      result.diagnostics.some((d) => d.code === "INVALID_SETTING_VALUE"),
    ).toBe(true);
  });

  test("parses heading with emphasis as title", () => {
    const md = `# *Bold Title*

## S
### Q
#type short_text`;
    const result = parseForm(md);
    expect(result.document.title).toBe("Bold Title");
  });

  test("long_text #rows property", () => {
    const md = `# T
## S
### Bio
#type long_text
#rows 4`;
    const result = parseForm(md);
    expect(result.document.pages[0]?.elements[0]).toMatchObject({
      type: "long_text",
      rows: 4,
    });
  });
});
