import { APP_VERSION } from "@/lib/version";

/** Pie discreto con copyright y versión, igual en todas las áreas internas
 * (panel, login, portal de la trabajadora) y en la web pública. */
export default function VersionFooter() {
  return (
    <footer className="border-t border-[#e7dcc4] bg-[#faf6ee] py-4 text-center print:hidden">
      <p className="text-xs text-slate-400">
        © {new Date().getFullYear()} PlanTurnos · planturnos.com · {APP_VERSION}
      </p>
    </footer>
  );
}
