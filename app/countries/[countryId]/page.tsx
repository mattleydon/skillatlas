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
      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-[108px] sm:px-6 sm:pt-[124px] lg:px-8 lg:pt-[152px]">
        <Link
          href={ROUTES.countries}
          className={`${styles.placeholderBackLink} inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-black transition-colors duration-200 ease-in-out hover:border-[#19d3cf] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#19d3cf]/20`}
        >
          <span className="mr-2" aria-hidden="true">&larr;</span>
          Back to Countries
        </Link>

        <section className={`${styles.panel} mt-6 rounded-3xl p-6 sm:p-9`}>
          <div className="flex items-center gap-4">
            <CountryFlag country={country} size="lg" />
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">
                Country Atlas Entry
              </p>
              <h1 className="mt-1 break-words text-3xl font-black tracking-tight sm:text-4xl">
                {country.name}
              </h1>
              <p className={`${styles.placeholderMutedText} mt-1 text-sm font-bold`}>
                {country.region}
              </p>
            </div>
          </div>

          <div className={`${styles.achievement} mt-7 rounded-2xl p-5`}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              Highest Achievement
            </p>
            <p className="mt-2 text-xl font-black">
              <span className="text-[#ff2fa8]">#{country.highestAchievement.rank}</span>{" "}
              {country.highestAchievement.game}
            </p>
          </div>

          <p className={`${styles.placeholderMutedText} mt-7 text-sm font-semibold leading-7`}>
            Detailed country information is coming in a future release.
          </p>
        </section>
      </div>
    </main>
  );
}
