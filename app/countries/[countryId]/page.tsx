import Link from "next/link";
import { notFound } from "next/navigation";
import CountryFlag from "@/app/components/country-flag";
import { ROUTES } from "@/constants/routes";
import { getSovereignCountryById, sovereignCountries } from "@/data/countries";
import styles from "../countries.module.css";

export function generateStaticParams() {
  return sovereignCountries.map((country) => ({ countryId: country.id }));
}

export default async function CountryAtlasEntryPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  const country = getSovereignCountryById(countryId);
  if (!country) notFound();

  return (
    <main className={`${styles.shell} relative min-h-screen overflow-hidden`}>
      <div className="skillatlas-page-shell relative z-10 mx-auto max-w-3xl pb-16">
        <Link
          href={ROUTES.countries}
          className={`${styles.placeholderBackLink} inline-flex min-h-11 items-center rounded-sa-control border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-in-out hover:border-[#19d3cf] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#19d3cf]/20`}
        >
          <span className="mr-2" aria-hidden="true">&larr;</span>
          Back to Countries
        </Link>

        <section className="mt-6 rounded-sa-panel border border-sa-border-subtle bg-sa-surface-1 p-sa-4 sm:p-sa-5">
          <div className="flex items-center gap-4">
            <CountryFlag country={country} size="lg" />
            <div className="min-w-0">
              <p className="sa-type-label text-[10px] text-[#19d3cf]">
                Country Atlas Entry
              </p>
              <h1 className="sa-type-page-title mt-1 break-words">
                {country.name}
              </h1>
              <p className={`${styles.placeholderMutedText} mt-1 text-sm font-normal`}>
                {country.region}
              </p>
            </div>
          </div>

          <div className="mt-sa-5 rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset p-sa-4">
            <p className="sa-type-label text-[10px] text-gray-500">
              Highest Achievement
            </p>
            <p className="mt-2 text-xl font-medium">
              <span className="text-[#ff2fa8]">#{country.highestAchievement.rank}</span>{" "}
              {country.highestAchievement.game}
            </p>
          </div>

          <p className={`${styles.placeholderMutedText} mt-7 text-sm font-normal leading-7`}>
            Detailed country information is coming in a future release.
          </p>
        </section>
      </div>
    </main>
  );
}
