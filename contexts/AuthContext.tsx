"use client";

import React, { createContext, useContext, useMemo } from "react";

// Hardcoded user ID since there's no login/logout mechanism
const DEFAULT_USER_ID = "ecafa12f-30fd-4d23-b659-eabe121bfea8";

interface AuthContextType {
  userId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      userId: DEFAULT_USER_ID,
    }),
    []
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
