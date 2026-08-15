export const BIO_MAX_LENGTH = 280;
export const BIO_MAX_LINES = 3;
export const CITY_TOWN_MAX_LENGTH = 80;
export const HERITAGE_MAX_COUNTRIES = 5;

type TextValidation =
  | { valid: true; value: string | null }
  | { valid: false; message: string };

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n?/g, "\n").trim();
}

export function validateBio(value: string): TextValidation {
  const bio = normalizeLineEndings(value);

  if (!bio) return { valid: true, value: null };
  if (bio.length > BIO_MAX_LENGTH) {
    return { valid: false, message: `Bio must be ${BIO_MAX_LENGTH} characters or fewer.` };
  }
  if (bio.split("\n").length > BIO_MAX_LINES) {
    return { valid: false, message: `Bio must use no more than ${BIO_MAX_LINES} lines.` };
  }
  if (/[\u0000-\u0009\u000b-\u001f\u007f]/.test(bio)) {
    return { valid: false, message: "Bio must contain plain text only." };
  }

  return { valid: true, value: bio };
}

export function validateCityTown(value: string): TextValidation {
  const cityTown = value.trim();

  if (!cityTown) return { valid: true, value: null };
  if (cityTown.length > CITY_TOWN_MAX_LENGTH || /[\u0000-\u001f\u007f]/.test(cityTown)) {
    return {
      valid: false,
      message: `City / Town must be ${CITY_TOWN_MAX_LENGTH} plain-text characters or fewer.`,
    };
  }

  return { valid: true, value: cityTown };
}

export function parseHeritageCountryIds(value: FormDataEntryValue | null) {
  try {
    const parsed: unknown = JSON.parse(String(value ?? "[]"));
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
      return { valid: false as const, message: "Choose Heritage countries from the SkillAtlas catalogue." };
    }

    if (parsed.length > HERITAGE_MAX_COUNTRIES || new Set(parsed).size !== parsed.length) {
      return {
        valid: false as const,
        message: `Choose up to ${HERITAGE_MAX_COUNTRIES} unique Heritage countries.`,
      };
    }

    return { valid: true as const, value: parsed };
  } catch {
    return { valid: false as const, message: "Choose Heritage countries from the SkillAtlas catalogue." };
  }
}
