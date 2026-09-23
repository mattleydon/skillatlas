import Image from "next/image";

type CountryFlagSize = "sm" | "md" | "lg" | "xl";
type CountryFlagVariant = "default" | "atlas";

type CountryFlagProps = {
  country: {
    name: string;
    flagCode: string;
    flag?: string;
  };
  /** Kept for caller compatibility; every flag now uses the same 32 × 20px plate. */
  size?: CountryFlagSize;
  variant?: CountryFlagVariant;
};

export default function CountryFlag({
  country,
  variant = "default",
}: CountryFlagProps) {
  const countryCode = country.flagCode.trim().toLowerCase();

  return (
    <span
      data-variant={variant}
      className="skillatlas-country-flag"
    >
      {countryCode ? (
        <Image
          src={`https://flagcdn.com/w160/${countryCode}.png`}
          alt={`${country.name} flag`}
          fill
          sizes="32px"
          unoptimized
          className="skillatlas-country-flag-image"
        />
      ) : (
        <span className="skillatlas-country-flag-image text-sm leading-none" aria-hidden="true">
          {country.flag || "🌐"}
        </span>
      )}
    </span>
  );
}
