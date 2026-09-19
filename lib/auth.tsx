"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, logout as serverLogout } from "@/app/login/actions";
import type { Role } from "@/lib/dummy/types";

export interface AuthUser {
  id: string;
  email: string | null;
  full_name: string;
  role: Role;
  staff_code?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  setAuthenticatedUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRequest = useRef(0);

  useEffect(() => {
    let active = true;
    const requestId = ++loadRequest.current;

    async function loadUser() {
      try {
        const authUser = await getAuthUser();
        if (active && requestId === loadRequest.current) setUser(authUser as AuthUser | null);
      } catch {
        if (active && requestId === loadRequest.current) setUser(null);
      } finally {
        if (active && requestId === loadRequest.current) setLoading(false);
      }
    }

    loadUser();

    return () => { active = false; };
  }, []);

  const setAuthenticatedUser = useCallback((authenticatedUser: AuthUser) => {
    loadRequest.current += 1;
    setUser(authenticatedUser);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    loadRequest.current += 1;
    setUser(null);
    await serverLogout();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, setAuthenticatedUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function useRequireRole(role: Role) {
  const { user, role: r, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || r !== role)) {
      router.replace("/login");
    }
  }, [user, r, loading, router, role]);

  return { user, loading };
}
