# PermiBook — Free Management SaaS for Driving Schools (Auto-Écoles) in Morocco

PermiBook lets a driving school run everything in one place: student
files (CIN, licence category, documents), lesson planning (code courses
+ driving lessons by instructor and car), theory and practical exams
with results, and installment payments with numbered receipts. Reminders
go out through WhatsApp — as messages **you** send, prepared by the app.

**Cost to build and host: 0 DH.** Only free tiers: Next.js 14 +
Supabase free tier + Vercel Hobby. No Stripe, no paid API, no paid images.

## What is in this repo

| Path | What it is |
|---|---|
| `src/app/` | Next.js 14 App Router pages: landing, login, signup, dashboard, students, planning, exams, payments, instructors & vehicles, reminders, settings, super-admin area |
| `src/app/api/` | API routes: signup, owner actions (students, lessons, exams, payments, team, school, settings), super-admin actions |
| `src/components/` | Dashboard, students, planning, exams, payments, team, reminders, settings, super-admin table, app shell |
| `src/lib/` | Supabase clients (browser / server / service-role), suspension rule, guarded localStorage, school helpers |
| `supabase/schema.sql` | Postgres schema + Row Level Security |
| `supabase/seed.sql` | Demo school + super-admin account |

## Honest wording (important)

This app **never sends WhatsApp messages by itself**: there is no
WhatsApp Business API here. On the Reminders page, each reminder has a
one-tap button that opens a `wa.me` link to the student's number with a
prefilled message — the school owner taps it and presses Send. The
landing page FAQ says this plainly.

## Features

- **Landing page** — Darija hero «سيّر مدرسة السياقة ديالك بلا صداع», features, pricing (14-day trial 0 DH, then 99 DH/month and 199 DH/month), honest FAQ.
- **Auth** — email/password via Supabase Auth. Signup creates the owner
  profile + the school (14-day trial) + default settings and formation
  prices (B 2 500 DH, A 1 800 DH, C 3 500 DH).
- **Dashboard** — today's lessons, exams in the next 14 days, late
  payers, revenue this month, active students.
- **Students** — list + detail: CIN, licence category, price, paid /
  remaining balance, training stage (code / conduite / exam / licence),
  assigned instructor, document checklist (CIN, photos, visite
  médicale), hours of code and driving done, payment history.
- **Planning** — week view of code courses and driving lessons
  (student + instructor + car). Double-booking of an instructor or a
  car is blocked (API check + unique DB indexes). Mark a lesson done /
  absent / cancelled.
- **Exams** — create theory / practical exams (date, location), add
  candidates, record results (réussi / raté / ajourné).
- **Payments** — record an installment tranche per student (updates
  their paid amount), numbered receipts (RC-0001…), late-payers list,
  cash summary (cash / transfers this month).
- **Instructors & vehicles** — CRUD for moniteurs (categories taught)
  and cars, with expiry alerts for assurance and visite technique
  (30 days or less, expired in red).
- **Reminders** — tomorrow's lesson reminders + payment-due relances,
  each with a one-tap WhatsApp link (prefilled message, never auto-sent).
- **Settings** — school profile, editable formation prices per category
  (B / A / C), working hours, change password.
- **Super-admin area** (role `super_admin` only) — platform totals
  (schools, students, revenue); table of all schools with plan, trial
  days left, payment status + due date; per-school actions: change plan
  (Trial / 99 / 199), extend trial (+7 / +30 days), OFF switch,
  «Mark as paid» (reactivates instantly for 30 days).
- **OFF enforcement (server-side, every path)** — a suspended /
  trial-expired / unpaid school's owner dashboard opens locked
  read-only with a pay-to-reactivate notice; no creates or edits go
  through (every owner API route checks the suspension rule). Trial
  expiry rule: trial end = created_at + 14 days, or the extended
  `trial_ends_at`.
- The super-admin account also owns its own school («Auto-École Souhail»).
- **Light theme forced on every screen** — the app never follows the
  system dark mode; branded loading screens; all localStorage reads
  guarded.

## Deploy 100% free — step by step

### 1. Supabase (free tier)

