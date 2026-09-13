-- Migration: Add expense snapshot columns to daily_closings
-- Run this via Supabase SQL Editor

ALTER TABLE public.daily_closings
ADD COLUMN IF NOT EXISTS expenses_cash_snapshot NUMERIC(12,2) DEFAULT 0 NOT NULL;

ALTER TABLE public.daily_closings
ADD COLUMN IF NOT EXISTS expenses_qris_snapshot NUMERIC(12,2) DEFAULT 0 NOT NULL;
