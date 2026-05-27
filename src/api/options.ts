export type ParseOptions = {
  /** error 級 diagnostic があるとき ok === false（既定: false） */
  strict?: boolean;
  /** タイトル未検出時のフォールバック（既定: "Untitled Form"） */
  defaultTitle?: string;
  /** settings を FormSettings として検証（既定: true） */
  validateSettings?: boolean;
};

export type ResolvedParseOptions = {
  strict: boolean;
  defaultTitle: string;
  validateSettings: boolean;
};

export const DEFAULT_PARSE_OPTIONS: ResolvedParseOptions = {
  strict: false,
  defaultTitle: "Untitled Form",
  validateSettings: true,
};

export function resolveParseOptions(
  options?: ParseOptions,
): ResolvedParseOptions {
  return {
    strict: options?.strict ?? DEFAULT_PARSE_OPTIONS.strict,
    defaultTitle: options?.defaultTitle ?? DEFAULT_PARSE_OPTIONS.defaultTitle,
    validateSettings:
      options?.validateSettings ?? DEFAULT_PARSE_OPTIONS.validateSettings,
  };
}
