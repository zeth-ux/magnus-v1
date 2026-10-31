import { describe, expect, it, vi } from "vitest";
import { friendlyError } from "./friendly-error";

describe("friendlyError", () => {
  it("shows messages our functions raised for readers, as a sentence", () => {
    expect(friendlyError({ code: "23514", hint: "bayu", message: "you need 1 available credit: list a book first" }, "x", "t")).toBe(
      "You need 1 available credit: list a book first.",
    );
  });

  it("hides Postgres's own errors, even with the same codes", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(friendlyError({ code: "42501", message: "permission denied for function request_copy" }, "Try again.", "t")).toBe("Try again.");
    expect(friendlyError({ code: "23514", message: 'new row violates check constraint "lend_has_date"' }, "Try again.", "t")).toBe("Try again.");
    expect(log).toHaveBeenCalledWith("[t] database error", "42501");
    log.mockRestore();
  });
});
