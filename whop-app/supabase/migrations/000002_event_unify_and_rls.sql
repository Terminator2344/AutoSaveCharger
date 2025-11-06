-- Unify table name to public.event and enable basic RLS

-- If quoted "Event" exists, rename to lower-case event
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Event'
  ) THEN
    EXECUTE 'alter table "public"."Event" rename to event';
  END IF;
END$$;

-- Ensure event table exists
CREATE TABLE IF NOT EXISTS public.event (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  userEmail text,
  whopUserId text,
  userId text,
  email text,
  recovered boolean default false,
  reason text,
  amountCents numeric,
  channel text,
  occurredAt timestamptz default now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_userId ON public.event("userId");
CREATE INDEX IF NOT EXISTS idx_event_type ON public.event("type");
CREATE INDEX IF NOT EXISTS idx_event_occurredAt ON public.event("occurredAt");

-- Enable RLS
ALTER TABLE public.event ENABLE ROW LEVEL SECURITY;

-- Example policy for future client reads (keep service role for server):
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='event' AND policyname='user_owns_event'
  ) THEN
    EXECUTE $$CREATE POLICY "user_owns_event" ON public.event
      FOR SELECT USING (auth.uid()::text = "userId")$$;
  END IF;
END$$;


