import { memo } from "react";
import CountryFlag from "@/app/components/country-flag";
import type { CountryAtlasRecord } from "@/data/countries";
import styles from "../countries.module.css";

function CountryAtlasCard({ country }: { country: CountryAtlasRecord }) {
  return (
    <article className={`${styles.countryCard} rounded-2xl p-4`}>
      <div className="flex min-w-0 items-center gap-3">
        <CountryFlag country={country} size="sm" />
        <div className="min-w-0">
          <h3 className="truncate text-base font-black">{country.name}</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
            {country.region}
          </p>
        </div>
      </div>

      <div className={`${styles.achievement} mt-4 rounded-xl p-3`}>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
          Highest Achievement
        </p>
        <p className="mt-1 text-sm font-black">
          <span className="mr-1.5 text-lg text-[#ff2fa8]">#{country.highestAchievement.rank}</span>
          {country.highestAchievement.game}
        </p>
      </div>

      {country.topGames && country.topGames.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Top Games</p>
          <ol className="mt-2 grid gap-1.5 text-xs font-bold">
            {country.topGames.map((game, index) => (
              <li key={game} className="flex gap-2">
                <span className="text-[#19d3cf]">{index + 1}.</span>
                <span>{game}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}

export default memo(CountryAtlasCard);
