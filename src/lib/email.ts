import { Resend } from "resend";
import {
  DESTINATION,
  MAX_PRICE,
  ORIGIN_CITY_NAMES,
  ORIGINS,
  type Origin,
} from "./config";
import type { FlightMatch } from "./easemytrip";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Build EaseMyTrip one-way search URL for a given flight match.
 * Date format in URL: DD/MM/YYYY
 */
function buildBookingUrl(match: FlightMatch): string {
  const [year, month, day] = match.date.split("-");
  const urlDate = `${day}/${month}/${year}`; // DD/MM/YYYY
  const params = new URLSearchParams({
    from: match.origin,
    to: DESTINATION,
    date: urlDate,
    class: "E",      // Economy
    adults: "1",
    child: "0",
    infants: "0",
    type: "O",       // One-way
  });
  return `https://www.easemytrip.com/flight/search?${params.toString()}`;
}

function formatMatchRow(match: FlightMatch): string {
  const cityName = ORIGIN_CITY_NAMES[match.origin as Origin] ?? match.origin;
  const bookingUrl = buildBookingUrl(match);

  return `<tr>
    <td style="padding:10px;border:1px solid #e0e0e0;">${escapeHtml(cityName)} (${escapeHtml(match.origin)})</td>
    <td style="padding:10px;border:1px solid #e0e0e0;">${escapeHtml(match.date)}</td>
    <td style="padding:10px;border:1px solid #e0e0e0;">${escapeHtml(match.airline)}</td>
    <td style="padding:10px;border:1px solid #e0e0e0;font-weight:bold;">₹${match.price.toLocaleString("en-IN")}</td>
    <td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">
      <a href="${bookingUrl}"
         style="background:#FF6600;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;">
        Book Now →
      </a>
    </td>
  </tr>`;
}

export async function sendMatchEmail(matches: FlightMatch[]): Promise<void> {
  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const from = requireEnv("FROM_EMAIL");
  const to = requireEnv("NOTIFY_EMAIL");

  const originLabels = ORIGINS.map(
    (o) => `${ORIGIN_CITY_NAMES[o]} (${o})`,
  ).join(", ");

  const rows = matches.map(formatMatchRow).join("");
  const subject = `✈️ ${matches.length} flight(s) to ${DESTINATION} at or below ₹${MAX_PRICE.toLocaleString("en-IN")}`;

  const html = `
    <div style="font-family:sans-serif;max-width:860px;margin:0 auto;">
      <h2 style="color:#333;">✈️ Flight Price Alert!</h2>
      <p style="color:#555;">
        Found <strong>${matches.length}</strong> flight(s) from
        <strong>${escapeHtml(originLabels)}</strong> to
        <strong>Bangalore (${escapeHtml(DESTINATION)})</strong>
        at or below <strong style="color:#FF6600;">₹${MAX_PRICE.toLocaleString("en-IN")}</strong>.
      </p>

      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:10px;border:1px solid #e0e0e0;text-align:left;">From</th>
            <th style="padding:10px;border:1px solid #e0e0e0;text-align:left;">Date</th>
            <th style="padding:10px;border:1px solid #e0e0e0;text-align:left;">Airline</th>
            <th style="padding:10px;border:1px solid #e0e0e0;text-align:left;">Price</th>
            <th style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Book</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="color:#999;font-size:12px;margin-top:20px;">
        Prices from EaseMyTrip FareCalendar. Book quickly — prices may change!
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}
