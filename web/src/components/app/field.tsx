/**
 * A labelled form field with an optional hint and error, wired for screen
 * readers through aria-describedby. Errors aren't live regions: the form moves
 * focus to the first invalid field instead (one announcement, in context).
 */
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
        <p id={`${id}-error`} className="text-[15px] text-merah-light">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** aria props for a field: invalid state and the hint/error it's described by. */
export function described(id: string, error?: string, hint = false) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return { "aria-invalid": error ? true : undefined, "aria-describedby": ids || undefined } as const;
}

/** Move focus to the first invalid field in a form (after a failed submit). */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

export const inputClass =
  "field-dark h-13 w-full rounded-xl px-4 text-[17px] outline-none aria-invalid:border-merah-light [&>option]:text-malam";
