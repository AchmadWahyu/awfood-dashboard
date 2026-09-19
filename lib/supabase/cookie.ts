import type { CookieOptions } from "@supabase/ssr";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 1 month
export function pinSessionCookie(options: CookieOptions = {}): CookieOptions {
  return {
    ...options,
    maxAge: options.maxAge === 0 ? 0 : SESSION_MAX_AGE_SECONDS,
  };
}