-- Migration: Create core tables for AutoChargeSaver
-- Run this in Supabase Dashboard → SQL Editor

-- Note: Supabase uses snake_case by default, but we'll use quoted identifiers
-- to match Prisma schema names (Event, Click, etc.) for consistency

-- Create Event table
CREATE TABLE IF NOT EXISTS "Event" (
  id TEXT PRIMARY KEY,
  whop_event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  user_id TEXT,
  subscription_id TEXT,
  email TEXT,
  status TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  recovered BOOLEAN DEFAULT false,
  reason TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_event_type ON "Event"(type);
CREATE INDEX IF NOT EXISTS idx_event_occurred_at ON "Event"(occurred_at);
CREATE INDEX IF NOT EXISTS idx_event_recovered ON "Event"(recovered);
CREATE INDEX IF NOT EXISTS idx_event_user_id ON "Event"(user_id);
CREATE INDEX IF NOT EXISTS idx_event_meta_channel ON "Event" USING GIN ((meta->'channel'));

-- Create Click table
CREATE TABLE IF NOT EXISTS "Click" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  message_id TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for Click table
CREATE INDEX IF NOT EXISTS idx_click_user_id ON "Click"(user_id);
CREATE INDEX IF NOT EXISTS idx_click_clicked_at ON "Click"(clicked_at);
CREATE INDEX IF NOT EXISTS idx_click_channel ON "Click"(channel);

-- Create Notification table (if needed by other services)
CREATE TABLE IF NOT EXISTS "Notification" (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  subscription_id TEXT,
  channel TEXT NOT NULL,
  message_id TEXT,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create User table (if needed)
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  tg_user_id TEXT,
  discord_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Click" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security requirements)
-- For now, allow service role to do everything (server-side operations)
-- You may want to add more restrictive policies for production

CREATE POLICY "Service role full access" ON "Event"
  FOR ALL USING (true);

CREATE POLICY "Service role full access" ON "Click"
  FOR ALL USING (true);

CREATE POLICY "Service role full access" ON "Notification"
  FOR ALL USING (true);

CREATE POLICY "Service role full access" ON "User"
  FOR ALL USING (true);


