"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/create", label: "만들기" },
  { href: "/library", label: "내 서재" },
  { href: "/datasets", label: "AI Hub" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-surface">
            <span className="font-serif text-lg font-semibold">S</span>
          </div>
          <div>
            <span className="font-serif text-xl font-semibold tracking-tight text-ink">
              StorySeed
            </span>
            <span className="ml-1.5 text-[10px] uppercase tracking-[0.2em] text-gold">
              AI
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-5 py-2 text-sm transition-all duration-200 ${
                  active
                    ? "bg-ink text-surface font-medium"
                    : "text-ink-muted hover:text-ink hover:bg-ink/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/create"
          className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-surface transition-colors hover:bg-gold-dark md:hidden"
        >
          만들기
        </Link>
      </div>
    </header>
  );
}
