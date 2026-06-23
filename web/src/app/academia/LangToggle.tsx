"use client";

import { useRouter } from "next/navigation";
import { LANG_COOKIE, type Lang } from "./content";

export default function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();

  function set(l: Lang) {
    if (l === lang) return;
    document.cookie = `${LANG_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  }

  return (
    <div className="inline-flex overflow-hidden rounded-full border border-[#cfe3e6] text-xs font-semibold">
      {(["es", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          aria-pressed={l === lang}
          className={l === lang ? "bg-cyan-700 px-3 py-1 text-white" : "bg-white px-3 py-1 text-cyan-800 hover:bg-cyan-50"}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
