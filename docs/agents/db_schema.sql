-- ========================================================
-- 1. EXTENSIONS
-- ========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 2. PROFILES & AUTHENTICATION (SUPABASE AUTH)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'STAFF')),
    pin_hash TEXT, -- NULL untuk Owner, Bcrypt hash untuk Staff PIN
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    staff_code TEXT UNIQUE, -- kode unik untuk tiap staff, misal "STF-001", "STF-002", dst.
    auth_token TEXT -- token buat ganti password buat staff
);

-- Function Helper: Cek apakah user saat ini adalah Owner yang aktif
CREATE OR REPLACE FUNCTION public.is_owner() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
          AND role = 'OWNER' 
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Buat profile otomatis saat ada user baru dimasukkan ke auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role) 
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Staff AW Food'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'STAFF')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS di public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles" 
    ON public.profiles FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Owner manage all profiles" 
    ON public.profiles FOR ALL 
    USING (public.is_owner());

-- ========================================================
-- 3. KATALOG & SUPPLIER
-- ========================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone_number TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read suppliers" 
    ON public.suppliers FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Owner manage suppliers" 
    ON public.suppliers FOR ALL 
    USING (public.is_owner());

CREATE TABLE IF NOT EXISTS public.master_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('KONSINYASI_KUE', 'MINUMAN_OWNER', 'AYAM_PENYET')),
    cost_price NUMERIC(12,2) DEFAULT 0 NOT NULL,
    selling_price NUMERIC(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.master_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read items" 
    ON public.master_items FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Owner manage items" 
    ON public.master_items FOR ALL 
    USING (public.is_owner());

-- ========================================================
-- 4. OPERASIONAL HARIAN & CLOSING (SHIFT)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.daily_closings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    closing_date DATE NOT NULL UNIQUE,
    staff_id UUID NOT NULL REFERENCES public.profiles(id),
    cash_initial NUMERIC(12,2) DEFAULT 0 NOT NULL, -- uang kembalian awal di laci (modal kerja, bukan omzet)
    cash_physical NUMERIC(12,2) DEFAULT 0 NOT NULL,
    qris_physical NUMERIC(12,2) DEFAULT 0 NOT NULL,
    total_system_omzet NUMERIC(12,2) DEFAULT 0 NOT NULL,
    cash_discrepancy NUMERIC(12,2) DEFAULT 0 NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

-- PERBAIKAN: staff_id wajib sama dengan auth.uid() agar tidak bisa melempar tanggung jawab ke id kasir lain
CREATE POLICY "Staff insert daily closings" 
    ON public.daily_closings FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND staff_id = auth.uid());

CREATE POLICY "Authenticated view daily closings" 
    ON public.daily_closings FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Owner update daily closings" 
    ON public.daily_closings FOR UPDATE 
    USING (public.is_owner());

CREATE TABLE IF NOT EXISTS public.daily_closing_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    closing_id UUID NOT NULL REFERENCES public.daily_closings(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.master_items(id),
    initial_stock INT DEFAULT 0 NOT NULL,
    restock_stock INT DEFAULT 0 NOT NULL,
    remaining_stock INT DEFAULT 0 NOT NULL,
    sold_quantity INT GENERATED ALWAYS AS ((initial_stock + restock_stock) - remaining_stock) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.daily_closing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff insert closing items" 
    ON public.daily_closing_items FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated view closing items" 
    ON public.daily_closing_items FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Owner update closing items" 
    ON public.daily_closing_items FOR UPDATE 
    USING (public.is_owner());

-- ========================================================
-- 5. KLAIM BASI / RUSAK / BONUS
-- ========================================================
CREATE TABLE IF NOT EXISTS public.item_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    closing_id UUID REFERENCES public.daily_closings(id) ON DELETE SET NULL,
    item_id UUID NOT NULL REFERENCES public.master_items(id),
    staff_id UUID NOT NULL REFERENCES public.profiles(id),
    claim_type TEXT NOT NULL CHECK (claim_type IN ('BASI', 'RUSAK', 'BONUS', 'KONSUMSI_INTERNAL')),
    quantity INT NOT NULL CHECK (quantity > 0),
    proof_photo_url TEXT,
    status TEXT DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.item_claims ENABLE ROW LEVEL SECURITY;

-- PERBAIKAN: Karyawan hanya bisa membuat klaim atas nama dirinya sendiri
CREATE POLICY "Staff insert claims" 
    ON public.item_claims FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND staff_id = auth.uid());

CREATE POLICY "Authenticated view claims" 
    ON public.item_claims FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Owner update claims" 
    ON public.item_claims FOR UPDATE 
    USING (public.is_owner());

-- ========================================================
-- 6. AUDIT LOG & REQUEST EDITS
-- ========================================================
CREATE TABLE IF NOT EXISTS public.audit_request_edits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES public.profiles(id),
    target_table TEXT NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.audit_request_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff insert request edits" 
    ON public.audit_request_edits FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND staff_id = auth.uid());

CREATE POLICY "Authenticated view request edits" 
    ON public.audit_request_edits FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Owner update request edits" 
    ON public.audit_request_edits FOR UPDATE 
    USING (public.is_owner());

-- ========================================================
-- 7. POTONGAN GAJI KARYAWAN (EMPLOYEE DEDUCTIONS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.employee_deductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES public.profiles(id),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.employee_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view own deductions" 
    ON public.employee_deductions FOR SELECT 
    USING (staff_id = auth.uid() OR public.is_owner());

CREATE POLICY "Owner manage deductions" 
    ON public.employee_deductions FOR ALL 
    USING (public.is_owner());

-- ========================================================
-- 8. PELANTASAN SUPPLIER (SETTLEMENTS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.supplier_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    paid_by_staff_id UUID REFERENCES public.profiles(id),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH_LACI', 'TRANSFER_OWNER')),
    proof_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.supplier_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated insert settlements" 
    ON public.supplier_settlements FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner manage settlements" 
    ON public.supplier_settlements FOR ALL 
    USING (public.is_owner());