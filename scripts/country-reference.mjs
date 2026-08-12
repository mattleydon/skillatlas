import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");
const countrySourcePath = join(repositoryRoot, "data", "countries.ts");
const migrationsDirectory = join(repositoryRoot, "supabase", "migrations");
const startMarker = "-- BEGIN GENERATED CANONICAL COUNTRIES";
const endMarker = "-- END GENERATED CANONICAL COUNTRIES";
const allowedRegions = new Set([
  "Africa",
  "Asia",
  "Europe",
  "Middle East",
  "North America",
  "Oceania",
  "South America",
]);

function escapeSqlLiteral(value) {
  return value.replaceAll("'", "''");
}

async function loadCanonicalCountries() {
  const source = await readFile(countrySourcePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: countrySourcePath,
  });
  const encodedModule = Buffer.from(outputText).toString("base64");
  const countryModule = await import(`data:text/javascript;base64,${encodedModule}`);
  const countries = countryModule.sovereignCountries;

  if (!Array.isArray(countries) || countries.length !== 195) {
    throw new Error(`Expected 195 sovereign countries, received ${countries?.length ?? "none"}.`);
  }

  const ids = new Set();
  const iso2Codes = new Set();

  return countries.map((country) => {
    const record = {
      id: String(country.id),
      iso2: String(country.flagCode).toUpperCase(),
      name: String(country.name),
      region: String(country.region),
    };

    if (ids.has(record.id)) throw new Error(`Duplicate canonical country id: ${record.id}`);
    if (iso2Codes.has(record.iso2)) throw new Error(`Duplicate canonical ISO2 code: ${record.iso2}`);
    if (!/^[A-Z]{2}$/.test(record.iso2)) throw new Error(`Invalid ISO2 code: ${record.iso2}`);
    if (!allowedRegions.has(record.region)) throw new Error(`Invalid country region: ${record.region}`);
    if (!record.name.trim()) throw new Error(`Country ${record.id} has no name.`);

    ids.add(record.id);
    iso2Codes.add(record.iso2);
    return record;
  });
}

function renderCountryValues(countries) {
  return countries
    .map(
      ({ id, iso2, name, region }) =>
        `  ('${escapeSqlLiteral(id)}', '${escapeSqlLiteral(iso2)}', '${escapeSqlLiteral(name)}', '${escapeSqlLiteral(region)}')`
    )
    .join(",\n");
}

async function findProfileMigration() {
  const migrations = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith("_create_member_profiles.sql"))
    .sort();

  if (migrations.length !== 1) {
    throw new Error(`Expected one member-profile migration, found ${migrations.length}.`);
  }

  return join(migrationsDirectory, migrations[0]);
}

const mode = process.argv[2];

if (mode !== "--write" && mode !== "--check") {
  throw new Error("Usage: node scripts/country-reference.mjs --write|--check");
}

const countries = await loadCanonicalCountries();
const expectedValues = renderCountryValues(countries);
const migrationPath = await findProfileMigration();
const migration = await readFile(migrationPath, "utf8");
const start = migration.indexOf(startMarker);
const end = migration.indexOf(endMarker);

if (start < 0 || end < 0 || end <= start) {
  throw new Error("Canonical country generation markers are missing or malformed.");
}

const valuesStart = start + startMarker.length;
const actualValues = migration
  .slice(valuesStart, end)
  .replaceAll("\r\n", "\n")
  .replace(/^\n+|\n+$/g, "");

if (mode === "--write") {
  const updatedMigration = `${migration.slice(0, valuesStart)}\n${expectedValues}\n${migration.slice(end)}`;
  await writeFile(migrationPath, updatedMigration, "utf8");
  console.log(`Wrote ${countries.length} canonical countries to ${pathToFileURL(migrationPath).pathname}.`);
} else {
  if (actualValues !== expectedValues) {
    const firstDifference = [...actualValues].findIndex(
      (character, index) => character !== expectedValues[index]
    );
    throw new Error(
      `Migration country reference data differs from data/countries.ts at character ${firstDifference} ` +
        `(migration ${actualValues.length}, expected ${expectedValues.length}; ` +
        `starts ${JSON.stringify(actualValues.slice(0, 12))} vs ${JSON.stringify(expectedValues.slice(0, 12))}). ` +
        "Run countries:reference:write."
    );
  }

  console.log(`Canonical country reference matches all ${countries.length} sovereign application records.`);
}
