"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, Clock, House, Settings } from "lucide-react";

const TABS = [
  { href: "/", label: "Главная", Icon: House },
  { href: "/dashboard", label: "Отчёт", Icon: ChartColumn },
  { href: "/history", label: "История", Icon: Clock },
  { href: "/settings", label: "Настройки", Icon: Settings },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tabbar">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`tabbar__item${active ? " tabbar__item--active" : ""}`}
          >
            <Icon size={23} strokeWidth={active ? 2.4 : 1.9} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
