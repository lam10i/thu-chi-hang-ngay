"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = !pathname.startsWith("/login");

  return (
    <>
      {showHeader && <Header />}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
