"use client";

import { createContext, useContext, ReactNode } from "react";
import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "creator_manager" | "content_analyst" | "translator" | "publisher" | "creator";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function UserMenu() {
  const { user, login, logout } = useAuth();
  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <button
            onClick={logout}
            className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          onClick={login}
          className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/80"
        >
          Sign in
        </button>
      )}
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for authenticated session via cookie
    const hasToken = document.cookie.includes("access_token=");
    if (hasToken) {
      // Try to extract name/email from id_token cookie if present
      const idToken = document.cookie.match(/id_token=([^;]+)/);
      let name = "User";
      let email = "";
      if (idToken) {
        try {
          const payload = JSON.parse(atob(idToken[1].split(".")[1]));
          name = payload.name || payload.preferred_username || "User";
          email = payload.email || "";
        } catch { /* ignore parse errors */ }
      }
      setUser({
        id: "auth-user",
        name,
        email,
        role: "admin",
      });
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: () => {
          window.location.href = "/api/auth/signin";
        },
        logout: () => {
          window.location.href = "/api/auth/signout";
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export { UserMenu };
