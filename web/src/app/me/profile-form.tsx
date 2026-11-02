"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveProfile, type ProfileState } from "./actions";
import { AREAS } from "@/lib/books/validate";
import { described, Field, focusFirstInvalid, inputClass } from "@/components/app/field";

export function ProfileForm({
  next,
  initial,
}: {
  next: string;
  initial: { displayName: string; area: string; whatsapp: string };
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, { status: "idle" });
  const errors = state.status === "error" ? state.errors : {};
  // After a save or an error, the form remounts with what was submitted, so
  // nothing the reader typed is lost.
  const values = state.status === "idle" ? initial : state.values;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") focusFirstInvalid(formRef.current);
  }, [state]);

  return (
    <form
      ref={formRef}
      key={state.status === "idle" ? 0 : state.attempt}
      action={action}
      className="flex max-w-[30rem] flex-col gap-6"
      noValidate
    >
      <input type="hidden" name="next" value={next} />
      <Field id="displayName" label="Your name" hint="First name is enough. Other readers see it." error={errors.displayName}>
        <input
          id="displayName"
          name="displayName"
          defaultValue={values.displayName}
          maxLength={40}
          required
          autoComplete="given-name"
          className={inputClass}
          {...described("displayName", errors.displayName, true)}
        />
      </Field>
      <Field id="area" label="Your area of Ansan" hint="So people can find meet-ups near both of you." error={errors.area}>
        <select id="area" name="area" defaultValue={values.area || ""} required className={inputClass} {...described("area", errors.area, true)}>
          <option value="" disabled>
            Choose an area
          </option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id="whatsapp"
        label="WhatsApp number (optional for now)"
        hint="Private: only you can see it. Bayu doesn't share it with other readers."
        error={errors.whatsapp}
      >
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+60 12 345 6789"
          defaultValue={values.whatsapp}
          className={inputClass}
          {...described("whatsapp", errors.whatsapp, true)}
        />
      </Field>
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-[15px] text-vermilion">
          {state.message}
        </p>
      ) : null}
      {state.status === "saved" ? (
        <p role="status" className="text-[15px] text-ink">
          Saved.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary self-start disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
