/**
 * Where to open the sign-in link. Supabase's default email (PKCE, ?code=) only
 * works in the browser that asked for it. Once the Magic link template uses
 * token_hash (see PROGRESS), any browser works: then drop "in this same browser".
 */
export const OPEN_LINK_HINT = "Open the newest one, in this same browser.";
