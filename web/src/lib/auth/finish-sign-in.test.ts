import { describe, expect, it } from "vitest";
import { finishSignInFromUrl, tokenSubject, type SignInClient } from "./finish-sign-in";

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const jwtFor = (sub: string) => `${b64({ alg: "HS256" })}.${b64({ sub })}.c2ln`;
const hashFor = (sub: string) => `#access_token=${jwtFor(sub)}&refresh_token=abc123xyz9&type=magiclink`;

function fake(over: Partial<SignInClient> & { current?: string | null } = {}) {
  const calls: string[] = [];
  const client: SignInClient = {
    getUser: async () => ({ data: { user: over.current ? { id: over.current } : null } }),
    setSession: over.setSession ?? (async () => (calls.push("setSession"), { error: null })),
    refreshSession: async () => (calls.push("refresh"), { error: null }),
  };
  const nav = { replaced: [] as string[], went: [] as string[], replaceUrl(u: string) { this.replaced.push(u); }, go(u: string) { this.went.push(u); } };
  return { client, nav, calls };
}

describe("finishSignInFromUrl", () => {
  it("signs in from an email link, wipes the tokens first, rotates them, then follows a safe next", async () => {
    const { client, nav, calls } = fake();
    expect(await finishSignInFromUrl({ pathname: "/", search: "?next=%2Fbrowse", hash: hashFor("u1") }, client, nav)).toBe(true);
    expect(nav.replaced).toEqual(["/?next=%2Fbrowse"]);
    expect(calls).toEqual(["setSession", "refresh"]);
    expect(nav.went).toEqual(["/browse"]);
  });

  it("never follows an outside next", async () => {
    const { client, nav } = fake();
    await finishSignInFromUrl({ pathname: "/", search: "?next=%2F%2Fevil.example", hash: hashFor("u1") }, client, nav);
    expect(nav.went).toEqual(["/welcome"]);
  });

  it("won't swap a signed-in reader into another account", async () => {
    const { client, nav, calls } = fake({ current: "me" });
    await finishSignInFromUrl({ pathname: "/", search: "", hash: hashFor("someone-else") }, client, nav);
    expect(calls).toEqual([]);
    expect(nav.went).toEqual(["/login?error=account"]);
  });

  it("is fine when the link is for the reader already signed in", async () => {
    const { client, nav } = fake({ current: "me" });
    await finishSignInFromUrl({ pathname: "/", search: "", hash: hashFor("me") }, client, nav);
    expect(nav.went).toEqual(["/welcome"]);
  });

  it("sends a rejected or malformed link to /login (and still wipes it)", async () => {
    const rejected = fake({ setSession: async () => ({ error: new Error("bad") }) });
    await finishSignInFromUrl({ pathname: "/", search: "", hash: hashFor("u1") }, rejected.client, rejected.nav);
    expect(rejected.nav.went).toEqual(["/login?error=link"]);
    const malformed = fake();
    await finishSignInFromUrl({ pathname: "/", search: "", hash: "#access_token=nope&refresh_token=x" }, malformed.client, malformed.nav);
    expect(malformed.nav.replaced).toEqual(["/"]);
    expect(malformed.nav.went).toEqual(["/login?error=link"]);
    const thrown = fake({ setSession: async () => { throw new Error("network"); } });
    await finishSignInFromUrl({ pathname: "/", search: "", hash: hashFor("u1") }, thrown.client, thrown.nav);
    expect(thrown.nav.went).toEqual(["/login?error=link"]);
  });

  it("forwards a code or a token hash to /auth/callback, and errors to /login", async () => {
    const a = fake();
    await finishSignInFromUrl({ pathname: "/", search: "?code=8f2d7c1e-4b6a", hash: "" }, a.client, a.nav);
    expect(a.nav.went).toEqual(["/auth/callback?code=8f2d7c1e-4b6a"]);
    const b = fake();
    await finishSignInFromUrl({ pathname: "/", search: "?next=%2Fadd&token_hash=pkce_abc123&type=email", hash: "" }, b.client, b.nav);
    expect(b.nav.went).toEqual(["/auth/callback?token_hash=pkce_abc123&type=email&next=%2Fadd"]);
    const c = fake();
    await finishSignInFromUrl({ pathname: "/", search: "", hash: "#error=access_denied&error_code=otp_expired" }, c.client, c.nav);
    expect(c.nav.went).toEqual(["/login?error=link"]);
  });

  it("leaves an ordinary visit alone", async () => {
    const { client, nav } = fake();
    expect(await finishSignInFromUrl({ pathname: "/", search: "", hash: "#faq" }, client, nav)).toBe(false);
    expect(nav.went).toEqual([]);
  });
});

describe("tokenSubject", () => {
  it("reads sub, or null", () => {
    expect(tokenSubject(jwtFor("abc"))).toBe("abc");
    expect(tokenSubject("x.y.z")).toBeNull();
  });
});
