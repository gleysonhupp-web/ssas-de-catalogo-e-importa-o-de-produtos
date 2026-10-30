"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
}

// Ícones em traço simples (24x24), herdando a cor do texto.
const ICONS = {
  catalog: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  store: "M3 9l1-5h16l1 5M4 9v11h16V9M3 9h18M9 20v-6h6v6",
  imports: "M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3",
  cart: "M3 4h2l2.4 11h11.2L21 7H6.2M9 20a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z",
  admin: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z",
  login: "M10 17l5-5-5-5M15 12H3M14 3h6v18h-6",
  signup: "M15 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9 10a3 3 0 100-6 3 3 0 000 6zM19 8v6M22 11h-6",
};

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="side-nav" aria-label="Menu principal">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className="side-link" aria-current={active ? "page" : undefined}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.badge ? <span className="side-badge">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
