"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: string;
  pendingLabel: string;
  disabled?: boolean;
};

export default function SubmitButton({ children, pendingLabel, disabled = false }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-sa-control border border-sa-border-active bg-sa-accent px-sa-4 text-sm font-black text-slate-950 outline-none transition-colors duration-200 ease-sa-standard hover:bg-[#35e1dd] focus-visible:ring-4 focus-visible:ring-sa-accent/25 disabled:cursor-not-allowed disabled:border-sa-border-subtle disabled:bg-sa-surface-2 disabled:text-sa-text-technical"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
