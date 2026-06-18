import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { listLeads, getLead, setLeadStatus, deleteLead, type LeadStatus } from "@/db/leads";
import { sendLeadReply } from "@/lib/email";
import ConfirmButton from "@/components/ConfirmButton";

const MSG: Record<string, { ok: boolean; text: string }> = {
  enviado: { ok: true, text: "✓ Respuesta enviada y marcada como contactado." },
  error: { ok: false, text: "No se pudo enviar la respuesta. Inténtalo de nuevo." },
  estado: { ok: true, text: "✓ Estado actualizado." },
  faltan: { ok: false, text: "Escribe asunto y mensaje antes de enviar." },
  borrado: { ok: true, text: "✓ Interesado eliminado." },
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  archived: "Archivado",
};
const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  contacted: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-100 text-slate-500",
};

async function statusAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;
  if (id && ["new", "contacted", "archived"].includes(status)) {
    await setLeadStatus(id, status);
  }
  revalidatePath("/admin/leads");
  redirect("/admin/leads?m=estado");
}

async function deleteAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const id = String(formData.get("id") ?? "");
  if (id) await deleteLead(id);
  revalidatePath("/admin/leads");
  redirect("/admin/leads?m=borrado");
}

async function replyAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const id = String(formData.get("id") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!id || !subject || !body) redirect("/admin/leads?m=faltan");

  const lead = await getLead(id);
  if (!lead) redirect("/admin/leads");

  try {
    await sendLeadReply({ to: lead.email, subject, body });
    await setLeadStatus(id, "contacted");
  } catch {
    redirect("/admin/leads?m=error");
  }
  revalidatePath("/admin/leads");
  redirect("/admin/leads?m=enviado");
}

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/panel");
  const sp = await searchParams;
  const msg = sp.m ? MSG[sp.m] : null;

  const leads = await listLeads();
  const pending = leads.filter((l) => l.status !== "archived").length;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Interesados</h1>
      <p className="text-sm text-slate-500">
        {leads.length} en total · {pending} sin archivar. Llegan del formulario de contacto de la web.
      </p>

      {msg && (
        <p className={`mt-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {leads.map((l) => {
          const status = l.status as LeadStatus;
          return (
            <div key={l.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {l.name}{" "}
                    <span className={`ml-1 rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">
                    <a href={`mailto:${l.email}`} className="text-cyan-700 hover:underline">{l.email}</a>
                    {l.org ? ` · ${l.org}` : ""}
                  </p>
                </div>
                <p className="text-xs text-slate-400">{fmt(new Date(l.createdAt))}</p>
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{l.message}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(["new", "contacted", "archived"] as LeadStatus[])
                  .filter((s) => s !== status)
                  .map((s) => (
                    <form key={s} action={statusAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="status" value={s} />
                      <button className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        Marcar {STATUS_LABEL[s].toLowerCase()}
                      </button>
                    </form>
                  ))}
                <form action={deleteAction} className="ml-auto">
                  <input type="hidden" name="id" value={l.id} />
                  <ConfirmButton
                    confirm={`¿Borrar definitivamente el mensaje de ${l.name}? Esta acción no se puede deshacer.`}
                    className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </ConfirmButton>
                </form>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-cyan-700">Responder por email</summary>
                <form action={replyAction} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={l.id} />
                  <input
                    name="subject"
                    defaultValue={`Re: tu consulta sobre PlanTurnos`}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                  <textarea
                    name="body"
                    rows={5}
                    placeholder={`Hola ${l.name.split(" ")[0]},\n\n…`}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                  <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
                    Enviar respuesta
                  </button>
                </form>
              </details>
            </div>
          );
        })}
        {!leads.length && <p className="text-sm text-slate-500">Aún no hay interesados.</p>}
      </div>
    </main>
  );
}
