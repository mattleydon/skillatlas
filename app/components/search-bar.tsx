"use client";

type SearchBarProps = {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  variant?: "default" | "intelligence";
};

export default function SearchBar({
  label,
  placeholder,
  value,
  onValueChange,
  variant = "default",
}: SearchBarProps) {
  const intelligence = variant === "intelligence";

  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className={
          intelligence
            ? "h-11 w-full rounded-sa-control border border-sa-border-subtle bg-sa-surface-1 px-sa-3 pr-10 text-sm font-semibold text-sa-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15 lg:h-10"
            : "h-14 w-full rounded-2xl border border-[#19d3cf]/35 bg-white/90 px-5 pr-12 text-sm font-bold outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#19d3cf] focus:shadow-[0_0_0_4px_rgba(25,211,207,0.14)]"
        }
      />
      <svg
        viewBox="0 0 20 20"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
          intelligence ? "right-3 h-[18px] w-[18px] text-sa-accent" : "right-4 h-5 w-5 text-[#ff2fa8]"
        }`}
        aria-hidden="true"
      >
        <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m12.4 12.4 4.1 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    </label>
  );
}
