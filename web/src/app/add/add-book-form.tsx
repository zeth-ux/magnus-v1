"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { addCopy, findBook, type AddState } from "./actions";
import { Scanner } from "./scanner";
import { described, Field, focusFirstInvalid, inputClass } from "@/components/app/field";
import { CONDITIONS, LEND_MAX } from "@/lib/books/validate";
import type { BookInfo } from "@/lib/books/lookup";

/**
 * Add a book in two steps: find it (scan or type the ISBN; we fill in the
 * details), then say give or lend. Everything is checked again on the server,
 * and the book's shared details are decided there, not by this form.
 */
export function AddBookForm() {
  // "Add another" starts a fresh form by remounting it.
  const [round, setRound] = useState(0);
  return <AddBookFlow key={round} onAgain={() => setRound((r) => r + 1)} />;
}

function AddBookFlow({ onAgain }: { onAgain: () => void }) {
  const [state, action, pending] = useActionState<AddState, FormData>(addCopy, { status: "idle" });
  const [query, setQuery] = useState("");
  // The ISBN that was actually looked up (not whatever is in the box now).
  const [found, setFound] = useState<{ isbn: string; book: BookInfo | null } | null>(null);
  const [lookup, setLookup] = useState<"idle" | "unknown" | "invalid">("idle");
  const [scanning, setScanning] = useState(false);
  const [finding, startFinding] = useTransition();
  const values = state.status === "error" ? state.values : null;
  const [mode, setMode] = useState<"give" | "lend">("lend");
  const formRef = useRef<HTMLFormElement>(null);
  const doneHeading = useRef<HTMLParagraphElement>(null);

  const find = useCallback((value: string) => {
    startFinding(async () => {
      const res = await findBook(value);
      if (res.status === "found") {
        setFound({ isbn: res.book.isbn, book: res.book });
        setQuery(res.book.isbn);
        setLookup("idle");
      } else if (res.status === "unknown") {
        setFound({ isbn: res.isbn, book: null });
        setLookup("unknown");
      } else {
        setFound(null);
        setLookup("invalid");
      }
    });
  }, []);

  const onDetected = useCallback(
    (isbn: string) => {
      setScanning(false);
      setQuery(isbn);
      find(isbn);
    },
    [find],
  );

  // After a submit: on success, focus the confirmation; on errors, the first invalid field.
  useEffect(() => {
    if (state.status === "added") doneHeading.current?.focus();
    if (state.status === "error") focusFirstInvalid(formRef.current);
  }, [state]);

  if (state.status === "added") {
    return (
      <div role="status" className="relative flex max-w-[32rem] flex-col gap-4 rounded-[10px] bg-paper p-7 text-malam">
        <p ref={doneHeading} tabIndex={-1} className="font-display text-2xl font-semibold outline-none">
          {state.title} is on the shelf.
        </p>
        <p className="text-[17px] leading-relaxed">
          {state.mode === "give"
            ? "When someone asks for it, you'll agree a meet-up. Giving it earns you 1 credit."
            : "When someone asks to borrow it, you'll agree a meet-up and a return date."}
        </p>
        {state.starter ? (
          <span className="absolute -top-4 right-5 rotate-[8deg] rounded-[4px] border-[3px] border-merah bg-paper px-3 py-1 font-display text-[17px] font-semibold text-merah">
            +1 starter credit
          </span>
        ) : null}
        <div className="flex flex-wrap gap-4 pt-1">
          <button type="button" onClick={onAgain} className="rounded-full bg-malam px-6 py-3 text-[17px] font-semibold text-paper">
            Add another
          </button>
          <Link href="/me" className="self-center text-[15px] font-semibold text-malam underline underline-offset-4">
            See your credits
          </Link>
        </div>
      </div>
    );
  }

  const errors = state.status === "error" ? state.errors : {};
  const book = found?.book ?? null;
  const showDetails = found !== null;
  // Radios are controlled by `mode`; what was submitted always equals it, so
  // after an error the choice is already right.
  const lendSelected = mode === "lend";

  return (
    <div className="flex max-w-[34rem] flex-col gap-8">
      {/* Step 1: find the book */}
      <section aria-labelledby="find-heading" className="flex flex-col gap-4">
        <h2 id="find-heading" className="font-display text-xl font-semibold">
          1. Find your book
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[14rem] flex-1 flex-col gap-2">
            <label htmlFor="isbn-find" className="text-[15px] font-semibold">
              ISBN (the number under the barcode)
            </label>
            <input
              id="isbn-find"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  find(query);
                }
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="978…"
              maxLength={20}
              aria-describedby="find-result isbn-error"
              aria-invalid={lookup === "invalid" || errors.isbn ? true : undefined}
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => find(query)}
            disabled={finding || query.trim() === ""}
            className="h-13 rounded-full border-[1.5px] border-paper/70 px-6 text-[17px] font-semibold disabled:opacity-50"
          >
            {finding ? "Looking…" : "Find"}
          </button>
          <button
            type="button"
            aria-expanded={scanning}
            onClick={() => setScanning((s) => !s)}
            className="h-13 rounded-full bg-paper px-6 text-[17px] font-semibold text-malam"
          >
            {scanning ? "Stop scanning" : "Scan barcode"}
          </button>
        </div>
        {scanning ? <Scanner onDetected={onDetected} onClose={() => setScanning(false)} /> : null}
        <p id="find-result" aria-live="polite" className="text-[15px] text-paper/80">
          {lookup === "invalid"
            ? "That isn't a book ISBN. Check the 13 digits starting with 978 or 979."
            : lookup === "unknown"
              ? "We couldn't find it automatically. Type the title and author below."
              : book
                ? `Found: ${book.title}${book.authors.length ? ` by ${book.authors.join(", ")}` : ""}.`
                : ""}
        </p>
        {errors.isbn ? (
          <p id="isbn-error" className="text-[15px] text-merah-light">
            {errors.isbn}
          </p>
        ) : null}
      </section>

      {showDetails ? (
        <form
          ref={formRef}
          key={`${found.isbn}-${state.status === "error" ? state.attempt : 0}`}
          action={action}
          className="flex flex-col gap-6"
          noValidate
        >
          <h2 className="font-display text-xl font-semibold">2. Give or lend</h2>
          <input type="hidden" name="isbn" value={found.isbn} />

          <Field id="title" label="Title" error={errors.title}>
            <input
              id="title"
              name="title"
              defaultValue={values?.title ?? book?.title ?? ""}
              required
              maxLength={300}
              className={inputClass}
              {...described("title", errors.title)}
            />
          </Field>
          <Field id="authors" label="Author(s)" hint="Separate several with commas." error={errors.authors}>
            <input
              id="authors"
              name="authors"
              defaultValue={values?.authors ?? book?.authors.join(", ") ?? ""}
              maxLength={400}
              className={inputClass}
              {...described("authors", errors.authors, true)}
            />
          </Field>

          <fieldset className="flex flex-col gap-3" aria-describedby={errors.mode ? "mode-error" : undefined}>
            <legend className="mb-2 text-[15px] font-semibold">I want to</legend>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-paper/10 p-1">
              {(["give", "lend"] as const).map((m) => (
                <label
                  key={m}
                  className={`flex h-11 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold capitalize has-focus-visible:outline-3 has-focus-visible:outline-songket ${mode === m ? "bg-paper text-malam" : "text-paper"}`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="sr-only"
                  />
                  {m}
                </label>
              ))}
            </div>
            {errors.mode ? (
              <p id="mode-error" className="text-[15px] text-merah-light">
                {errors.mode}
              </p>
            ) : null}
            <p className="text-[15px] text-paper/70">
              {lendSelected
                ? "It comes back to you. The borrower's credit is held until it does."
                : "It becomes the next reader's. You earn 1 credit when you hand it over."}
            </p>
          </fieldset>

          {lendSelected ? (
            <Field id="lendMax" label="Lend it for up to" error={errors.lendMax}>
              <select
                id="lendMax"
                name="lendMax"
                defaultValue={values?.lendMax || "4_weeks"}
                className={inputClass}
                {...described("lendMax", errors.lendMax)}
              >
                {Object.entries(LEND_MAX).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field id="condition" label="Condition" error={errors.condition}>
            <select
              id="condition"
              name="condition"
              defaultValue={values?.condition || "good"}
              className={inputClass}
              {...described("condition", errors.condition)}
            >
              {Object.entries(CONDITIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="note"
            label="A note for the next reader (optional)"
            hint="Your warkah: why you loved it, or anything they should know. Up to 280 characters."
            error={errors.note}
          >
            <textarea
              id="note"
              name="note"
              maxLength={280}
              rows={3}
              defaultValue={values?.note ?? ""}
              className={`${inputClass} h-auto py-3`}
              {...described("note", errors.note, true)}
            />
          </Field>

          {state.status === "error" && state.message ? (
            <p role="alert" className="text-[15px] text-merah-light">
              {state.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="h-13 self-start rounded-full bg-paper px-7 text-[17px] font-semibold text-malam motion-safe:transition-transform motion-safe:hover:scale-[1.02] disabled:opacity-60"
          >
            {pending ? "Adding…" : "Put it on the shelf"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
