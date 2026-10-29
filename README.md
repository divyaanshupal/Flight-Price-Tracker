# ✈️ Flight Price Tracker

A **zero-cost, fully automated** flight price alert system built with Next.js. It checks EaseMyTrip's FareCalendar every day and **sends you an email with a direct booking link** whenever a flight is found below your budget.

> No EaseMyTrip account needed. No paid APIs. Just set it up once and forget it.

---

## 🎯 How It Works

```
Every day at 8:30 AM IST (3:00 UTC)
         ↓
Vercel Cron triggers /api/cron
         ↓
Fetches prices from EaseMyTrip for all configured routes & dates
         ↓
Compares each fare against your MAX_PRICE
         ↓
Match found → Sends email with date, airline, price & "Book Now" link
No match    → Stays silent (no spam!)
```

---

## ✨ Features

- 🔁 **Daily automatic checks** via Vercel Cron (free)
- 📧 **Email alerts** with direct EaseMyTrip booking links
- 🛫 **Multiple origin cities** supported (e.g. Lucknow, Varanasi, Kanpur → Bangalore)
- 💰 **Budget filter** — only notifies when price is at or below your limit
- 🔐 **Secured API endpoint** with Bearer token auth
- 🌐 **Static homepage** showing your current tracker config
- ⚡ **No database** — fully serverless & stateless

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Email | [Resend](https://resend.com/) |
| Data Source | EaseMyTrip FareCalendar API (no key required) |
| Scheduler | Vercel Cron Jobs |
| Hosting | [Vercel](https://vercel.com/) (free tier) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A free [Resend](https://resend.com/) account
- A free [Vercel](https://vercel.com/) account

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/flight-price-tracker.git
cd flight-price-tracker
npm install
```

---

### Step 2 — Configure your route & dates

Edit [`src/lib/config.ts`](src/lib/config.ts):

```ts
// Which cities to track FROM
export const ORIGINS = ["LKO", "VNS", "KNU"] as const;

// Destination airport IATA code
export const DESTINATION = "BLR";

// Departure date window to check (inclusive)
export const DEPART_DATE_START = "2026-12-06";
export const DEPART_DATE_END   = "2026-12-14";
```

> **Find IATA codes:** Search your city on [iata.org](https://www.iata.org/en/publications/directories/code-search/) or just Google `"city name airport IATA code"`.

---

### Step 3 — Set up Resend (free email)

1. Go to [resend.com](https://resend.com) → Sign up (GitHub works)
2. Dashboard → **API Keys** → **Create API Key** → Copy it
3. **Important:** Sign up with the **same email** where you want to receive alerts
   > On the free tier without a custom domain, Resend only sends to your registered email address.

---

### Step 4 — Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx   # From Resend dashboard
FROM_EMAIL=onboarding@resend.dev     # Keep this for free tier
NOTIFY_EMAIL=your@email.com          # Must match your Resend account email

CRON_SECRET=your-random-secret-here  # Run: openssl rand -hex 32

MAX_PRICE=8000                        # Alert threshold in INR (optional, default: 8000)
```

> **Generate a secure CRON_SECRET:**
> ```bash
> openssl rand -hex 32
> ```

---

### Step 5 — Run locally

```bash
npm run dev
```

**Test the cron manually** (in a new terminal):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron
```

Expected response:

```json
{
  "ok": true,
  "origins": ["LKO", "VNS", "KNU"],
  "destination": "BLR",
  "dateRange": { "start": "2026-12-06", "end": "2026-12-14" },
  "maxPrice": 8000,
  "currency": "INR",
  "matchCount": 3,
  "emailSent": true,
  "matches": [
    { "origin": "VNS", "date": "2026-12-08", "price": 7750, "airline": "IndiGo", ... }
  ]
}
```

---

## ☁️ Deploy on Vercel

### 1. Push to GitHub

```bash
git add -A
git commit -m "feat: initial setup"

git remote add origin https://github.com/YOUR_USERNAME/flight-price-tracker.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Select your GitHub repo → Click **Import**

### 3. Add Environment Variables

In the Vercel project setup, add all variables from your `.env`:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | `re_xxxxxxxx...` |
| `FROM_EMAIL` | `onboarding@resend.dev` |
| `NOTIFY_EMAIL` | `your@email.com` |
| `CRON_SECRET` | Your generated secret |
| `MAX_PRICE` | `8000` |

### 4. Deploy!

Click **Deploy** — that's it. ✅

The cron job is automatically registered via [`vercel.json`](vercel.json) and runs **every day at 3:00 UTC (8:30 AM IST)**.

> **Verify:** After deploy, go to Vercel Dashboard → Your Project → **Cron Jobs** tab — you should see `/api/cron` listed.

---

## 🔧 Manual Trigger (After Deploy)

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron
```

---

## ⏰ Custom Schedule (Multiple Times a Day)

Vercel free tier runs the cron **once daily**. For more frequent checks, use a free third-party cron service:

### [cron-job.org](https://cron-job.org) (Recommended — Free, every 1 min)

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL:** `https://your-app.vercel.app/api/cron`
   - **Method:** `GET`
   - **Header:** `Authorization: Bearer YOUR_CRON_SECRET`
   - **Schedule:** Every 6 hours (or whatever you prefer)
3. Save → Done!

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Static homepage (shows current config)
│   ├── layout.tsx
│   └── api/
│       └── cron/
│           └── route.ts      # Main cron endpoint (GET /api/cron)
└── lib/
    ├── config.ts             # ← Edit this: routes, dates, budget
    ├── easemytrip.ts         # EaseMyTrip FareCalendar fetcher
    └── email.ts              # Resend email sender

vercel.json                   # Cron schedule config
.env.example                  # Environment variable template
```

---

## ⚙️ API Reference

### `GET /api/cron`

Triggers a price check and sends email if matches found.

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response (success):**
```json
{
  "ok": true,
  "origins": ["LKO", "VNS", "KNU"],
  "destination": "BLR",
  "dateRange": { "start": "2026-12-06", "end": "2026-12-14" },
  "maxPrice": 8000,
  "currency": "INR",
  "matchCount": 2,
  "emailSent": true,
  "matches": [...]
}
```

**Response (no matches):**
```json
{
  "ok": true,
  "matchCount": 0,
  "emailSent": false,
  "matches": []
}
```

---

## 📧 Email Preview

When a match is found, you receive an email like this:

| From | Date | Airline | Price | Book |
|---|---|---|---|---|
| Varanasi (VNS) | 2026-12-08 | IndiGo | ₹7,750 | **Book Now →** |
| Varanasi (VNS) | 2026-12-09 | IndiGo | ₹7,750 | **Book Now →** |

Each **"Book Now →"** button links directly to EaseMyTrip's search results for that exact route and date.

---

## 📝 Notes

- **FareCalendar** returns daily cheapest fares per route — not individual flight schedules. Actual departure times may vary.
- If a cheap fare stays available, you'll get one email per day (no deduplication by design — you want to be reminded!).
- **LKO/KNU** routes may have limited or no direct flights to BLR on some dates — this is a data limitation from EaseMyTrip, not a bug.
- Failed fetches for one origin are logged and skipped; other origins still run normally.

---

## 📄 License

MIT — free to use, modify, and deploy for personal or commercial use.
