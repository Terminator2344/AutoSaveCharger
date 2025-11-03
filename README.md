AutoChargeSaver — Whop-native App Scaffold

What this app does
- Whop App with OAuth, Webhooks, App Views (iframe + frosted UI), Notifications, and Click Tracking for billing recovery.

Requirements
- Node 18+ (tested with Node 20)
- Create a Whop App (see docs/whop/INDEX.md)
- Configure OAuth redirect: /api/whop/oauth/callback
- Set Webhook secret and endpoint: /api/whop/webhook

Environment
- Copy env.example to .env and fill values.

Install & Run Locally
```
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Routes
- GET /api/whop/oauth/authorize — starts OAuth (minimal scopes placeholder)
- GET /api/whop/oauth/callback — verifies state, exchanges code (stub), stores tokens (stub)
- POST /api/whop/webhook — verifies HMAC signature, stores events idempotently
- ANY /api/whop/dev-proxy — dev-only helper
- GET /api/r/[userId]?c=channel&m=messageId — records click and redirects to Whop billing URL if available

Testing
- OAuth: open /views/dashboard and click Connect Whop
- Webhook: send signed JSON; header "whop-signature" must be HMAC-SHA256(raw_body, WHOP_WEBHOOK_SECRET)
- Click tracking: open http://localhost:3000/api/r/USER123?c=email&m=abc

Permissions (minimal, update per docs)
- read:subscriptions — to validate subscription state
- read:users — to map user identity
See docs/whop/INDEX.md for rationale.

Docs
- See docs/whop/INDEX.md and individual pages under docs/whop.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
