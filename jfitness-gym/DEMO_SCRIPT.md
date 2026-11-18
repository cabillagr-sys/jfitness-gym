# Screen Recording Script (target: 7-8 minutes)

Before recording: open two browser tabs, (1) the app and (2) Supabase Table Editor. Have at least one member name and one plan ready. Do a practice run first.

| Time | What to do | What to say (short) |
|------|-----------|--------------------|
| 0:00 | Show the running app (localhost or Vercel URL) | "This is the JFitness Gym Management System running live, connected to a Supabase database." |
| 0:30 | Click Register, fill the form, submit | "I'm registering a new account." |
| 1:15 | In Supabase: Authentication > Users, then Table Editor > profiles | "The account is saved. The password is stored hashed, not as plain text." |
| 2:00 | Go to Login, enter the correct email but a wrong password | "A wrong password is rejected." |
| 2:30 | Log in with the correct password | "Login is verified against the database." |
| 3:00 | Show the dashboard counters. In a new tab try `/dashboard` while logged out later to show the redirect (or do it at the end) | "Dashboard pages are protected." |
| 3:30 | Members: add a member, show the row in Supabase, edit it, show the change | "Create, read, update in the database." |
| 4:30 | Plans: add or edit a plan. Memberships: assign a plan to the member (payment checked) | "End date and sessions are set automatically from the plan." |
| 5:30 | Check-in: check in the member, show the sessions remaining dropping; check in again to show the block; show `attendance` and `memberships` tables | "Session tracking is automated." |
| 6:30 | Payments: show the payment from the membership; delete a test record | "Delete works too." |
| 7:00 | Daily Sales Report: show today's total and transactions | "Daily sales report." |
| 7:40 | Log out, then open `/dashboard` to show it redirects to login | "Logout works and pages are protected." |
