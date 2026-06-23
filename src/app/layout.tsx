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
    { media: "(prefers-color-scheme: light)", color: "#f9f9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1f24" },
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
          <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
            <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold tracking-tight"
              >
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.65 0.16 162), oklch(0.52 0.16 162))",
                  }}
                >
                  €
                </span>
                <span>FinTrack</span>
              </Link>
              <ThemeToggle />
            </div>
            <nav className="max-w-2xl mx-auto px-3 pb-2 flex items-center gap-1 overflow-x-auto text-sm">
              <NavLink href="/" exact>
                Tableau
              </NavLink>
              <NavLink href="/transactions">Transactions</NavLink>
              <NavLink href="/budgets">Budgets</NavLink>
              <NavLink href="/import">Importer</NavLink>
              <NavLink href="/settings/categories">Catégories</NavLink>
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
