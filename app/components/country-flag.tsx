import Image from "next/image";

type CountryFlagSize = "sm" | "md" | "lg" | "xl";
type CountryFlagVariant = "default" | "atlas";

type CountryFlagProps = {
  country: {
    name: string;
    flagCode: string;
    flag?: string;
  };
  size?: CountryFlagSize;
  variant?: CountryFlagVariant;
};

const imageSizes: Record<CountryFlagSize, string> = {
  sm: "32px",
  md: "40px",
  lg: "48px",
  xl: "64px",
};

export default function CountryFlag({
  country,
  size = "md",
  variant = "default",
}: CountryFlagProps) {
  const countryCode = country.flagCode.trim().toLowerCase();

  return (
    <span
      data-variant={variant}
      data-size={size}
      className="skillatlas-country-flag"
    >
      {countryCode ? (
        <Image
          src={`https://flagcdn.com/w160/${countryCode}.png`}
          alt={`${country.name} flag`}
          fill
          sizes={imageSizes[size]}
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
