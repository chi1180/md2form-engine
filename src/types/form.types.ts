export type FormDocument = {
  title: string;
  description?: string;
  settings?: FormSettings;
  pages: Page[]; // Separated pages (for the sections of Google Forms)
};

export type FormSettings = {
  collectEmail?: boolean;
  allowMultipleResponses?: boolean;
  limitResponses?: number | null;
  showProgressBar?: boolean;
  shuffleQuestions?: boolean;
  theme?: {
    color?: string;
    backgroundImage?: string;
    font?: string;
  };
  responseReceipt?: "always" | "never" | "whenRequested";
};

// Page (section)
export type Page = {
  title?: string;
  description?: string;
  elements: FormElement[]; // Ordered elements
};

// Same fields as FormElementBase
export type FormElementBase = {
  type: ElementType;
  label?: string;
  description?: string;
  required?: boolean;
  visible?: boolean;
};

export type ElementType =
  | "short_text"
  | "long_text"
  | "number"
  | "email"
  | "phone"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "date"
  | "time"
  | "rating"
  | "likert"
  | "matrix" // Grid (row x column)
  | "file_upload"
  | "section_header"
  | "html" // Custom HTML/Description
  | "scale" // Number scale (e.g., 1-5)
  | "signature"
  | "image"
  | "video"
  | "boolean"; // yes/no toggle

export type FormElement =
  | ShortText
  | LongText
  | NumberField
  | EmailField
  | PhoneField
  | DropdownField
  | RadioField
  | CheckboxField
  | DateField
  | TimeField
  | RatingField
  | LikertField
  | MatrixField
  | FileUploadField
  | SectionHeader
  | HTMLBlock
  | ScaleField
  | SignatureField
  | MediaField
  | BooleanField;

// --- Elements ---

export type ShortText = FormElementBase & {
  type: "short_text";
  placeholder?: string;
  maxLength?: number;
  default?: string;
};

export type LongText = FormElementBase & {
  type: "long_text";
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  default?: string;
  richText?: boolean;
};

export type NumberField = FormElementBase & {
  type: "number";
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  default?: number | null;
  integerOnly?: boolean;
};

export type EmailField = FormElementBase & {
  type: "email";
  placeholder?: string;
  default?: string;
  allowMultiple?: boolean;
};

export type PhoneField = FormElementBase & {
  type: "phone";
  placeholder?: string;
  countryCodeRequired?: boolean;
  default?: string;
};

export type DropdownField = FormElementBase & {
  type: "dropdown";
  options: Option[];
  allowOther?: boolean;
  multiple?: false;
  default?: string | null;
  searchable?: boolean;
};

export type RadioField = FormElementBase & {
  type: "radio";
  options: Option[];
  allowOther?: boolean;
  default?: string | null;
};

export type CheckboxField = FormElementBase & {
  type: "checkbox";
  options: Option[];
  minSelected?: number | null;
  maxSelected?: number | null;
  default?: string[] | null;
};

export type DateField = FormElementBase & {
  type: "date";
  includeTime?: boolean;
  minDate?: string; // ISO
  maxDate?: string; // ISO
  default?: string | null;
};

export type TimeField = FormElementBase & {
  type: "time";
  minTime?: string; // "HH:MM"
  maxTime?: string;
  stepMinutes?: number;
  default?: string | null;
};

export type RatingField = FormElementBase & {
  type: "rating";
  scale?: number; // e.g., 5
  labels?: { low?: string; high?: string };
  default?: number | null;
  icon?: "star" | "heart" | "circle";
};

export type LikertField = FormElementBase & {
  type: "likert";
  statements: string[]; // Row (Estimate item)
  scaleLabels: string[]; // Col (e.i., ["Strongly disagree", ..., "Strongly agree"])
  requiredPerStatement?: boolean;
};

export type MatrixField = FormElementBase & {
  type: "matrix";
  rows: string[];
  columns: string[];
  cellType?: "radio" | "checkbox" | "number" | "short_text";
  requiredPerRow?: boolean;
};

export type ScaleField = FormElementBase & {
  type: "scale";
  min: number;
  max: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  default?: number | null;
};

export type FileUploadField = FormElementBase & {
  type: "file_upload";
  allowedTypes?: string[]; // MIME or extension
  maxFiles?: number;
  maxSizeMB?: number;
};

export type SignatureField = FormElementBase & {
  type: "signature";
  captureMode?: "draw" | "type" | "upload";
  required?: boolean;
};

export type SectionHeader = FormElementBase & {
  type: "section_header";
  title?: string;
  subtitle?: string;
};

export type HTMLBlock = FormElementBase & {
  type: "html";
  html: string;
};

export type MediaField = FormElementBase & {
  type: "image" | "video";
  src: string; // URL or asset id
  alt?: string;
  width?: number | "auto";
  height?: number | "auto";
  caption?: string;
};

export type BooleanField = FormElementBase & {
  type: "boolean";
  onLabel?: string;
  offLabel?: string;
  default?: boolean | null;
};

// Option
export type Option = {
  label: string;
  value?: string;
  hint?: string;
  imageId?: string;
  exclusive?: boolean; // "Other (please specify)" likes NOR
};
