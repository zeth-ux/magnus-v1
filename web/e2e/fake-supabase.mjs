// A tiny fake Supabase for the browser smoke tests: just enough of Auth and
// PostgREST for every page to render. Not real data, no real security.
//
// - Sign in with any email, then the code 123456 (any other code is "expired").
// - busy@example.com gets "too many emails" (Supabase's 429), to test that message.
// - The JWT is unsigned in any meaningful way: the app never checks it locally
//   (getClaims on an HS256 token asks /auth/v1/user, which answers here).
import http from "node:http";
import { BUSY_EMAIL, FAKE_PORT, GOOD_CODE, SCANNED_ISBN, SCANNED_TITLE } from "./constants.mjs";

const ME = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const JWT = [
  b64url({ alg: "HS256", typ: "JWT" }),
  b64url({ sub: ME, aud: "authenticated", role: "authenticated", exp: 9999999999, iat: 1, email: "reader@example.com", session_id: "s1" }),
  "fake-signature",
].join(".");

const user = {
  id: ME,
  aud: "authenticated",
  role: "authenticated",
  email: "reader@example.com",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-01T00:00:00Z",
};
const session = { access_token: JWT, refresh_token: "refresh-1", expires_in: 3600, expires_at: 9999999999, token_type: "bearer", user };

const books = [
  ["The Remains of the Day", ["Kazuo Ishiguro"], "give", null, "Aina", "Near Hanyang ERICA", "Read it on the 4 bus. The ending got me."],
  ["Circe", ["Madeline Miller"], "lend", "4_weeks", "Hafiz", "Jungang station", ""],
  ["Pachinko", ["Min Jin Lee"], "lend", "2_months", "Sofea", "Sangnok-su", "Long, worth every page."],
  ["Normal People", ["Sally Rooney"], "give", null, "Danial", "Gojan", ""],
  ["The Vegetarian", ["Han Kang"], "lend", "2_weeks", "Mei", "Near Hanyang ERICA", ""],
  ["Educated", ["Tara Westover"], "give", null, "Aina", "Near Hanyang ERICA", ""],
];
const rows = books.map((b, i) => ({
  copy_id: `0000000${i}-0000-4000-8000-00000000000${i}`,
  isbn: `978000000000${i}`,
  title: b[0],
  authors: b[1],
  mode: b[2],
  lend_max: b[3],
  note: b[6] || null,
  owner_id: i === 5 ? ME : OTHER,
  owner_name: b[4],
  area: b[5],
}));
/** A listing as a signed-out visitor sees it (public_search_shelf), and one book's page (public_copy). */
const publicRow = (r) => ({ copy_id: r.copy_id, isbn: r.isbn, title: r.title, authors: r.authors, cover_url: null, mode: r.mode, lend_max: r.lend_max, condition: "good", area: r.area });
const publicCopy = (r) => ({ ...publicRow(r), published_year: 2018 });
const copyRow = (id) => {
  const r = rows.find((x) => x.copy_id === id) ?? rows[0];
  return {
    id: r.copy_id,
    isbn: r.isbn,
    mode: r.mode,
    lend_max: r.lend_max,
    condition: "good",
    note: r.note,
    status: "available",
    owner_id: r.owner_id,
    books: { title: r.title, authors: r.authors, published_year: 2010 },
    profiles: { display_name: r.owner_name, area: r.area },
  };
};
const request = (i, mode, status, owner, requester) => ({
  id: `a000000${i}-0000-4000-8000-000000000000`,
  mode,
  status,
  return_by: mode === "lend" ? "2026-12-01" : null,
  owner_id: owner,
  requester_id: requester,
  owner_handed_over: false,
  requester_received: false,
  owner_got_back: false,
  requester_returned: false,
  updated_at: "2026-11-04T10:00:00Z",
  copy: { id: rows[i].copy_id, status: "available", lend_max: "4_weeks", books: { title: rows[i].title } },
  owner: { display_name: owner === ME ? "Zarith" : rows[i].owner_name },
  requester: { display_name: requester === ME ? "Zarith" : "Hafiz" },
});

const RPC = {
  search_shelf: () => rows,
  wished_and_available: () => rows,
  // The open shelf (signed out): what public_search_shelf / public_copy return, never owners or notes.
  public_search_shelf: () => rows.map(publicRow),
  public_copy: () => publicCopy(rows[1]),
  // The landing shelf: no owners or notes for signed-out visitors.
  public_shelf: () => rows.map((r) => ({ copy_id: r.copy_id, isbn: r.isbn, title: r.title, authors: r.authors, mode: r.mode, lend_max: r.lend_max, area: r.area })),
  setting: () => 183,
  smooth_handovers: () => 2,
  wish_count: () => 1,
  my_waiting_count: () => 2,
  my_credits: () => ({ balance: 3, locked: 1, available: 2 }),
};

