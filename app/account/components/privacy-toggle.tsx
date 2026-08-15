type PrivacyToggleProps = {
  id: string;
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
  disabled?: boolean;
};

export default function PrivacyToggle({
  id,
  name,
  label,
  description,
  defaultChecked,
  disabled = false,
}: PrivacyToggleProps) {
  return (
    <label
      htmlFor={id}
      className={`flex min-h-11 items-center justify-between gap-sa-3 rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset px-sa-3 py-sa-2 ${
        disabled ? "opacity-55" : "cursor-pointer"
      }`}
    >
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-[0.08em] text-sa-text-primary">
          {label}
        </span>
        <span className="mt-0.5 block text-[11px] leading-4 text-sa-text-technical">
          {description}
        </span>
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          disabled={disabled}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full border border-sa-border-strong bg-sa-surface-2 transition-colors duration-200 ease-sa-standard peer-checked:border-sa-border-active peer-checked:bg-sa-accent/20 peer-focus-visible:ring-4 peer-focus-visible:ring-sa-accent/20" />
        <span className="absolute left-1 h-4 w-4 rounded-full bg-sa-text-technical transition-[transform,background-color] duration-200 ease-sa-standard peer-checked:translate-x-5 peer-checked:bg-sa-accent" />
      </span>
    </label>
  );
}