1. Create a free project at https://supabase.com (no card needed).
2. In the SQL editor, run `supabase/schema.sql`.
3. **Create the two accounts via Dashboard → Authentication → Users**
   (click «Add user», check **Auto Confirm User**):
   - `demo@permibook.ma` — password `Demo1234`
   - `souhail@permibook.ma` — password `Admin1234` (temporary!)
4. Copy the two real user UUIDs from the Users list and replace the
   placeholders in `supabase/seed.sql`:
   - `11111111-1111-4111-8111-111111111111` → the demo user's UUID
   - `22222222-2222-4222-8222-222222222222` → the super-admin's UUID
5. In the SQL editor, run `supabase/seed.sql`.
6. Auth → Providers → enable **Email**.
7. Copy the project URL + anon key, and the **service-role key**
   (Settings → API). The service-role key is server-only — it goes in
   Vercel env vars, never in `NEXT_PUBLIC_*`.

> ⚠️ **NEVER insert users directly into `auth.users` with SQL.**
> A direct insert leaves token columns NULL where Supabase Auth expects
> empty strings, and login then fails with
> «500: Database error querying schema». Always create users through
> the Dashboard as above. `seed.sql` only inserts into
> `public.profiles` / `public.schools` / … — never into `auth.users`.

Free-tier limits: 500 MB database, 50 000 monthly active users, 1 GB
file storage — far more than a driving school needs.

### 2. GitHub (free)

```bash
git init
git add .
git commit -m "PermiBook production"
git branch -M main
git remote add origin https://github.com/<you>/permibook.git
git push -u origin main
```

### 3. Vercel (free Hobby plan)

1. Import the GitHub repo in Vercel, framework preset: **Next.js**.
2. Add these env vars:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   NEXT_PUBLIC_APP_URL=https://<your-app>.vercel.app
   SUPABASE_SERVICE_ROLE_KEY=<service-role key>
   ```
3. Deploy. The app is live at `https://<your-app>.vercel.app`.
4. In Supabase → Auth → URL Configuration, set the **Site URL** to the
   Vercel domain (`https://<your-app>.vercel.app`).

### 4. Run locally (optional)

```bash
cp .env.example .env.local   # fill in your own keys
npm install
npm run dev                  # http://localhost:3000
npm run build                # must pass before deploy
```

## Demo accounts (seeded by `supabase/seed.sql`)

| Account | Login | What it is |
|---|---|---|
| Demo owner | `demo@permibook.ma` / `Demo1234` | Owner of **Auto-École Atlas** (Casablanca): 6 students, 3 instructors, 3 cars, 9 lessons, 5 exams, 11 payments = 14 000 DH collected |
| Super-admin | `souhail@permibook.ma` / `Admin1234` | Platform owner + own school «Auto-École Souhail» |

> ⚠️ **CHANGE THE SUPER-ADMIN PASSWORD IMMEDIATELY AFTER FIRST LOGIN**
> (Settings → change password). `Admin1234` is a temporary
> password only. Never share it, and never give the demo login to a
> paying customer — they sign up for their own school (14-day trial).

## How the business works (manual payments)

- Plans: 14-day free trial (0 DH), then **99 DH/month** or **199 DH/month**.
  The school pays by cash, CIH or Attijari transfer; you confirm the
  payment manually in Super Admin («Mark as paid») and the school
  reactivates for 30 days.
- Trial expiry: when the 14-day trial ends without payment, the school is
  automatically suspended (same OFF state) until you mark it paid.
- Payment flow: a student pays in installments (acompte + tranches) →
  each tranche is recorded with a numbered receipt and updates the
  student's remaining balance → the school sees late payers at a glance
  and relances them on WhatsApp.

## What is NOT included (needs your accounts / a paid extra)

- Real Supabase project (the repo ships with placeholders; deploy per above).
- Custom domain (`permibook.ma`) — a domain costs money; the free
  `vercel.app` address works with 0 DH.
- WhatsApp Business API for automatic reminders (the manual `wa.me`
  links work free today; auto-send needs the API).
- Email provider for notifications (optional; WhatsApp covers it).
