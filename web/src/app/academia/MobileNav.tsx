"use client";

import { useState } from "react";
import Link from "next/link";

type Item = { href: string; label: string };

export default function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menú"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#cfe3e6] bg-white text-cyan-800"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-[#e7dcc4] bg-[#faf6ee] shadow-lg">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {items.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-white hover:text-cyan-700"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
