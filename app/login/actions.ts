"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export type StaffLoginState =
  | { error: string; user?: never }
  | {
      error?: never;
      user: {
        id: string;
        email: string | null;
        full_name: string;
        role: "STAFF";
        staff_code: string | null;
      };
    }
  | null;

export type OwnerLoginState =
  | { error: string; user?: never }
  | {
      error?: never;
      user: {
        id: string;
        email: string | null;
        full_name: string;
        role: "OWNER";
        staff_code: string | null;
      };
    }
  | null;

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, staff_code")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    full_name: profile.full_name,
    role: profile.role as string,
    staff_code: profile.staff_code,
  };
}

export async function ownerLogin(
  prevState: OwnerLoginState,
  formData: FormData,
): Promise<OwnerLoginState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, staff_code")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "OWNER") {
    return { error: "Profil owner tidak dapat dimuat. Coba login lagi." };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
      full_name: profile.full_name,
      role: "OWNER",
      staff_code: profile.staff_code,
    },
  };
}

export async function staffLogin(
  prevState: StaffLoginState,
  formData: FormData,
): Promise<StaffLoginState> {
  const staffCode = formData.get("staff_code") as string;
  const pin = formData.get("pin") as string;

  if (!checkRateLimit(staffCode)) {
    return { error: "Terlalu banyak percobaan. Coba lagi 15 menit." };
  }

  if (!pin || pin.length < 4 || pin.length > 6) {
    return { error: "PIN harus 4-6 digit" };
  }

  const supabase = await createClient();

  const { data: staffRows, error: staffError } = await supabase
    .rpc('get_staff_auth', { staff_code_input: staffCode });

  if (staffError || !staffRows || staffRows.length === 0) {
    return { error: "Kode staff atau PIN salah" };
  }

  const record = staffRows[0];
  const match = bcrypt.compareSync(pin, record.pin_hash);
  if (!match) {
    return { error: "Kode staff atau PIN salah" };
  }

  const email = `staff-${staffCode}@app.awfood.local`;

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password: record.auth_token,
  });

  if (error) return { error: error.message };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, staff_code")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "STAFF") {
    return { error: "Profil staff tidak dapat dimuat. Coba login lagi." };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
      full_name: profile.full_name,
      role: "STAFF",
      staff_code: profile.staff_code,
    },
  };
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
