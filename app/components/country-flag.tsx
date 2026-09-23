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

// Every context shares the same slot; contain preserves square/non-rectangular flags.
const sizeClasses: Record<CountryFlagSize, string> = {
  sm: "h-5 w-8 rounded-sa-sm",
  md: "h-6 w-10 rounded-sa-sm",
  lg: "h-8 w-12 rounded-sa-sm",
  xl: "h-10 w-16 rounded-sa-sm",
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
      className={`relative inline-grid ${sizeClasses[size]} shrink-0 place-items-center align-middle`}
    >
      {countryCode ? (
        <Image
          src={`https://flagcdn.com/w160/${countryCode}.png`}
          alt={`${country.name} flag`}
          fill
          sizes={imageSizes[size]}
          unoptimized
          className="object-contain"
        />
      ) : (
        <span className="text-xl" aria-hidden="true">
          {country.flag || "🌐"}
        </span>
      )}
    </span>
  );
}
