import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { NavLink } from "@/components/nav-link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinTrack",
  description: "Budget commun — mobile-first",
  applicationName: "FinTrack",
  appleWebApp: {
    capable: true,
    title: "FinTrack",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="border-b">
            <nav className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
              <Link href="/" className="font-semibold tracking-tight">
                FinTrack
              </Link>
              <div className="flex items-center gap-3 text-sm">
                <NavLink href="/" exact>
                  Tableau
                </NavLink>
                <NavLink href="/transactions">Transactions</NavLink>
                <NavLink href="/budgets">Budgets</NavLink>
                <NavLink href="/import">Importer</NavLink>
                <NavLink href="/settings/categories">Catégories</NavLink>
                <ThemeToggle />
              </div>
            </nav>
          </header>
          <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
            {children}
          </main>
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
