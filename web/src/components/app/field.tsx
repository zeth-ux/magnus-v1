/** A labelled form field with an optional hint and error, wired for screen readers. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] font-semibold">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-[15px] text-paper/70">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[15px] text-merah-light">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "field-dark h-13 w-full rounded-xl px-4 text-[17px] outline-none aria-invalid:border-merah-light [&>option]:text-malam";
