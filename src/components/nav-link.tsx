"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
};

export function NavLink({ href, children, exact = false }: Props) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={`transition-colors hover:text-foreground ${
        active
          ? "text-foreground font-medium"
          : "text-muted-foreground hover:underline"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