/** The reader's library card: one stamp per credit movement (newest first). */
const ledger = () => [
  { id: 3, kind: "lend_lock", delta: 0, locked_delta: 1, ref_id: request(1, "lend", "on_loan", OTHER, ME).id, created_at: "2026-11-04T09:00:00Z" },
  { id: 2, kind: "give_transfer", delta: -1, locked_delta: 0, ref_id: request(3, "give", "accepted", OTHER, ME).id, created_at: "2026-11-03T09:00:00Z" },
  { id: 1, kind: "starter_grant", delta: 1, locked_delta: 0, ref_id: rows[5].copy_id, created_at: "2026-11-01T09:00:00Z" },
];
/** A meet-up card on the give that's been accepted, waiting for the reader to agree. */
const meetups = () => [
  {
    id: "b0000001-0000-4000-8000-000000000000",
    request_id: request(3, "give", "accepted", OTHER, ME).id,
    purpose: "handover",
    proposed_by: OTHER,
    place: "Jungang station, exit 2",
    meet_at: "2026-12-20T09:00:00Z",
    note: null,
    status: "proposed",
  },
];

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const url = new URL(req.url ?? "/", "http://fake");
    const p = url.pathname;
    const cors = {
      "access-control-allow-origin": req.headers.origin ?? "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
      "access-control-expose-headers": "*",
    };
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      return res.end();
    }
    const single = (req.headers.accept ?? "").includes("vnd.pgrst.object");
    const send = (code, data, headers = {}) => {
      res.writeHead(code, { "content-type": "application/json", "content-range": "0-0/3", ...cors, ...headers });
      res.end(req.method === "HEAD" ? undefined : JSON.stringify(data));
    };
    let body = {};
    try {
      body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    } catch {
      body = {};
    }

    // Auth
    if (p === "/health") return send(200, { ok: true });
    if (p.startsWith("/auth/v1/user")) return send(200, user);
    if (p.startsWith("/auth/v1/otp")) {
      if (body.email === BUSY_EMAIL) {
        return send(429, { code: "over_email_send_rate_limit", error_code: "over_email_send_rate_limit", msg: "rate limited" }, { "x-sb-error-code": "over_email_send_rate_limit" });
      }
      return send(200, {});
    }
    if (p.startsWith("/auth/v1/verify")) {
      if (body.token === GOOD_CODE) return send(200, session);
      return send(403, { code: "otp_expired", error_code: "otp_expired", msg: "Token has expired or is invalid" }, { "x-sb-error-code": "otp_expired" });
    }
    if (p.startsWith("/auth/v1/token")) return send(200, session);
    if (p.startsWith("/auth/v1/")) return send(200, {});

    // PostgREST
    if (p.startsWith("/rest/v1/rpc/")) {
      const name = p.slice("/rest/v1/rpc/".length);
      const fn = RPC[name];
      // An RPC the fake doesn't know: say so in the test log, or a page could quietly show an empty state.
      if (!fn) console.error(`[fake supabase] unhandled rpc ${name}`);
      return send(200, fn ? fn() : null);
    }
    if (p === "/rest/v1/books") {
      const isbn = (url.searchParams.get("isbn") ?? "").replace("eq.", "");
      const book = isbn === SCANNED_ISBN ? { isbn, title: SCANNED_TITLE, authors: ["Kazuo Ishiguro"], cover_url: null, published_year: 2021 } : null;
      return send(200, single ? book : book ? [book] : []);
    }
    if (p === "/rest/v1/copies") {
      // One copy by id (single() or maybeSingle(), which asks for a list of at most one).
      const id = (url.searchParams.get("id") ?? "").replace("eq.", "");
      if (id && !id.startsWith("in.")) return send(200, single ? copyRow(id) : [copyRow(id)]);
      if (single) return send(200, copyRow(id));
      return send(200, rows.filter((r) => r.owner_id === ME).map((r) => copyRow(r.copy_id)));
    }
    // Counts (select with head: true) only read the total in Content-Range.
    if (req.method === "HEAD" && (p === "/rest/v1/requests" || p === "/rest/v1/credit_ledger")) {
      return send(200, null, { "content-range": "*/3" });
    }
    if (p === "/rest/v1/credit_ledger") return send(200, ledger());
    if (p === "/rest/v1/meetups") return send(200, meetups());
    if (p === "/rest/v1/loan_extensions" || p === "/rest/v1/blocks" || p === "/rest/v1/wishlist") return send(200, single ? null : []);
    if (p === "/rest/v1/requests" && !single) {
      return send(200, [request(5, "lend", "requested", ME, OTHER), request(1, "lend", "on_loan", OTHER, ME), request(3, "give", "accepted", OTHER, ME)]);
    }
    if (p === "/rest/v1/profiles") {
      const me = { id: ME, display_name: "Zarith", area: "Near Hanyang ERICA" };
      return send(200, single ? me : [me]);
    }
    if (p === "/rest/v1/profile_contacts") return send(200, single ? { id: ME, whatsapp: "+82 10 0000 0000" } : []);
    console.error(`[fake supabase] unhandled ${req.method} ${p}`);
    return send(200, single ? null : []);
  });
});

server.listen(FAKE_PORT, "127.0.0.1", () => console.log(`fake supabase on ${FAKE_PORT}`));
