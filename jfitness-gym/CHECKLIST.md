# Implementation Checklist

Project: Gym Management and Monitoring System, JFitness Gym, Malaybalay City

## Working System
- [x] Application runs (`npm run dev`)
- [x] Major features functional (members, plans, memberships, check-in, payments, daily sales report)
- [x] Forms, buttons, and navigation work (sidebar navigation, add/edit/delete buttons)

## Database Integration
- [x] Connected to a real Supabase PostgreSQL database
- [x] Create: add members, plans, memberships, payments, check-ins
- [x] Read: list pages, dashboard counts, daily report
- [x] Update: edit members, plans, payments; change membership status
- [x] Delete: remove members, plans, memberships, payments, check-ins
- [x] Submitted data is saved and retrieved from the database

## Registration and Authentication
- [x] User registration page
- [x] Registration saves the account to the database (`auth.users` + `profiles`)
- [x] Database-backed login
- [x] Credentials verified against registered users
- [x] Passwords hashed (Supabase Auth, bcrypt); never stored in plain text
- [x] Logout
- [x] Authenticated pages protected (middleware + server-side session check)

## Screen Recording (5-10 minutes)
- [ ] Run the actual system
- [ ] Register a new account
- [ ] Show the saved account in Supabase (Authentication > Users and Table Editor > profiles)
- [ ] Log in with the new account
- [ ] Test an incorrect password
- [ ] Open the authenticated dashboard (and show /dashboard redirects when logged out)
- [ ] Demonstrate main features
- [ ] Show actual database operations in Supabase after each action

## Final Submission
- [ ] GitHub repository link: ______________________
- [ ] Deployed URL: ______________________ (or local run instructions in README.md)
- [ ] Screen recording link/file: ______________________
- [ ] This checklist completed
