"use client";

import { useActionState, useEffect, useState } from "react";
import { agreeMeetup, proposeMeetup, type MeetupState } from "./meetup-actions";
import { useAnnounce } from "./announcer";
import { formatSeoul } from "@/lib/activity/meetup-time";
import { inputClass } from "@/components/app/field";

export type Meetup = { id: string; proposed_by: string; place: string; meet_at: string; note: string | null; status: "proposed" | "agreed" };

/** Places pilot readers already use; any other place can be typed. */
const PLACES = ["Hanyang Univ. at Ansan station", "Jungang station", "Gojan station", "Ansan station", "ERICA library entrance", "Sa-dong café street"];

/**
 * Where and when to meet, for one request. Shows the live suggestion and lets
 * the other reader agree, or either reader suggest something else. The parent
 * keys it by the live card's id, so a new suggestion starts a fresh card.
 */
export function MeetupCard({
  request,
  meetup,
  me,
  other,
  title,
  purpose,
  minAt,
}: {
  request: string;
  meetup: Meetup | null;
  me: string;
  other: string;
  title: string;
  purpose: "handover" | "return";
  /** Earliest pickable time, worked out on the server (no clock reads while rendering). */
  minAt: string;
}) {
  const [editing, setEditing] = useState(false);
  const [proposeState, propose, proposing] = useActionState<MeetupState, FormData>(proposeMeetup, { status: "idle" });
  const [agreeState, agree, agreeing] = useActionState<MeetupState, FormData>(agreeMeetup, { status: "idle" });
  const announce = useAnnounce();

  useEffect(() => {
    if (proposeState.status === "done") announce(`${title}: ${proposeState.message}`);
  }, [proposeState, title, announce]);
  useEffect(() => {
    if (agreeState.status === "done") announce(`${title}: ${agreeState.message}`);
  }, [agreeState, title, announce]);

  const values = proposeState.status === "error" ? proposeState.values : undefined;
  const showForm = editing || !meetup;
  const theirs = meetup && meetup.proposed_by !== me;

  return (
    <div className="flex flex-col gap-3 rounded-[8px] bg-paper/[0.06] p-4">
      <p className="text-[15px] font-semibold">{purpose === "handover" ? "Meet-up" : "Meet-up to return it"}</p>

      {meetup ? (
        <div className="flex flex-col gap-1">
          <p className="font-display text-[17px]">
            {meetup.place} · {formatSeoul(meetup.meet_at)}
          </p>
          {meetup.note ? <p className="text-[15px] text-paper/80">&ldquo;{meetup.note}&rdquo;</p> : null}
          <p className="text-[15px] text-paper/80">
            {meetup.status === "agreed"
              ? "Agreed by both of you."
              : theirs
                ? `${other} suggested this.`
                : `You suggested this. Waiting for ${other}.`}
          </p>
        </div>
      ) : (
        <p className="text-[15px] text-paper/80">No place or time yet. Suggest one.</p>
      )}

      {meetup && !editing ? (
        <div className="flex flex-wrap gap-3">
          {theirs && meetup.status === "proposed" ? (
            <form action={agree}>
              <input type="hidden" name="meetup" value={meetup.id} />
              <button type="submit" disabled={agreeing} aria-label={`Sounds good: meet-up for ${title}`} className="h-11 rounded-full bg-paper px-5 text-[15px] font-semibold text-malam disabled:opacity-60">
                Sounds good
              </button>
            </form>
          ) : null}
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Suggest another place or time for ${title}`}
            className="h-11 rounded-full border-[1.5px] border-paper/60 px-5 text-[15px] font-semibold"
          >
            {meetup.status === "agreed" ? "Change it" : "Suggest another"}
          </button>
        </div>
      ) : null}

      {showForm ? (
        <form action={propose} className="flex flex-col gap-3">
          <input type="hidden" name="request" value={request} />
          <div className="flex flex-col gap-2">
            <label htmlFor={`place-${request}`} className="text-[15px] font-semibold">
              Where
            </label>
            <input
              id={`place-${request}`}
              name="place"
              list={`places-${request}`}
              required
              maxLength={80}
              defaultValue={values?.place ?? ""}
              placeholder="A café or station"
              className={inputClass}
            />
            <datalist id={`places-${request}`}>
              {PLACES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`at-${request}`} className="text-[15px] font-semibold">
              When (Korea time)
            </label>
            <input id={`at-${request}`} name="at" type="datetime-local" required min={minAt} defaultValue={values?.at ?? ""} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`note-${request}`} className="text-[15px] font-semibold">
              Note (optional)
            </label>
            <input id={`note-${request}`} name="note" maxLength={200} defaultValue={values?.note ?? ""} placeholder="How they'll recognise you" className={inputClass} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={proposing} className="h-11 rounded-full bg-paper px-5 text-[15px] font-semibold text-malam disabled:opacity-60">
              {proposing ? "Sending…" : "Suggest this"}
            </button>
            {meetup ? (
              <button type="button" onClick={() => setEditing(false)} className="h-11 px-2 text-[15px] font-semibold underline underline-offset-4">
                Keep the current one
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <p role={proposeState.status === "error" || agreeState.status === "error" ? "alert" : undefined} className="text-[15px] text-merah-light">
        {proposeState.status === "error" ? proposeState.message : agreeState.status === "error" ? agreeState.message : ""}
      </p>
    </div>
  );
}
