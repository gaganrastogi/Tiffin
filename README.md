# Tiffin Tracker

A single-page personal tracker for your "Tiffin On Demand" subscription.
Log each day's tiffins, see used/pending at a glance, and update your plan
whenever you renew.

## How data storage works

This is a static site (HTML/CSS/JS) plus one small serverless function
(`netlify/functions/data.js`) that reads and writes your data using
**Netlify Blobs** — a key-value store built into every Netlify site, no
extra sign-up needed. That means:

- Your data lives on Netlify's servers, not just in your browser.
- Hard refresh, clearing browser cache, or opening the site on another
  device all show the same data.
- Nobody but you can reach it unless they have your site's URL and you've
  shared it — there's no login screen, so don't share the URL publicly.

## Deploy it (GitHub → Netlify)

1. Create a new GitHub repo and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Tiffin tracker"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** →
   **Import an existing project** → pick your GitHub repo.
3. Build settings are already set in `netlify.toml` (build command
   `npm install`, publish directory `.`) — just click **Deploy**.
4. That's it. No environment variables or extra setup needed — Netlify
   Blobs works automatically once the site is deployed on Netlify.

## Using it locally (optional)

The `/api/data` function only works when running through Netlify's own
dev server (plain `Live Server` / opening `index.html` directly won't be
able to save). If you want to test locally before deploying:

```bash
npm install -g netlify-cli
npm install
netlify dev
```

Then open the URL it prints (usually `http://localhost:8888`).

## Changing your subscription

Click **Change subscription** on the "Current plan" card, enter the new
price and tiffin count, and save. Any tiffins you hadn't used from your
previous plan are automatically carried forward — the dashboard always
tracks *all tiffins ever purchased* minus *all tiffins ever logged*, so
nothing needs to be manually transferred.

## Notes

- Dates default to today but can be backdated.
- Delete an entry with the &times; button in the History list if you log
  something by mistake.
- This app has no login and no rate limiting — it's meant for your own
  personal, unlisted use, not for sharing publicly.
