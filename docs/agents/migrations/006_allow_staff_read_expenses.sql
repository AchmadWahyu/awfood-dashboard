-- Migration: Allow authenticated users to read expenses (for staff transparency)
-- Run this via Supabase SQL Editor

-- Add SELECT policy for all authenticated users
CREATE POLICY "Authenticated read expenses" 
    ON public.expenses FOR SELECT 
    USING (auth.role() = 'authenticated');
