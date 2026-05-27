# md2form

[Documentation 🚀](https://md2form-document.pages.dev/)

A parser library that lets you define forms in Markdown and converts them into type-safe JSON.
Express page structure and questions using heading levels, and set details via simple hash notation (`#key value`).

## Key Features

- **Simple notation**: Define form structure with just Markdown headings and paragraphs
- **Type-safe**: TypeScript type definitions (`FormDocument`) for safe handling of conversion results
- **Rich question types**: Support everything from text input to rating scales and file uploads
- **Frontmatter support**: Manage form-wide settings via YAML

## Installation

```bash
npm install md2form
# or
bun add md2form
```

Development environment recommends [Bun](https://bun.sh) v1.2.18+.

```bash
git clone <repository>
cd md2form
bun install
```

## Basic Usage

### As a Library (v2)

```typescript
import { parseForm, isParsedDocument } from "md2form";

const markdown = `
---
collectEmail: true
showProgressBar: true
---

# Contact Form
Simple survey.

## Basic Info
### Your Name
#type short_text
#placeholder "John Doe"
#required true

### Age
#type number
#min 0
#max 120
`;

const result = parseForm(markdown, { strict: true, validateSettings: true });

if (!isParsedDocument(result)) {
  console.error(result.diagnostics);
  throw new Error("Invalid form markdown");
}

const form = result.document;
console.log(form.title); // "Contact Form"
console.log(form.pages[0].elements[0].type); // "short_text"
console.log(form.pages[0].elements[0].label); // "Your Name"
```

`parseMarkdownToForm` is a v1-compatible deprecated API (returns `document` only). Use `parseForm` for new code.

### Running Samples

```bash
bun run workspace
```

This parses `workspace/sample-form.md` and outputs the result to `workspace/workspace.json`.

## Markdown Schema

### Basic Structure

```markdown
---
thisIsFrontMatter: true
collectEmail: true
showProgressBar: true
---

# Form Title (required)

Form description (optional)

## Section 1

Section description (optional)

### Question 1

#type short_text
#placeholder "Example input"
#required true

### Question 2

#type radio
#options "Option1","Option2","Option3"

## Section 2

### Question 3

#type number
#min 1
#max 10
```

### Structure Rules

1. **Form Title**: First `# heading` becomes the form title
2. **Section**: `## heading` creates a new page (section)
3. **Question**: `### heading` defines a question
4. **Properties**: Write settings after question using `#key value` format in the paragraph

## Supported Question Types

### Text Input

- `short_text`: Single-line text
- `long_text`: Multi-line text
- `number`: Numeric input
- `email`: Email address
- `phone`: Phone number

### Selection

- `dropdown`: Dropdown menu
- `radio`: Radio buttons (single choice)
- `checkbox`: Checkboxes (multiple choice)

### Date/Time

- `date`: Date picker
- `time`: Time picker

### Rating/Scale

- `rating`: Star rating
- `likert`: Likert scale
- `matrix`: Matrix (rows × columns)
- `scale`: Slider

### Other

- `file_upload`: File upload
- `signature`: Signature pad
- `boolean`: Yes/No choice
- `section_header`: Section header (display only)
- `image`: Image display
- `video`: Video display

## Property List

### Common Properties

```markdown
#required true # Required field
#visible false # Show/hide
```

### Text Properties

```markdown
#placeholder "Example"
#maxLength 100
```

### Numeric Properties

```markdown
#min 0
#max 100
#step 5
```

### Selection Properties

```markdown
#options "Option1","Option2","Option3"
#allowOther true
```

### Time Properties

```markdown
#minTime "09:00"
#maxTime "18:00"
```

### Rating Properties

```markdown
#scale 5
#labels "Low","High"
#icon star
```

### File Properties

```markdown
#allowedTypes "pdf","docx"
#maxFiles 3
#maxSizeMB 10
```

## Frontmatter Configuration

```yaml
---
collectEmail: true # Collect email address
allowMultipleResponses: false # Allow multiple responses
showProgressBar: true # Show progress bar
shuffleQuestions: false # Randomize question order
responseReceipt: "whenRequested" # Response receipt notification
---
```

## Conversion Result Types

```typescript
type FormDocument = {
  title: string;
  description?: string;
  settings?: FormSettings;
  pages: Page[];
};

type Page = {
  title?: string;
  description?: string;
  elements: FormElement[];
};

type FormElement = ShortText | NumberField | RadioField | CheckboxField;
// ... other types
```

See `src/types/form.types.ts` for detailed type definitions.

## Implementation Examples

### Complete Form Example

`workspace/sample-form.md` contains a complete sample with all question types.

### Batch Processing (Processor Reuse)

```typescript
import { createParser } from "md2form";

const parser = createParser({ strict: false });
const result = parser.parse(markdownContent);
```

## Limitations / Notes

- Question properties must be written in the paragraph immediately after `### question`
- Parse issues are reported in `ParseResult.diagnostics` (enable failure detection via `strict: true` for CI)
- Question heading text is stored in the `label` field (changed from v1's `description`)
- Strong/link text in headings is normalized to plain text before interpretation

See [API-DESIGN.md](./API-DESIGN.md) for detailed API design and [PROBLEMS.md](./PROBLEMS.md) for known issues.

## Development / Contributing

```bash
# Development environment setup
git clone <repository>
cd md2form
bun install

# Run samples and tests
bun run workspace
bun test
bun run typecheck
```

## License

MIT License
