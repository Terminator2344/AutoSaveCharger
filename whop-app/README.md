Auto-Charge Saver — Whop App (Next.js)

What this app does
- Reduces involuntary churn by notifying users when payments fail and tracking recoveries (click vs window). Includes iframe-ready dashboard and webhook handling.

To run this project:

1. Install dependencies with: `pnpm i`

2. Create a Whop App on your [whop developer dashboard](https://whop.com/dashboard/developer/), then go to the "Hosting" section and:
	- Ensure the "Base URL" is set to the domain you intend to deploy the site on.
	- Ensure the "App path" is set to `/experiences/[experienceId]`
	- Ensure the "Dashboard path" is set to `/dashboard/[companyId]`
	- Ensure the "Discover path" is set to `/discover`

3. Copy `env.example` to `.env.local` and fill values from your Whop dashboard.

4. Go to a whop created in the same org as the app you created. Navigate to the tools section and add your app.

5. Run `pnpm dev` to start the dev server. Then in the top right of the window find a translucent settings icon. Select "localhost". The default port 3000 should work.

## Environment

Required variables (see `env.example`):
- `APP_BASE_URL`, `NEXT_PUBLIC_WHOP_CLIENT_ID`, `WHOP_CLIENT_SECRET`, `WHOP_API_KEY`, `WHOP_REDIRECT_URI`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `DATABASE_URL` (dev default: SQLite)
- Optional: `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `DISCORD_WEBHOOK_URL`

This version uses a temporary in-memory store (no database). Data resets on restart.

## Routes
- `POST /api/webhooks` — Whop webhooks (validated via SDK), persists events, triggers notifications and recovery marking.
- `GET /api/r/[userId]` — click tracking + redirect to Whop billing URL.
- `ANY /api/whop/dev-proxy` — dev proxy stub.
- `GET /views/dashboard` — iframe-safe dashboard (frosted UI) with metrics.

## Deploying

1. Upload your fork / copy of this template to github.

2. Go to [Vercel](https://vercel.com/new) and link the repository. Deploy your application with the environment variables from your `.env.local`

3. If necessary update you "Base Domain" and webhook callback urls on the app settings page on the whop dashboard.

## Troubleshooting

**App not loading properly?** Make sure to set the "App path" in your Whop developer dashboard. The placeholder text in the UI does not mean it's set - you must explicitly enter `/experiences/[experienceId]` (or your chosen path name)
a

**Make sure to add env.local** Make sure to get the real app environment vairables from your whop dashboard and set them in .env.local


For more info, see our docs at https://dev.whop.com/introduction
