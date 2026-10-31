"use client";

import Link from "next/link";
import { useActionState, useCallback, useState, useTransition } from "react";
import { addCopy, findBook, type AddState } from "./actions";
import { Scanner } from "./scanner";
import { Field, inputClass } from "@/components/app/field";
import { CONDITIONS, LEND_MAX } from "@/lib/books/validate";
import type { BookInfo } from "@/lib/books/lookup";

/**
 * Add a book in two steps: find it (scan or type the ISBN; we fill in the
 * details), then say give or lend. Everything is checked again on the server.
 */
export function AddBookForm() {
  // "Add another" starts a fresh form by remounting it.
  const [round, setRound] = useState(0);
  return <AddBookFlow key={round} onAgain={() => setRound((r) => r + 1)} />;
}

function AddBookFlow({ onAgain }: { onAgain: () => void }) {
  const [state, action, pending] = useActionState<AddState, FormData>(addCopy, { status: "idle" });
  const [isbn, setIsbn] = useState("");
  const [book, setBook] = useState<BookInfo | null>(null);
  const [lookup, setLookup] = useState<"idle" | "unknown" | "invalid">("idle");
  const [scanning, setScanning] = useState(false);
  const [mode, setMode] = useState<"give" | "lend">("lend");
  const [finding, startFinding] = useTransition();

  const find = useCallback((value: string) => {
    startFinding(async () => {
      const res = await findBook(value);
      if (res.status === "found") {
        setBook(res.book);
        setIsbn(res.book.isbn);
        setLookup("idle");
      } else {
        setBook(null);
        setLookup(res.status);
      }
    });
  }, []);

  const onDetected = useCallback(
    (code: string) => {
      setScanning(false);
      setIsbn(code);
      find(code);
    },
    [find],
  );

  if (state.status === "added") {
    return (
      <div role="status" className="relative flex max-w-[32rem] flex-col gap-4 rounded-[10px] bg-paper p-7 text-malam">
        <p className="font-display text-2xl font-semibold">{state.title} is on the shelf.</p>
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
          <button
            type="button"
            onClick={onAgain}
            className="rounded-full bg-malam px-6 py-3 text-[17px] font-semibold text-paper"
          >
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
  const manual = lookup === "unknown";
  const showDetails = Boolean(book) || manual;

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
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  find(isbn);
                }
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="978…"
              maxLength={20}
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => find(isbn)}
            disabled={finding || isbn.trim() === ""}
            className="h-13 rounded-full border-[1.5px] border-paper/70 px-6 text-[17px] font-semibold disabled:opacity-50"
          >
            {finding ? "Looking…" : "Find"}
          </button>
          <button
            type="button"
            onClick={() => setScanning((s) => !s)}
            className="h-13 rounded-full bg-paper px-6 text-[17px] font-semibold text-malam"
          >
            {scanning ? "Stop scanning" : "Scan barcode"}
          </button>
        </div>
        {scanning ? <Scanner onDetected={onDetected} onClose={() => setScanning(false)} /> : null}
        <p aria-live="polite" className="text-[15px] text-paper/80">
          {lookup === "invalid"
            ? "That isn't a book ISBN. Check the 13 digits starting with 978 or 979."
            : manual
              ? "We couldn't find it automatically. Type the title and author below."
              : book
                ? `Found: ${book.title}${book.authors.length ? ` by ${book.authors.join(", ")}` : ""}.`
                : ""}
        </p>
      </section>

      {showDetails ? (
        <form key={book?.isbn ?? "manual"} action={action} className="flex flex-col gap-6" noValidate>
          <h2 className="font-display text-xl font-semibold">2. Give or lend</h2>
          <input type="hidden" name="isbn" value={book?.isbn ?? isbn} />
          <input type="hidden" name="coverUrl" value={book?.coverUrl ?? ""} />
          <input type="hidden" name="year" value={book?.year ?? ""} />
          {errors.isbn ? (
            <p role="alert" className="text-[15px] text-merah-light">
              {errors.isbn}
            </p>
          ) : null}

          <Field id="title" label="Title" error={errors.title}>
            <input id="title" name="title" defaultValue={book?.title ?? ""} required maxLength={300} className={inputClass} aria-invalid={errors.title ? true : undefined} aria-describedby="title-error" />
          </Field>
          <Field id="authors" label="Author(s)" hint="Separate several with commas." error={errors.authors}>
            <input id="authors" name="authors" defaultValue={book?.authors.join(", ") ?? ""} maxLength={400} className={inputClass} aria-describedby="authors-hint authors-error" />
          </Field>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-[15px] font-semibold">I want to</legend>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-paper/10 p-1">
              {(["give", "lend"] as const).map((m) => (
                <label
                  key={m}
                  className={`flex h-11 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold capitalize has-focus-visible:outline-3 has-focus-visible:outline-songket ${mode === m ? "bg-paper text-malam" : "text-paper"}`}
                >
                  <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                  {m}
                </label>
              ))}
            </div>
            <p className="text-[15px] text-paper/70">
              {mode === "give" ? "It becomes the next reader's. You earn 1 credit when you hand it over." : "It comes back to you. The borrower's credit is held until it does."}
            </p>
          </fieldset>

          {mode === "lend" ? (
            <Field id="lendMax" label="Lend it for up to" error={errors.lendMax}>
              <select id="lendMax" name="lendMax" defaultValue="4_weeks" className={inputClass} aria-describedby="lendMax-error">
                {Object.entries(LEND_MAX).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field id="condition" label="Condition" error={errors.condition}>
            <select id="condition" name="condition" defaultValue="good" className={inputClass} aria-describedby="condition-error">
              {Object.entries(CONDITIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="note" label="A note for the next reader (optional)" hint="Your warkah: why you loved it, or anything they should know. Up to 280 characters." error={errors.note}>
            <textarea id="note" name="note" maxLength={280} rows={3} className={`${inputClass} h-auto py-3`} aria-describedby="note-hint note-error" />
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
