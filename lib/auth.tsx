"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User, Role } from "@/lib/dummy/types";
import { getCurrentUser, setCurrentUser, findUserByEmail, findUserByStaffCode, getUsers } from "@/lib/dummy/api";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  loginOwner: (email?: string) => boolean;
  loginStaff: (staffCode: string, pin: string) => boolean;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  const loginOwner = (email?: string): boolean => {
    const target = email || "owner@awfood.id";
    const u = findUserByEmail(target);
    if (!u || u.role !== "OWNER") return false;
    setCurrentUser(u);
    setUser(u);
    router.replace("/owner/dashboard");
    return true;
  };

  const loginStaff = (staffCode: string, pin: string): boolean => {
    const u = findUserByStaffCode(staffCode);
    if (!u || u.role !== "STAFF" || u.pin !== pin) return false;
    setCurrentUser(u);
    setUser(u);
    router.replace("/employee/penutupan");
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setUser(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, loginOwner, loginStaff, logout, loading }}>
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
