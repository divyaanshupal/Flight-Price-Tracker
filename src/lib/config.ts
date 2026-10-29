/** All origin airports to track. */
export const ORIGINS = ["LKO", "VNS", "KNU"] as const;
export type Origin = (typeof ORIGINS)[number];

/** Destination airport. */
export const DESTINATION = "BLR";

/** Human-readable city names for each origin airport code. */
export const ORIGIN_CITY_NAMES: Record<Origin, string> = {
  LKO: "Lucknow",
  VNS: "Varanasi",
  KNU: "Kanpur",
};

/** Inclusive departure date range (YYYY-MM-DD). Edit for your trip window. */
export const DEPART_DATE_START = "2026-12-06";
export const DEPART_DATE_END = "2026-12-14";

/**
 * Notify when cheapest-day fare is at or below this amount.
 * Falls back to 8000 if MAX_PRICE env var is not set.
 */
export const MAX_PRICE = process.env["MAX_PRICE"]
  ? Number(process.env["MAX_PRICE"])
  : 8000;
if (!Number.isFinite(MAX_PRICE) || MAX_PRICE <= 0) {
  throw new Error("MAX_PRICE must be a positive number");
}

export const CURRENCY = "INR";

export function getDepartureDates(): string[] {
  const dates: string[] = [];
  const start = new Date(`${DEPART_DATE_START}T00:00:00.000Z`);
  const end = new Date(`${DEPART_DATE_END}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid DEPART_DATE_START or DEPART_DATE_END");
  }
  if (start > end) {
    throw new Error("DEPART_DATE_START must be on or before DEPART_DATE_END");
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}
