"use client";

type SearchBarProps = {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
};

export default function SearchBar({ label, placeholder, value, onValueChange }: SearchBarProps) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-[#19d3cf]/35 bg-white/90 px-5 pr-12 text-sm font-bold outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#19d3cf] focus:shadow-[0_0_0_4px_rgba(25,211,207,0.14)]"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#ff2fa8]">⌕</span>
    </label>
  );
}
