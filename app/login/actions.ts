"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export async function ownerLogin(
  prevState: { error?: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/owner/dashboard");
}

export async function staffLogin(
  prevState: { error?: string } | null,
  formData: FormData,
) {
  const staffCode = formData.get("staff_code") as string;
  const pin = formData.get("pin") as string;

  if (!checkRateLimit(staffCode)) {
    return { error: "Terlalu banyak percobaan. Coba lagi 15 menit." };
  }

  if (!pin || pin.length < 4 || pin.length > 6) {
    return { error: "PIN harus 4-6 digit" };
  }

  const supabase = await createClient();

  const { data: authToken, error: authTokenError } = await supabase
    .rpc('verify_staff_pin', { staff_code_input: staffCode, pin_input: pin });

  if (authTokenError) {
    return { error: authTokenError.message };
  }

  if (!authToken) {
    return { error: "Kode staff atau PIN salah" };
  }

  const email = `staff-${staffCode}@app.awfood.local`;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: authToken,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/employee/penutupan");
}
