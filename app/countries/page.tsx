import CountriesAtlas from "./countries-atlas";
import { Suspense } from "react";

export default function CountriesPage() {
  return <Suspense fallback={<main className="skillatlas-page-shell">Loading country index…</main>}><CountriesAtlas /></Suspense>;
}
