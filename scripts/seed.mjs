// Seed akun: 1 owner + 2 staff (auth user + profile + PIN hash).
// Jalankan: npm run seed  (membaca kredensial dari .env.local)
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(filePath) {
  const abs = resolve(rootDir, filePath);
  if (!existsSync(abs)) return {};
  const out = {};
  for (const raw of readFileSync(abs, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

const env = parseEnvFile(".env.local");
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: butuh NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OWNER = {
  email: "awfood.owner@gmail.com",
  password: "Awfood@98",
  full_name: "Owner AW Food",
};

const STAFFS = [
  { staff_code: "B001", pin: "1234", full_name: "Budi Karyawan" },
  { staff_code: "A002", pin: "5678", full_name: "Ani Karyawan" },
];

function staffEmail(staffCode) {
  return `staff-${staffCode}@app.awfood.local`;
}

function generateAuthToken() {
  return randomBytes(16).toString("hex");
}

async function getUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw new Error(`Gagal list users: ${error.message}`);
  // Supabase menormalisasi email ke huruf kecil saat registrasi
  // (staff-B001@... tersimpan sebagai staff-b001@...).
  const target = email.toLowerCase();
  return data.users.find((u) => u.email?.toLowerCase() === target) ?? null;
}

async function seedOwner() {
  let user = await getUserByEmail(OWNER.email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: OWNER.email,
      password: OWNER.password,
      email_confirm: true,
      user_metadata: { full_name: OWNER.full_name, role: "OWNER" },
    });
    if (error) {
      if (!error.message?.toLowerCase().includes("already been registered")) {
        throw new Error(`Gagal membuat owner: ${error.message}`);
      }
      user = await getUserByEmail(OWNER.email);
      if (!user) throw new Error(`Gagal membuat owner: ${error.message}`);
      console.log(`Owner sudah ada: ${OWNER.email} (password tidak diubah)`);
    } else {
      user = data.user;
      console.log(`Owner dibuat: ${OWNER.email} (password default: ${OWNER.password})`);
    }
  } else {
    console.log(`Owner sudah ada: ${OWNER.email} (password tidak diubah)`);
  }

  const { error } = await admin.from("profiles").upsert(
    { id: user.id, full_name: OWNER.full_name, role: "OWNER" },
    { onConflict: "id" }
  );
  if (error) throw new Error(`Gagal update profile owner: ${error.message}`);
}

async function seedStaff(staff) {
  const email = staffEmail(staff.staff_code);
  const authToken = generateAuthToken();
  const pinHash = bcrypt.hashSync(staff.pin, 10);

  let user = await getUserByEmail(email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: authToken,
      email_confirm: true,
      user_metadata: { full_name: staff.full_name, role: "STAFF" },
    });
    if (error) {
      if (!error.message?.toLowerCase().includes("already been registered")) {
        throw new Error(`Gagal membuat staff ${staff.staff_code}: ${error.message}`);
      }
      user = await getUserByEmail(email);
      if (!user) throw new Error(`Gagal membuat staff ${staff.staff_code}: ${error.message}`);
    } else {
      user = data.user;
    }
  }

  // Reset password supaya selalu sinkron dengan auth_token yang disimpan.
  {
    const { error } = await admin.auth.admin.updateUserById(user.id, { password: authToken });
    if (error) throw new Error(`Gagal reset password staff ${staff.staff_code}: ${error.message}`);
  }

  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: staff.full_name,
      role: "STAFF",
      staff_code: staff.staff_code,
      pin_hash: pinHash,
      auth_token: authToken,
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(`Gagal update profile staff ${staff.staff_code}: ${error.message}`);

  console.log(`Staff ${staff.staff_code} (${staff.full_name}): PIN ${staff.pin}, email ${email}`);
}

async function main() {
  console.log("Seeding akun ke Supabase...");
  await seedOwner();
  for (const staff of STAFFS) {
    await seedStaff(staff);
  }
  console.log("Selesai. Staff login: kode staff + PIN (tanpa email). Owner login: email + password.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
