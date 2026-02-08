"use client";

import { usePathname } from "next/navigation";

export function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide header on login page and potentially others like register/onboarding if needed
  const shouldHideHeader = pathname === "/login" || pathname === "/auth/popup/success";

  if (shouldHideHeader) {
    return null;
  }

  return <>{children}</>;
}
