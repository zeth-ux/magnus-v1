"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "./actions";
import { AREAS } from "@/lib/books/validate";
import { Field, inputClass } from "@/components/app/field";

export function ProfileForm({
  next,
  initial,
}: {
  next: string;
  initial: { displayName: string; area: string; whatsapp: string };
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, { status: "idle" });
  const errors = state.status === "error" ? state.errors : {};

  return (
    <form action={action} className="flex max-w-[30rem] flex-col gap-6" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field id="displayName" label="Your name" hint="First name is enough. Other readers see it." error={errors.displayName}>
        <input
          id="displayName"
          name="displayName"
          defaultValue={initial.displayName}
          maxLength={40}
          required
          autoComplete="given-name"
          aria-invalid={errors.displayName ? true : undefined}
          aria-describedby="displayName-hint displayName-error"
          className={inputClass}
        />
      </Field>
      <Field id="area" label="Your area of Ansan" hint="So people can find meet-ups near both of you." error={errors.area}>
        <select
          id="area"
          name="area"
          defaultValue={initial.area || ""}
          required
          aria-invalid={errors.area ? true : undefined}
          aria-describedby="area-hint area-error"
          className={inputClass}
        >
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
        hint="Private. Only you can see it. It's shared with the other reader once a request is accepted."
        error={errors.whatsapp}
      >
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+60 12 345 6789"
          defaultValue={initial.whatsapp}
          aria-invalid={errors.whatsapp ? true : undefined}
          aria-describedby="whatsapp-hint whatsapp-error"
          className={inputClass}
        />
      </Field>
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-[15px] text-merah-light">
          {state.message}
        </p>
      ) : null}
      {state.status === "saved" ? (
        <p role="status" className="text-[15px] text-paper">
          Saved.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-13 self-start rounded-full bg-paper px-7 text-[17px] font-semibold text-malam motion-safe:transition-transform motion-safe:hover:scale-[1.02] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
