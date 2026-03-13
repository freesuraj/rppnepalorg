# National Transparency Party Nepal Website

A bilingual static website for `National Transparency Party Nepal`, designed for GitHub Pages with Nepali as the default language and English as the secondary language.

## What is included

- A designed multi-page public website: Home, Our Mission, Contact Us, Join the Movement, Donation
- Client-side language switching with Nepali default and persistent language preference
- A GitHub Pages-friendly join form that submits directly to Supabase via REST
- A Supabase schema with Row Level Security for public inserts
- Python helpers for local preview and CSV export of supporter signups

## Project structure

- `index.html`
- `mission.html`
- `contact.html`
- `join.html`
- `donation.html`
- `assets/css/styles.css`
- `assets/js/site-content.js`
- `assets/js/site-config.js`
- `assets/js/join.js`
- `supabase/schema.sql`
- `scripts/serve.py`
- `scripts/export_signups.py`

## Local preview

Run the local server from the project root:

```bash
python3 scripts/serve.py
```

Then open `http://127.0.0.1:8000`.

## Configure organisation details

Edit `assets/js/site-config.js` and replace the placeholder values:

- Official email
- Official phone number
- Office address
- Social media links
- Donation channels
- Supabase project URL
- Supabase public anon key

`assets/js/site-config.example.js` is included as a clean reference copy.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor in Supabase and run `supabase/schema.sql`.
3. Copy your project URL and public anon key into `assets/js/site-config.js`.
4. Keep the default table name `movement_signups` unless you also update `assets/js/join.js`.

The website uses the public anon key only for inserts. The schema enables Row Level Security and only permits inserts from the anonymous role.

## Export signups with Python

Use a service role key locally if you want a CSV export:

```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
python3 scripts/export_signups.py
```

This writes `movement-signups.csv` in the project root by default.

Optional environment variables:

- `SUPABASE_TABLE`
- `OUTPUT_CSV`

## GitHub Pages deployment

1. Push this directory to a GitHub repository.
2. In GitHub repository settings, enable Pages from the branch and folder you prefer.
3. If you deploy from the repository root, the current file structure works as-is.

Because the site is static, the join form depends on Supabase being configured before launch.

## Notes

- Nepali is the default language.
- The contact and donation sections are config-driven so you can change public details without rewriting page markup.
- The join form includes a hidden honeypot field for a minimal spam check, but a public form can still attract abuse. If you need stronger protection later, add CAPTCHA or route submissions through a server-side function.

## Last Updated
13 March 2026.