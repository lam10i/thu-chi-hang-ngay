import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TransactionsProvider } from "@/hooks/useTransactions";
import { CategoriesProvider } from "@/hooks/useCategories";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Sổ Chi Tiêu Hằng Ngày",
  description: "Ứng dụng ghi chép chi tiêu cá nhân và xem biểu đồ trực quan",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CategoriesProvider>
            <TransactionsProvider>
              <Header />
              <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
                {children}
              </main>
              <Toaster richColors position="top-right" />
            </TransactionsProvider>
          </CategoriesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
