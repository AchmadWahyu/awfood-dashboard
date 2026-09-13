-- Migration: Add expenses table
-- Run this via Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('BAHAN_MINUMAN', 'BAHAN_KUE', 'PLASTIK', 'KARDUS', 'NOTA', 'STEMPEL_STIKER', 'LAINNYA')),
    custom_label TEXT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    pocket TEXT NOT NULL CHECK (pocket IN ('CASH_LACI', 'QRIS_AWFOOD')),
    expense_date DATE NOT NULL,
    note TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage expenses" 
    ON public.expenses FOR ALL 
    USING (public.is_owner());

CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
