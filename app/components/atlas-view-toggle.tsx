"use client";

type AtlasViewToggleProps<View extends string> = {
  value: View;
  cardsValue: View;
  tableValue: View;
  onChange: (value: View) => void;
};

export default function AtlasViewToggle<View extends string>({
  value,
  cardsValue,
  tableValue,
  onChange,
}: AtlasViewToggleProps<View>) {
  return (
    <div className="flex rounded-full border border-gray-200 bg-white/70 p-1">
      <button
        type="button"
        onClick={() => onChange(cardsValue)}
        className={`rounded-full px-5 py-2 text-xs font-black transition-all duration-300 ${
          value === cardsValue ? "bg-[#19d3cf] text-white shadow-lg shadow-[#19d3cf]/20" : "text-gray-600 hover:text-[#19d3cf]"
        }`}
      >
        Cards
      </button>
      <button
        type="button"
        onClick={() => onChange(tableValue)}
        className={`rounded-full px-5 py-2 text-xs font-black transition-all duration-300 ${
          value === tableValue ? "bg-[#ff2fa8] text-white shadow-lg shadow-[#ff2fa8]/20" : "text-gray-600 hover:text-[#ff2fa8]"
        }`}
      >
        Table
      </button>
    </div>
  );
}
