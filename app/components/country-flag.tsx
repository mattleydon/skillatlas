type CountryFlagSize = "sm" | "md" | "lg" | "xl";

type CountryFlagProps = {
  country: {
    name: string;
    flagCode: string;
    flag?: string;
  };
  size?: CountryFlagSize;
};

const sizeClasses: Record<CountryFlagSize, string> = {
  sm: "h-8 w-8 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
  lg: "h-14 w-14 rounded-3xl",
  xl: "h-16 w-16 rounded-3xl",
};

export default function CountryFlag({ country, size = "md" }: CountryFlagProps) {
  const countryCode = country.flagCode.trim().toLowerCase();

  return (
    <span
      className={`grid ${sizeClasses[size]} shrink-0 place-items-center overflow-hidden bg-gray-50 shadow-inner`}
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
