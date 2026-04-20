"use client";

import React, { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";

export type PermissionsContextType = {
  hasAccess: (action: string) => boolean;
  allowedFunctions: string[];
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined,
);

export function PermissionsProvider({
  children,
  menus,
}: {
  children: React.ReactNode;
  menus: any[];
}) {
  const pathname = usePathname();

  const value = useMemo(() => {
    // Find the menu that matches the current pathname
    const currentMenu = menus.find((m: any) => {
      if (!m.route_path) return false;
      return (
        pathname === m.route_path || pathname.startsWith(m.route_path + "/")
      );
    });

    const allowedFunctions: string[] = currentMenu?.functions || [];

    const hasAccess = (action: string) => {
      return allowedFunctions.includes(action);
    };

    return { hasAccess, allowedFunctions };
  }, [pathname, menus]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error(
      "usePermissionsContext must be used within a PermissionsProvider",
    );
  }
  return context;
}
