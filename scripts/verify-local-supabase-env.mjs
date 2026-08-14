import nextEnv from "@next/env";

const EXPECTED_LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const HOSTED_OVERRIDE_NAME = "SKILLATLAS_ALLOW_HOSTED_SUPABASE";
const HOSTED_OVERRIDE_VALUE = "approved-nonproduction";
const isDevelopmentEnvironment = !process.argv.includes("--production");

const operatorOverride = process.env[HOSTED_OVERRIDE_NAME];
const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd(), isDevelopmentEnvironment, console, true);

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

if (!configuredUrl) {
  console.warn(
    "SkillAtlas local Supabase is not configured. Public pages may run, but Supabase-backed features will be unavailable."
  );
  process.exit(0);
}

let parsedUrl;

try {
  parsedUrl = new URL(configuredUrl);
} catch {
  console.error(
    `Refusing to start: NEXT_PUBLIC_SUPABASE_URL must be ${EXPECTED_LOCAL_SUPABASE_URL} for routine local development.`
  );
  process.exit(1);
}

const isExpectedLocalUrl =
  parsedUrl.protocol === "http:" &&
  parsedUrl.hostname === "127.0.0.1" &&
  parsedUrl.port === "54321" &&
  (parsedUrl.pathname === "/" || parsedUrl.pathname === "");

if (isExpectedLocalUrl) {
  console.log(`SkillAtlas local Supabase target verified: ${EXPECTED_LOCAL_SUPABASE_URL}`);
  process.exit(0);
}

if (operatorOverride === HOSTED_OVERRIDE_VALUE) {
  console.warn(
    "Hosted Supabase access explicitly enabled for this process. Confirm the target is the approved non-production project before continuing."
  );
  process.exit(0);
}

console.error(
  [
    "Refusing to start SkillAtlas against a non-local Supabase URL.",
    `Routine development must use ${EXPECTED_LOCAL_SUPABASE_URL}.`,
    `For a separately approved non-production validation only, set ${HOSTED_OVERRIDE_NAME}=${HOSTED_OVERRIDE_VALUE} for that process.`,
    "Never use this override for Production.",
  ].join("\n")
);
process.exit(1);
