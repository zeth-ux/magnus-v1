import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const auth = {
  getUser: vi.fn(),
  verifyOtp: vi.fn(async () => ({ error: null })),
  exchangeCodeForSession: vi.fn(async () => ({ error: null })),
};
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth }) }));
const { GET } = await import("./route");

const get = (q: string) => GET(new NextRequest(`https://magnus-v1.vercel.app/auth/callback?${q}`));

beforeEach(() => vi.clearAllMocks());

describe("/auth/callback", () => {
  it("never uses a code or token hash when this browser is already signed in", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "me" } } });
    for (const q of ["token_hash=abc123&type=email&next=%2Fbrowse", "code=abc123&next=%2Fbrowse"]) {
      const res = await get(q);
      expect(res.headers.get("location")).toBe("https://magnus-v1.vercel.app/browse");
    }
    expect(auth.verifyOtp).not.toHaveBeenCalled();
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("signs a signed-out browser in from a token hash", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null } });
    const res = await get("token_hash=abc123&type=email&next=%2Fadd");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "abc123", type: "email" });
    expect(res.headers.get("location")).toBe("https://magnus-v1.vercel.app/add");
  });
});
