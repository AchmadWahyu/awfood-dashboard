-- Phase 17A: security boundaries and ownership rules.
-- Run manually in Supabase SQL Editor after the existing migrations.

BEGIN;

-- Profiles: authenticated users may only read their own safe profile row.
-- Owners retain access to all profiles for owner-side administration.
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.is_owner());

-- Staff PIN lookup must never be callable with the public anon key.
REVOKE ALL ON FUNCTION public.get_staff_auth(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_staff_auth(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_auth(TEXT) TO service_role;

-- A staff member may only read their own closing. Owners may read all closings.
DROP POLICY IF EXISTS "Authenticated view daily closings" ON public.daily_closings;
DROP POLICY IF EXISTS "Users view own daily closings" ON public.daily_closings;
CREATE POLICY "Users view own daily closings"
    ON public.daily_closings FOR SELECT
    USING (staff_id = auth.uid() OR public.is_owner());

-- Closing items inherit ownership from their parent closing.
DROP POLICY IF EXISTS "Staff insert closing items" ON public.daily_closing_items;
DROP POLICY IF EXISTS "Authenticated view closing items" ON public.daily_closing_items;
DROP POLICY IF EXISTS "Staff insert own closing items" ON public.daily_closing_items;
DROP POLICY IF EXISTS "Users view own closing items" ON public.daily_closing_items;
CREATE POLICY "Staff insert own closing items"
    ON public.daily_closing_items FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.daily_closings c
        WHERE c.id = closing_id
          AND c.staff_id = auth.uid()
          AND c.status = 'submitted'
      )
    );
CREATE POLICY "Users view own closing items"
    ON public.daily_closing_items FOR SELECT
    USING (
      public.is_owner()
      OR EXISTS (
        SELECT 1
        FROM public.daily_closings c
        WHERE c.id = closing_id
          AND c.staff_id = auth.uid()
      )
    );

COMMIT;
