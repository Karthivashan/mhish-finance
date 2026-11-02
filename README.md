# Mhish — Personal Finance & Expense Tracker

A premium, fully responsive personal finance app built with **React + Vite + Tailwind CSS**.
Everything runs in the browser and persists to **LocalStorage** — no backend, no accounts.

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

Sample data is tagged **Sample**, kept separate from your records, and can be reset or removed in Profile & Settings → Data.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview
```

## Deploy (GitHub → Vercel)
1. `git init && git add . && git commit -m "Mhish"`, then push to a new GitHub repository.
2. In Vercel: **Add New → Project**, import the repo. Framework preset **Vite** (build `npm run build`, output `dist`).
3. Deploy. `vercel.json` rewrites all routes to `index.html`, so deep links like `/budgets` work.
4. Open the HTTPS URL, add a transaction, refresh — it should persist.

CLI alternative: `npx vercel --prod`.

## Notes on data
Data lives only in this browser. Clearing site data, private browsing, or switching browser/device can permanently remove it — export a JSON backup regularly.
Dates are stored as plain `yyyy-MM-dd` strings and months as `yyyy-MM`, so there is no timezone date shifting.

## Structure
`src/context` (AppContext reducer, ThemeContext) · `src/services` (storage, transactions, categories, budgets, export, demo data) · `src/utils` (calculations, currency, dates) · `src/components` · `src/pages`.
