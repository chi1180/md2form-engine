export type FormDocument = {
  /** API / schema version (v2 = label-based, diagnostics) */
  schemaVersion?: number;
  title: string;
  description?: string;
  settings?: FormSettings;
  pages: Page[];
};

export type FormSettings = {
  collectEmail?: boolean;
  allowMultipleResponses?: boolean;
  limitResponses?: number | null;
  showProgressBar?: boolean;
  shuffleQuestions?: boolean;
  themeColor?: string;
  backgroundImage?: string;
  font?: string;
  responseReceipt?: "always" | "never" | "whenRequested";
};

export type Page = {
  title?: string;
  description?: string;
  elements: FormElement[];
};

export type FormElementBase = {
  type: ElementType;
  /** Question title from ### heading */
  label?: string;
  /** Supplementary text (not from ### heading) */
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
  | "matrix"
  | "file_upload"
  | "section_header"
  | "scale"
  | "signature"
  | "image"
  | "video"
  | "boolean";

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
  | ScaleField
  | SignatureField
  | MediaField
  | BooleanField;

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
  options?: string[];
  allowOther?: boolean;
  multiple?: false;
  default?: string | null;
  searchable?: boolean;
};

export type RadioField = FormElementBase & {
  type: "radio";
  options?: string[];
  allowOther?: boolean;
  default?: string | null;
};

export type CheckboxField = FormElementBase & {
  type: "checkbox";
  options?: string[];
  minSelected?: number | null;
  maxSelected?: number | null;
  default?: string[] | null;
};

export type DateField = FormElementBase & {
  type: "date";
  includeTime?: boolean;
  minDate?: string;
  maxDate?: string;
  default?: string | null;
};

export type TimeField = FormElementBase & {
  type: "time";
  minTime?: string;
  maxTime?: string;
  stepMinutes?: number;
  default?: string | null;
};

export type RatingField = FormElementBase & {
  type: "rating";
  scale?: number;
  labels?: { low?: string; high?: string };
  default?: number | null;
  icon?: "star" | "heart" | "circle";
};

export type LikertField = FormElementBase & {
  type: "likert";
  statements?: string[];
  scaleLabels?: string[];
  requiredPerStatement?: boolean;
};

export type MatrixField = FormElementBase & {
  type: "matrix";
  rows?: string[];
  columns?: string[];
  cellType?: "radio" | "checkbox" | "number" | "short_text";
  requiredPerRow?: boolean;
};

export type ScaleField = FormElementBase & {
  type: "scale";
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  default?: number | null;
};

export type FileUploadField = FormElementBase & {
  type: "file_upload";
  allowedTypes?: string[];
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

export type MediaField = FormElementBase & {
  type: "image" | "video";
  src?: string;
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

export type TextInputElement =
  | ShortText
  | LongText
  | NumberField
  | EmailField
  | PhoneField;
