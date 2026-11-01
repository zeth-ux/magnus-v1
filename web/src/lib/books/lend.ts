/** Lend periods in days, matching public.lend_max_days() in the database. */
export const LEND_DAYS = { "2_weeks": 14, "4_weeks": 28, "2_months": 61 } as const;
export type LendMax = keyof typeof LEND_DAYS | "flexible";

/** Days a copy can be lent for; "flexible" uses the max_flexible_lend_days setting. */
export const lendDays = (lendMax: LendMax | null | undefined, flexibleDays: number) =>
  lendMax && lendMax !== "flexible" ? LEND_DAYS[lendMax] : flexibleDays;
