-- Migration: Add status and verification columns to daily_closings
-- Run this via Supabase SQL Editor if your table was created before this change

-- Add status column with default 'submitted'
ALTER TABLE public.daily_closings
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted' NOT NULL CHECK (status IN ('submitted', 'verified', 'rejected'));

-- Add discrepancy_status column
ALTER TABLE public.daily_closings
ADD COLUMN IF NOT EXISTS discrepancy_status TEXT CHECK (discrepancy_status IN ('open', 'resolved'));

-- Add discrepancy_resolution column
ALTER TABLE public.daily_closings
ADD COLUMN IF NOT EXISTS discrepancy_resolution TEXT CHECK (discrepancy_resolution IN ('koreksi data', 'ditanggung usaha', 'ditanggung karyawan'));

-- Add verified_by column referencing profiles
ALTER TABLE public.daily_closings
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

-- Add verified_at timestamp
ALTER TABLE public.daily_closings
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add updated_at timestamp
ALTER TABLE public.daily_closings
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows: set status to 'submitted' if null (should already be handled by DEFAULT)
UPDATE public.daily_closings SET status = 'submitted' WHERE status IS NULL;
