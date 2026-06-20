import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { listLeads, getLead, setLeadStatus, setLeadSpam, deleteLead, type LeadStatus } from "@/db/leads";
import { sendLeadReply } from "@/lib/email";
import { listBlocklist, addBlock, removeBlock, type BlockKind } from "@/db/spam-blocklist";
import ConfirmButton from "@/components/ConfirmButton";
import type { Lead } from "@/db/schema";

const MSG: Record<string, { ok: boolean; text: string }> = {
  enviado: { ok: true, text: "✓ Respuesta enviada y marcada como contactado." },
  error: { ok: false, text: "No se pudo enviar la respuesta. Inténtalo de nuevo." },
  estado: { ok: true, text: "✓ Estado actualizado." },
  faltan: { ok: false, text: "Escribe asunto y mensaje antes de enviar." },
  borrado: { ok: true, text: "✓ Interesado eliminado." },
  spam: { ok: true, text: "✓ Marcado como spam y archivado. No volverá a avisarte por correo." },
  nospam: { ok: true, text: "✓ Restaurado: ya no está marcado como spam." },
  bloqueado: { ok: true, text: "✓ Añadido a la lista de bloqueo. Sus próximos mensajes se descartarán." },
  desbloqueado: { ok: true, text: "✓ Quitado de la lista de bloqueo." },
};

const BLOCK_LABEL: Record<BlockKind, string> = { term: "Término", email: "Correo", domain: "Dominio" };

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

async function spamAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const id = String(formData.get("id") ?? "");
  const spam = String(formData.get("spam") ?? "") === "1";
  if (id) await setLeadSpam(id, spam);
  revalidatePath("/admin/leads");
  redirect(`/admin/leads?m=${spam ? "spam" : "nospam"}`);
}

async function blockAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const kind = String(formData.get("kind") ?? "") as BlockKind;
  const value = String(formData.get("value") ?? "").trim();
  const leadId = String(formData.get("leadId") ?? "");
  if (["term", "email", "domain"].includes(kind) && value) {
    await addBlock(kind, value);
    if (leadId) await setLeadSpam(leadId, true); // bloqueo desde un lead: márcalo spam
  }
  revalidatePath("/admin/leads");
  redirect("/admin/leads?m=bloqueado");
}

async function unblockAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const id = String(formData.get("id") ?? "");
  if (id) await removeBlock(id);
  revalidatePath("/admin/leads");
  redirect("/admin/leads?m=desbloqueado");
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

function LeadCard({ l, isSpam }: { l: Lead; isSpam: boolean }) {
  const status = l.status as LeadStatus;
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${isSpam ? "border-slate-200 bg-slate-50/60 opacity-80" : "border-slate-200 bg-white"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">
            {l.name}{" "}
            {isSpam ? (
              <span className="ml-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">Spam</span>
            ) : (
              <span className={`ml-1 rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
            )}
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
        {!isSpam &&
          (["new", "contacted", "archived"] as LeadStatus[])
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
        <form action={spamAction}>
          <input type="hidden" name="id" value={l.id} />
          <input type="hidden" name="spam" value={isSpam ? "0" : "1"} />
          <button className={`rounded-md border px-3 py-1 text-xs font-medium ${isSpam ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-rose-200 text-rose-600 hover:bg-rose-50"}`}>
            {isSpam ? "No es spam" : "Marcar spam"}
          </button>
        </form>
        <form action={blockAction}>
          <input type="hidden" name="kind" value="email" />
          <input type="hidden" name="value" value={l.email} />
          <input type="hidden" name="leadId" value={l.id} />
          <button className="rounded-md border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">Bloquear correo</button>
        </form>
        {l.email.includes("@") && (
          <form action={blockAction}>
            <input type="hidden" name="kind" value="domain" />
            <input type="hidden" name="value" value={l.email.split("@")[1]} />
            <input type="hidden" name="leadId" value={l.id} />
            <button className="rounded-md border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">Bloquear dominio</button>
          </form>
        )}
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

      {!isSpam && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-cyan-700">Responder por email</summary>
          <p className="mt-2 text-xs text-slate-400">
            La respuesta sale desde el correo de la plataforma; tu dirección personal no se muestra.
          </p>
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
      )}
    </div>
  );
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
  const ham = leads.filter((l) => !l.spam);
  const spam = leads.filter((l) => l.spam);
  const pending = ham.filter((l) => l.status !== "archived").length;
  const blocklist = await listBlocklist();

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Interesados</h1>
      <p className="text-sm text-slate-500">
        {ham.length} reales · {pending} sin archivar{spam.length ? ` · ${spam.length} en spam` : ""}. Llegan del formulario de contacto de la web.
      </p>

      {msg && (
        <p className={`mt-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {ham.map((l) => <LeadCard key={l.id} l={l} isSpam={false} />)}
        {!ham.length && <p className="text-sm text-slate-500">Aún no hay interesados reales.</p>}
      </div>

      <details className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          Lista de bloqueo ({blocklist.length})
        </summary>
        <p className="mt-1 text-xs text-slate-400">
          Cualquier mensaje que coincida con un <strong>término</strong>, <strong>correo</strong> o <strong>dominio</strong> de esta lista se descarta automáticamente, además del filtro por contenido.
        </p>
        <form action={blockAction} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-col text-xs text-slate-600">Tipo
            <select name="kind" defaultValue="domain" className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="domain">Dominio (p. ej. agencia.com)</option>
              <option value="email">Correo exacto</option>
              <option value="term">Término / frase</option>
            </select>
          </label>
          <label className="flex flex-col text-xs text-slate-600">Valor
            <input name="value" required placeholder="agencia.com" className="mt-1 w-64 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <button className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900">Añadir a la lista</button>
        </form>
        {blocklist.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {blocklist.map((b) => (
              <li key={b.id} className="flex items-center gap-2 py-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{BLOCK_LABEL[b.kind as BlockKind] ?? b.kind}</span>
                <span className="font-mono text-slate-700">{b.value}</span>
                <form action={unblockAction} className="ml-auto">
                  <input type="hidden" name="id" value={b.id} />
                  <button className="text-xs font-medium text-cyan-700 hover:underline">Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </details>

      {spam.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-semibold text-rose-700">
            Spam bloqueado ({spam.length}) — no se avisó por correo
          </summary>
          <p className="mt-1 text-xs text-slate-400">
            Mensajes de agencias de marketing/web detectados automáticamente. Revísalos por si hubiera algún falso positivo.
          </p>
          <div className="mt-4 space-y-4">
            {spam.map((l) => <LeadCard key={l.id} l={l} isSpam={true} />)}
          </div>
        </details>
      )}
    </main>
  );
}
