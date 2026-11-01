import { describe, expect, it } from "vitest";
import { parseSessionHash } from "./session-hash";

const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl";

describe("parseSessionHash", () => {
  it("reads the tokens Supabase puts in the hash", () => {
    expect(parseSessionHash(`#access_token=${jwt}&expires_in=3600&refresh_token=abc123xyz9&token_type=bearer&type=magiclink`)).toEqual({
      accessToken: jwt,
      refreshToken: "abc123xyz9",
    });
  });
  it("ignores anything else", () => {
    expect(parseSessionHash("")).toBeNull();
    expect(parseSessionHash("#faq")).toBeNull();
    expect(parseSessionHash("#error=access_denied&error_code=otp_expired")).toBeNull();
    expect(parseSessionHash(`#access_token=${jwt}`)).toBeNull();
    expect(parseSessionHash("#access_token=not-a-jwt&refresh_token=abc123xyz9")).toBeNull();
    expect(parseSessionHash(`#access_token=${jwt}&refresh_token=<script>`)).toBeNull();
  });
});
