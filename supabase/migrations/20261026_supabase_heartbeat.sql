-- 48-Hour Supabase Anti-Pause Heartbeat Migration
-- Ensures active database traffic & single-row heartbeat tracker

CREATE TABLE IF NOT EXISTS public.system_heartbeat (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_pinged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ping_count BIGINT NOT NULL DEFAULT 1,
  source TEXT DEFAULT 'cron_48h',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.system_heartbeat ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated roles to select & update heartbeat
DROP POLICY IF EXISTS "Allow read access to system_heartbeat" ON public.system_heartbeat;
CREATE POLICY "Allow read access to system_heartbeat"
  ON public.system_heartbeat FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow write access to system_heartbeat" ON public.system_heartbeat;
CREATE POLICY "Allow write access to system_heartbeat"
  ON public.system_heartbeat FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Seed initial heartbeat row
INSERT INTO public.system_heartbeat (id, last_pinged_at, ping_count, source)
VALUES (1, NOW(), 1, 'initial_setup')
ON CONFLICT (id) DO NOTHING;

-- RPC function to ping and record active traffic
CREATE OR REPLACE FUNCTION public.ping_supabase_heartbeat(ping_source text DEFAULT 'cron_48h')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_pinged_at timestamptz;
  v_ping_count bigint;
BEGIN
  INSERT INTO public.system_heartbeat (id, last_pinged_at, ping_count, source, updated_at)
  VALUES (1, NOW(), 1, COALESCE(ping_source, 'cron_48h'), NOW())
  ON CONFLICT (id) DO UPDATE SET
    last_pinged_at = NOW(),
    ping_count = public.system_heartbeat.ping_count + 1,
    source = COALESCE(EXCLUDED.source, public.system_heartbeat.source),
    updated_at = NOW()
  RETURNING last_pinged_at, ping_count INTO v_last_pinged_at, v_ping_count;

  RETURN jsonb_build_object(
    'ok', true,
    'last_pinged_at', v_last_pinged_at,
    'ping_count', v_ping_count,
    'source', COALESCE(ping_source, 'cron_48h')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.ping_supabase_heartbeat(text) TO anon, authenticated, service_role;
