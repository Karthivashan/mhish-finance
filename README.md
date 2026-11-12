# Mhish — Personal Finance & Expense Tracker

A premium, fully responsive personal finance app built with **React + Vite + Tailwind CSS**.
The app requires Google sign-in and syncs finance data to Google Drive's private app-data area, with a browser cache for fast access.

Palette: forest `#0B3D2E` · leaf `#00A651` · cream `#F7F4ED`, with independently designed light and dark themes.

## Features
- **Overview** – balance, income, expenses, savings (with month-over-month change), income-vs-expense bars, expense donut, spending trend, top categories, recent transactions, month/year selector.
- **Spend** – Income / Expenses tabs, full-page forms (live Indian-grouped ₹ input, date picker, icon-based category grid with inline "Add new"), search, edit, delete with confirmation.
- **Insights** – category ranking, distribution donut, income vs. expense, spending trend (6/12 months), highest category, month-over-month comparison — all computed from stored transactions.
- **Budgets** – per-category monthly limits, progress bars, 80% / 100% thresholds, in-app alerts.
- **Categories** – create, rename, recolour, re-icon; defaults are protected; deleting a category in use asks to reassign or delete its transactions.
- **Notifications** – bell with unread count, read/unread, clear; budget, milestone and save/update/delete events (de-duplicated).
- **Profile & Settings** – name, email, avatar upload, theme, date format, alert preferences.
- **Data** – JSON backup/import, transactions CSV, monthly report CSV, category summary CSV, sample-data reset/removal, erase all.
- **Google Drive sync** – required Google sign-in, private Drive backup, and automatic sync as your data changes.

Sample data is tagged **Sample**, kept separate from your records, and can be reset or removed in Profile & Settings → Data.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview
```

### Configure Google sign-in and Drive
1. In [Google Cloud Console](https://console.cloud.google.com/), create/select a project and enable the **Google Drive API**.
2. Configure the OAuth consent screen and create an **OAuth client ID** with application type **Web application**.
3. Add `http://localhost:5173` and your deployed HTTPS origin to **Authorized JavaScript origins**.
4. Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_CLIENT_ID` to the client ID. Restart the Vite server after changing it.
5. Add the same `VITE_GOOGLE_CLIENT_ID` environment variable in your deployment settings and redeploy.

The client ID is public and belongs in the frontend; do not put a client secret in this app. Google access tokens are kept in memory, and Mhish requests only the `drive.appdata` scope for its private backup plus basic profile information. Existing browser data is uploaded on the first sign-in if that account has no Mhish backup. A backup already in Drive takes precedence and replaces the browser cache.

## Deploy (GitHub → Vercel)
1. `git init && git add . && git commit -m "Mhish"`, then push to a new GitHub repository.
2. In Vercel: **Add New → Project**, import the repo. Framework preset **Vite** (build `npm run build`, output `dist`).
3. Deploy. `vercel.json` rewrites all routes to `index.html`, so deep links like `/budgets` work.
4. Add the configured Google OAuth client ID in Vercel, open the HTTPS URL, sign in, and add a transaction to verify Drive sync.

CLI alternative: `npx vercel --prod`.

## Notes on data
The synced copy lives in Google Drive's hidden app-data area. This browser also keeps a local cache; clearing site data does not delete the Drive copy. Data is loaded at sign-in and saved to Drive as it changes. Export a JSON backup regularly as an independent copy. If Drive sync fails, the app shows a retry status; changes made while offline remain in the browser until you retry sync.
Dates are stored as plain `yyyy-MM-dd` strings and months as `yyyy-MM`, so there is no timezone date shifting.

## Structure
`src/context` (AppContext reducer, ThemeContext) · `src/services` (storage, transactions, categories, budgets, export, demo data) · `src/utils` (calculations, currency, dates) · `src/components` · `src/pages`.
