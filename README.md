# Joseph Group — FA Materials Issuance Register

A first aid materials inventory & issuance tracking PWA for Joseph Group, built to match the rest of your HSE Portal (PTWA, Inspections, JGM). Plain HTML/CSS/JS — no build step — so it deploys the same reliable way as Homefolk Manager and PTWA.

## What's inside
- `index.html`, `styles.css`, `app.js` — the app itself
- `config.js` — **you edit this** with your Supabase URL + anon key
- `supabase-schema.sql` — run once in Supabase to create all tables + seed data
- `manifest.json`, `sw.js` — makes it installable as a PWA with the Joseph Group logo as the icon
- `assets/` — logo + generated app icons
- `netlify.toml` — Netlify deploy config

---

## Step 1 — Supabase (5 minutes)

1. Go to your existing Supabase project (**zpakjzbdqogjtpaqbcft**, the one PTWA/Inspections use) — or create a new project if you'd rather keep this app fully separate.
2. Open **SQL Editor** → paste the entire contents of `supabase-schema.sql` → **Run**.
   - This creates all `fa_*` tables (isolated from your other apps' tables), enables row-level security with an open policy (since login is PIN-based, not Supabase Auth), and seeds the 19 first aid materials, departments, and two starter users.
3. Go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key
4. Open `config.js` in this folder and paste them in:
   ```js
   window.APP_CONFIG = {
     SUPABASE_URL: "https://xxxxxxxx.supabase.co",
     SUPABASE_ANON_KEY: "eyJ...",
     APP_PIN: "2526",
   };
   ```

## Step 2 — GitHub

```bash
cd fa-register
git init
git add .
git commit -m "Initial commit — FA Materials Issuance Register"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/fa-materials-register.git
git push -u origin main
```
(Create the empty repo on GitHub first, then run the commands above.)

## Step 3 — Netlify

1. **Add new site → Import an existing project** → connect the GitHub repo you just pushed.
2. Build settings: leave **build command empty** and **publish directory** as `.` (root) — `netlify.toml` already sets this.
3. Deploy. You'll get a `*.netlify.app` URL — you can rename it in **Site settings → Change site name** (e.g. `jg-fa-register.netlify.app`, matching your `jgptwa.netlify.app` naming).

That's it — no environment variables needed on Netlify since `config.js` carries the Supabase credentials directly (same pattern as your other apps).

---

## Roles and permissions

Login is PIN `2526` → pick a role. Each role only sees and can do what's below (enforced in the UI — sidebar hides screens a role can't use, and the pages themselves refuse the action even if reached directly):

| Screen / Action | Admin (HSE Manager) | Store Keeper / HSE Officer | Department Viewer |
|---|---|---|---|
| Dashboard | ✔ | ✔ | ✔ |
| Inventory — view balances | ✔ | ✔ | ✔ |
| Inventory — **add stock** | ✔ | ✔ | ✘ |
| **Issue Materials** | ✔ | ✔ | ✘ |
| Issuance Register — view/filter/export | ✔ | ✔ | ✔ |
| Issuance Register — edit/delete | ✔ | ✘ | ✘ |
| Reports — view/export/share | ✔ | ✔ | ✔ |
| Monthly Checklist | ✔ | ✔ | ✘ |
| Master Data (materials, departments, locations, users, audit log) | ✔ | ✘ | ✘ |

This matches Section 3 of the original build spec. Note: since login is PIN + role (no personal name), the audit trail records the **role** that made a change (e.g. "Store Keeper / HSE Officer"), not an individual's name — the "Collected by" field on issuances is still a free-text name for that specific traceability need.

## Using the app

- **Login:** PIN `2526`, then tap your name from the Users list (add your team's names first under **Master Data → Users** once logged in as the seeded "HSE Manager" admin).
- **Master Data** (Admin only): materials catalog, departments, FA box locations, users, and the full **Audit Log** of every edit/delete.
- **Inventory:** Add Stock (stock-in) and see live balances with OK / Low / Out / Expiring status.
- **Issue Materials:** multi-line issuance form, blocks over-issuing past available stock, generates a printable/downloadable/shareable voucher.
- **Issuance Register:** the full traceability table — filter by date, department, material, collector — export or share as PDF.
- **Reports:** Low Stock, Expiry, Monthly Consumption, Transaction History, Stock Reconciliation — each with its own PDF export + native share (WhatsApp/email) button.
- **Checklist:** lightweight Phase 2 starter — monthly per-location check against the materials master list.

## Notes / next steps
- Stock is tracked **centrally** (not per First Aid Box) per your confirmation — locations are recorded on each issuance for reporting, but there's a single running balance per material.
- Low stock / expiry alerts are shown on the in-app Dashboard only (no email/WhatsApp push yet) — that can be added later via a Supabase Edge Function + cron if you want it.
- Collector names are typed manually for now; wiring up to an HR employee list is a natural next step.
- The Checklist module is intentionally minimal — happy to build out full sign-off history/PDF export in the same layout as your current Word/Excel checklist once you've used Phase 1 for a bit.
