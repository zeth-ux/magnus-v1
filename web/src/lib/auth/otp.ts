/**
 * The sign-in code from the email (Supabase's email OTP). Projects send 6
 * digits by default, some newer ones 8, so both are accepted. People paste it
 * with spaces or dashes ("123 456"), so those are stripped first.
 */
export function normaliseCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/[\s-]/g, "");
  return /^\d{6,8}$/.test(digits) ? digits : null;
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
