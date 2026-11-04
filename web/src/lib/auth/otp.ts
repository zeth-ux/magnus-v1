/**
 * The sign-in code from the email (Supabase's email OTP). Supabase can be set
 * to send 6 to 10 digits, so any of those is accepted. People paste it with
 * spaces or dashes ("123 456"), and some keyboards type full-width digits
 * (１２３), so it's normalised first.
 */
export function normaliseCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.normalize("NFKC").replace(/[\s-]/g, "");
  return /^\d{6,10}$/.test(digits) ? digits : null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks before a code is sent to Supabase: a usable email and a well-formed code, or what to say instead. */
export function checkCodeInput(email: string, code: string): { ok: true; email: string; token: string } | { ok: false; message: string } {
  const e = email.trim().toLowerCase();
  if (e.length > 254 || !EMAIL_PATTERN.test(e)) return { ok: false, message: "Something went wrong with your email. Start again with your email address." };
  const token = normaliseCode(code);
  if (!token) return { ok: false, message: "Type the code from the email: 6 digits (some emails have more)." };
  return { ok: true, email: e, token };
}

/** What to tell the reader when Supabase refuses a code (by its error code). */
export function codeErrorMessage(code: string | undefined): string {
  switch (code) {
    case "otp_expired":
      return "That code is wrong or has expired. Check the newest email from us, or send a new code.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many tries just now. Wait a few minutes, then try again.";
    default:
      return "We couldn't check that code just now. Try again in a moment.";
  }
}
