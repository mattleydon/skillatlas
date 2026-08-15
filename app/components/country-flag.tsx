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

const sizeClasses: Record<CountryFlagSize, string> = {
  sm: "h-8 w-8 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
  lg: "h-14 w-14 rounded-3xl",
  xl: "h-16 w-16 rounded-3xl",
};

const atlasSizeClasses: Record<CountryFlagSize, string> = {
  sm: "h-5 w-8 rounded-[2px]",
  md: "h-6 w-10 rounded-[2px]",
  lg: "h-8 w-12 rounded-[2px]",
  xl: "h-10 w-16 rounded-[2px]",
};

export default function CountryFlag({
  country,
  size = "md",
  variant = "default",
}: CountryFlagProps) {
  const countryCode = country.flagCode.trim().toLowerCase();
  const sizing = variant === "atlas" ? atlasSizeClasses[size] : sizeClasses[size];

  return (
    <span
      className={`grid ${sizing} shrink-0 place-items-center overflow-hidden bg-gray-50 ${
        variant === "atlas" ? "border border-sa-border-strong" : "shadow-inner"
      }`}
    >
      {countryCode ? (
        <img
          src={`https://flagcdn.com/w160/${countryCode}.png`}
          alt={`${country.name} flag`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-xl" aria-hidden="true">
          {country.flag || "🌐"}
        </span>
      )}
    </span>
  );
}
