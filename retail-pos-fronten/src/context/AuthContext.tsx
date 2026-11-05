"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  apiGetMe,
  apiLogin,
  apiLogout,
  clearStoredTokens,
  getStoredAccessToken,
} from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthContextType {
  user: AuthUser | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string | string[]) => boolean;
  refreshUser: () => Promise<void>;
  markPasswordChanged: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const token = getStoredAccessToken();
      if (!token) {
        setUser(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }
      const data = await apiGetMe();
      setUser(data.user);
      setPermissions(data.permissions || []);
    } catch (err) {
      console.warn("Failed to restore auth session:", err);
      setUser(null);
      setPermissions([]);
      clearStoredTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Route protection: if not logged in and not on /login, redirect to /login
  useEffect(() => {
    if (!isLoading) {
      const isAuthPage = pathname === "/login";
      if (!user && !isAuthPage) {
        router.push("/login");
      } else if (user && isAuthPage) {
        // If already logged in and navigates to /login, redirect to dashboard or POS
        if (user.role === "cashier") {
          router.push("/pos");
        } else {
          router.push("/");
        }
      }
    }
  }, [isLoading, user, pathname, router]);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setUser(res.user);
    setPermissions(res.permissions || []);
    if (res.user.role === "cashier") {
      router.push("/pos");
    } else {
      router.push("/");
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setPermissions([]);
      router.push("/login");
    }
  };

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.role === "admin") return true; // Admins have master access
      return permissions.includes(permission);
    },
    [user, permissions]
  );

  const hasRole = useCallback(
    (roles: string | string[]) => {
      if (!user) return false;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.includes(user.role);
    },
    [user]
  );

  const markPasswordChanged = () => {
    if (user) {
      setUser({ ...user, mustChangePassword: false });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        hasRole,
        refreshUser,
        markPasswordChanged,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
