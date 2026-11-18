# JFitness Gym Management System

Gym management and monitoring system with automated membership session tracking and daily sales reporting for JFitness Gym, Malaybalay City.

**Stack:** Next.js 15 (App Router, TypeScript) + Supabase (PostgreSQL + Auth)

## Features

- Registration, database-backed login (wrong password rejected), logout
- Passwords are hashed by Supabase Auth (bcrypt); no plain-text passwords are stored
- Every registered account is saved in `auth.users` and `profiles`
- `/dashboard` pages are protected by middleware and a server-side check
- CRUD: Members, Membership Plans, Memberships, Payments
- Automated membership sessions: end date and session count are set from the plan; check-in validates the membership, deducts a session, and blocks expired/empty memberships
- Expired memberships are marked automatically
- Daily sales report by date (totals, payment-method breakdown, transactions, printable)

## Local setup

1. Install Node.js 18.18+ (https://nodejs.org).
2. Create a free project at https://supabase.com.
3. In Supabase open **SQL Editor**, paste all of `supabase/schema.sql`, and click **Run**.
4. In Supabase go to **Authentication > Providers > Email** and turn **off** "Confirm email" (so registration works instantly).
5. Copy `.env.example` to `.env.local` and fill in the values from **Project Settings > API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
6. Install and run:
   ```bash
   npm install
   npm run dev
   ```
7. Open http://localhost:3000, click **Register**, then log in.

## Deploy (Vercel)

1. Push this folder to a GitHub repository (`.env.local` is git-ignored).
2. Import the repo at https://vercel.com/new.
3. Add the two environment variables above in the Vercel project settings.
4. Deploy and open the generated URL.

## Project structure

```
app/register, app/login        Auth pages
app/dashboard/                 Protected area (layout checks the session)
  members, plans, memberships, checkin, payments, reports
components/LogoutButton.tsx
lib/supabase/                  Browser and server Supabase clients
middleware.ts                  Redirects logged-out users away from /dashboard
supabase/schema.sql            Tables, trigger, functions, RLS policies, sample plans
```

## Database tables

`profiles`, `members`, `membership_plans`, `memberships`, `attendance`, `payments`
Functions: `checkin_member(member_id)`, `expire_memberships()`

## Troubleshooting

- **"Invalid API key" / blank data:** check `.env.local`, then restart `npm run dev`.
- **Register says "email rate limit exceeded":** wait a few minutes or use a different email.
- **Register works but login fails:** make sure "Confirm email" is turned off, or confirm the email first.
- **Tables not found:** run `supabase/schema.sql` again in the SQL Editor.
