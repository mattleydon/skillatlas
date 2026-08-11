import { writeFile } from "node:fs/promises";

let generatedTypes = "";

process.stdin.setEncoding("utf8");

for await (const chunk of process.stdin) {
  generatedTypes += chunk;
}

if (!generatedTypes.trim()) {
  throw new Error("Supabase type generation produced no output.");
}

const outputPath = new URL("../types/database.ts", import.meta.url);
await writeFile(outputPath, `${generatedTypes.trimEnd()}\n`, "utf8");
