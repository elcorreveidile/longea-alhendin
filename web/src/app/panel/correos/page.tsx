import { redirect } from "next/navigation";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireAcademiaPanel } from "@/lib/panel-guard";
import { getStaffRole, autoCcEmails, STAFF_ROLE_LABEL } from "@/lib/staff-roles";
import { listTeacherContacts } from "@/db/teachers";
import { createStaffMessage, listStaffMessages } from "@/db/staff-messages";
import { sendStaffMessage } from "@/lib/email";
import TopBar from "@/components/TopBar";

const MSG: Record<string, { ok: boolean; text: string }> = {
  enviado: { ok: true, text: "✓ Mensaje enviado al profesorado seleccionado." },
  faltan: { ok: false, text: "Elige al menos un destinatario y escribe asunto y mensaje." },
  error: { ok: false, text: "No se pudo enviar. Inténtalo de nuevo en un momento." },
};

async function sendAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/correos");

  const to = formData.getAll("to").map(String).filter((e) => e.includes("@"));
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const includeDireccion = formData.get("ccDireccion") === "on";
  if (!to.length || !subject || !body) redirect("/panel/correos?m=faltan");

  const senderRole = session.role === "superadmin" ? "direccion" : await getStaffRole(session.userId);
  const { emails: cc } = await autoCcEmails(tenant.id, senderRole, {
    includeDireccion,
    senderEmail: session.email,
  });

  const senderName = session.name || tenant.name;
  const res = await sendStaffMessage({
    brand: { name: tenant.name, logoUrl: tenant.logoUrl, planturnos: false },
    senderName,
    senderEmail: session.email,
    to,
    cc,
    subject,
    body,
  });
  if (res.ok) {
    try {
      await createStaffMessage({
        tenantId: tenant.id,
        senderUserId: session.userId,
        senderName,
        senderRole: senderRole ?? null,
        subject,
        body,
        to,
        cc,
      });
    } catch (e) {
      console.error("[correos] no se pudo registrar el envío:", e);
    }
  }
  redirect(res.ok ? "/panel/correos?m=enviado" : "/panel/correos?m=error");
}

export default async function CorreosPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
  await requireAcademiaPanel();
  const tenant = await getCurrentTenant();
  const sp = await searchParams;
  const msg = sp.m ? MSG[sp.m] : null;

  const senderRole = session.role === "superadmin" ? "direccion" : await getStaffRole(session.userId);
  const teachers = tenant ? await listTeacherContacts(tenant.id) : [];
  const withEmail = teachers.filter((t) => t.email);
  const noEmail = teachers.filter((t) => !t.email);
  // Vista previa de las copias automáticas (sin marcar Dirección).
  const ccPreview = tenant ? await autoCcEmails(tenant.id, senderRole, { senderEmail: session.email }) : { emails: [], labels: [] };
  const canCcDireccion = senderRole === "secretaria" || senderRole === "subdireccion";
  const history = tenant ? await listStaffMessages(tenant.id) : [];
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Escribir al profesorado</h1>
            <p className="text-sm text-slate-500">
              Envías como <strong>{STAFF_ROLE_LABEL[senderRole ?? ""] ?? "Administración"}</strong>. Tu correo queda como
              dirección de respuesta; el profesorado contesta a ti.
            </p>
          </div>
          <a href="/panel/horas" className="text-sm font-medium text-cyan-700 hover:underline">← Control de horas</a>
        </div>

        {msg && (
          <p className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{msg.text}</p>
        )}

        <form action={sendAction} className="space-y-5 rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <fieldset>
            <legend className="text-sm font-semibold text-slate-800">Destinatarios</legend>
            <p className="mb-2 text-xs text-slate-400">Marca a quién enviar. Solo aparecen quienes tienen correo en su cuenta.</p>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" id="allcheck" />
              <span>Seleccionar todo el profesorado ({withEmail.length})</span>
            </label>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {withEmail.map((t) => (
                <label key={t.workerId} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                  <input type="checkbox" name="to" value={t.email!} className="to-check" />
                  <span className="text-slate-800">{t.name}</span>
                  <span className="text-xs text-slate-400">{t.email}</span>
                </label>
              ))}
              {!withEmail.length && <p className="px-2 py-1 text-sm text-slate-400">Ningún profesor tiene correo registrado todavía.</p>}
            </div>
            {noEmail.length > 0 && (
              <p className="mt-1 text-xs text-amber-600">{noEmail.length} sin correo no recibirán el mensaje: {noEmail.map((t) => t.name).join(", ")}.</p>
            )}
          </fieldset>

          <div>
            <label className="text-sm font-semibold text-slate-800">Asunto</label>
            <input name="subject" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Mensaje</label>
            <textarea name="body" rows={8} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
          </div>

          <div className="rounded-lg bg-cyan-50/60 p-3 text-sm text-slate-700">
            <p className="font-medium">Copia automática (CC)</p>
            {ccPreview.labels.length ? (
              <p className="text-xs text-slate-500">Se enviará con copia a: <strong>{ccPreview.labels.join(", ")}</strong>.</p>
            ) : (
              <p className="text-xs text-slate-500">Sin copia automática para tu rol.</p>
            )}
            {canCcDireccion && (
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" name="ccDireccion" />
                <span>Incluir también copia a Dirección</span>
              </label>
            )}
          </div>

          <button className="rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">Enviar mensaje</button>
        </form>

        <section className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Historial de envíos ({history.length})</h2>
          <p className="mb-3 text-xs text-slate-400">Registro de las comunicaciones enviadas al profesorado desde el centro.</p>
          <div className="space-y-2">
            {history.map((m) => (
              <details key={m.id} className="rounded-lg border border-slate-200 p-3">
                <summary className="cursor-pointer text-sm">
                  <span className="font-medium text-slate-800">{m.subject}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {fmt(new Date(m.createdAt))} · {m.senderName}
                    {m.senderRole ? ` (${STAFF_ROLE_LABEL[m.senderRole] ?? m.senderRole})` : ""} · {m.toCount} destinatario{m.toCount === 1 ? "" : "s"}
                  </span>
                </summary>
                <div className="mt-2 space-y-2 text-xs text-slate-600">
                  <p><strong>Para:</strong> {m.toEmails || "—"}</p>
                  {m.ccEmails && <p><strong>CC:</strong> {m.ccEmails}</p>}
                  <p className="whitespace-pre-wrap rounded bg-slate-50 p-2 text-slate-700">{m.body}</p>
                </div>
              </details>
            ))}
            {!history.length && <p className="text-sm text-slate-400">Todavía no se ha enviado ningún mensaje.</p>}
          </div>
        </section>
      </main>

      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.getElementById('allcheck')?.addEventListener('change',function(e){document.querySelectorAll('.to-check').forEach(function(c){c.checked=e.target.checked;});});",
        }}
      />
    </div>
  );
}
