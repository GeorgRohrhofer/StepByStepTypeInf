// Service layer / parser submodule.
//
// Character constants used by the lambda parser and printer. Pure data, no
// behaviour; kept next to the parser/formatter so the parser's "public API"
// stays self-contained.

export const COMPOSE_CHAR = "°";
export const COMPOSE_CHAR_ALT = "\u{2022}"; // •

export const LAMBDA_CHAR = "\\";
export const LAMBDA_CHAR_ALT = "\u{03BB}"; // λ
