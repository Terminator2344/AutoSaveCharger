# Supabase Migration Guide

This document describes the migration from Prisma to Supabase SDK for the AutoChargeSaver project.

## Overview

All Prisma Client calls have been replaced with Supabase SDK calls while maintaining the same API contracts and business logic.

## Changes Made

### 1. New Files Created

- `src/lib/db.ts` - Supabase client setup (admin and public clients)
- `src/lib/repo/eventsRepo.ts` - Event repository with Supabase operations
- `src/lib/repo/clicksRepo.ts` - Click repository with Supabase operations
- `supabase/migrations/000001_create_core_tables.sql` - SQL migration for Supabase tables
- `app/api/_health/route.ts` - Health check endpoint for testing Supabase connection

### 2. Updated Files

- `app/api/webhooks/whop/route.ts` - Now uses `createEvent` from eventsRepo
- `app/api/events/route.ts` - Now uses `findManyEvents` from eventsRepo
- `app/api/metrics/route.ts` - Now uses `countEvents`, `aggregateEvents`, `groupByChannel` from eventsRepo and `countClicks` from clicksRepo
- `app/api/metrics/previous/route.ts` - Same as above
- `src/services/click.ts` - Now uses Supabase repos instead of in-memory store
- `package.json` - Added `@supabase/supabase-js` dependency
- `env.example` - Added Supabase environment variables
- `src/config/env.ts` - Added Supabase env variable validation

### 3. Data Mapping

The migration includes field mapping to handle differences between Prisma schema and Supabase:

- `userEmail` / `whopUserId` → stored as `email` / `user_id` in database, also accessible via mapped fields
- `amountCents` / `channel` → stored in `meta` JSONB column for flexibility
- All timestamps converted to ISO strings for Supabase

### 4. Table Names

Tables use quoted identifiers (`"Event"`, `"Click"`) to preserve Prisma schema naming:
- `Event` - stores payment events
- `Click` - stores click tracking data
- `Notification` - stores notification records (if needed)
- `User` - stores user records (if needed)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Get your project URL and API keys:
   - `SUPABASE_URL` - Your project URL
   - `SUPABASE_ANON_KEY` - Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (for server-side operations)

### 3. Run Migration

Copy the SQL from `supabase/migrations/000001_create_core_tables.sql` and run it in:
- Supabase Dashboard → SQL Editor

Or use Supabase CLI:
```bash
supabase db push
```

### 4. Configure Environment Variables

Add to your `.env.local` or deployment environment:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Test Connection

```bash
npm run dev
```

Then visit: `http://localhost:3000/api/_health`

Should return: `{ "ok": true, "connected": true }`

## API Endpoints (No Changes)

All API endpoints maintain the same contracts:

- `POST /api/webhooks/whop` - Receives webhooks, creates events
- `GET /api/events` - Returns last 100 events
- `GET /api/metrics` - Returns current week metrics
- `GET /api/metrics/previous` - Returns previous week metrics
- `GET /api/_health` - Health check (new)

## Rollback

If you need to rollback to Prisma:

1. The Prisma schema is still in `prisma/schema.prisma`
2. `src/lib/prisma.ts` still exists (though not used)
3. Prisma dependencies remain in `package.json`
4. Simply revert the API route changes to use `prisma` instead of Supabase repos

## Notes

- The old in-memory `db.ts` store has been replaced with Supabase
- All Prisma queries have been translated to Supabase equivalents
- Aggregations (like `groupBy`) are done in JavaScript after fetching data
- The `meta` JSONB column stores additional fields like `amountCents` and `channel`
- RLS policies are set to allow service role full access (adjust for production)

## Testing Checklist

- [ ] `/api/_health` returns `{ ok: true }`
- [ ] Webhook endpoint creates events successfully
- [ ] `/api/events` returns events in correct format
- [ ] `/api/metrics` returns correct aggregations
- [ ] `/api/metrics/previous` returns correct previous week data
- [ ] Dashboard displays data correctly
- [ ] Events table displays data correctly

## Troubleshooting

### Error: "Missing SUPABASE_URL environment variable"

Make sure you've set all three Supabase environment variables in your `.env.local`.

### Error: "relation 'Event' does not exist"

Run the SQL migration in Supabase Dashboard → SQL Editor.

### Error: "new row violates row-level security policy"

Check RLS policies in Supabase Dashboard → Authentication → Policies. The migration creates permissive policies for service role.

### Data format mismatches

Check that the `meta` JSONB column structure matches what the code expects. The repo functions handle mapping automatically.


