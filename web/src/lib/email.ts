import "server-only";
import { Resend } from "resend";
import { emailFrom, resendApiKey, contactEmail } from "./env";

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c));

/** Identidad visual del correo: PlanTurnos por defecto, o la de una empresa. */
export interface EmailBrand {
  name: string;
  logoUrl?: string | null;
  homeUrl?: string;
  tagline?: string;
  /** true: marca PlanTurnos (logotipo de texto plan·turnos). false: empresa. */
  planturnos?: boolean;
}

const PLANTURNOS_BRAND: EmailBrand = {
  name: "PlanTurnos",
  homeUrl: "https://planturnos.com",
  tagline: "los cuadrantes de tu equipo, listos en segundos.",
  planturnos: true,
};

/**
 * Envuelve un contenido en la plantilla de marca (compatible con clientes de
 * correo: tablas + estilos en línea). Por defecto usa la marca PlanTurnos; si se
 * pasa la marca de una empresa, el correo sale personalizado con su nombre/logo.
 * El logotipo de texto sirve de respaldo cuando el cliente bloquea las imágenes.
 */
function brandedEmail(opts: {
  bodyHtml: string;
  preheader?: string;
  brand?: EmailBrand;
  footnote?: string;
}): string {
  const { bodyHtml, preheader, footnote } = opts;
  const brand = opts.brand ?? PLANTURNOS_BRAND;

  const header = brand.planturnos
    ? `<td style="padding-right:10px;vertical-align:middle">
         <img src="https://planturnos.com/logo-symbol.png" width="32" height="32" alt="" style="display:block;border:0">
       </td>
       <td style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:-.3px">
         <span style="color:#0E7490">plan</span><span style="color:#E59A3C">turnos</span>
       </td>`
    : `${
        brand.logoUrl
          ? `<td style="padding-right:12px;vertical-align:middle"><img src="${brand.logoUrl}" height="34" alt="" style="display:block;border:0;height:34px;width:auto;max-width:170px"></td>`
          : ""
      }
       <td style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:bold;color:#1f2937">${esc(brand.name)}</td>`;

  const footerMain = brand.planturnos
    ? `<strong style="color:#0E7490">PlanTurnos</strong> — ${esc(brand.tagline ?? "")}`
    : `<strong style="color:#0E7490">${esc(brand.name)}</strong>${brand.tagline ? ` — ${esc(brand.tagline)}` : " · Cuadrantes"}`;
  const footerLink = brand.homeUrl
    ? `<br><a href="${brand.homeUrl}" style="color:#0E7490;text-decoration:none">${esc(brand.homeUrl.replace(/^https?:\/\//, ""))}</a>`
    : "";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#faf6ee;-webkit-text-size-adjust:100%">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6ee;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e7dcc4;border-radius:16px;overflow:hidden">
      <tr><td style="padding:22px 28px;border-bottom:1px solid #f1ead7">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>${header}</tr></table>
      </td></tr>
      <tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:20px 28px;border-top:1px solid #f1ead7;background:#faf6ee;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b7280">
        ${footerMain}${footerLink}
      </td></tr>
    </table>
    ${footnote ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9ca3af;margin:16px 0 0">${esc(footnote)}</p>` : ""}
  </td></tr>
</table>
</body></html>`;
}

/** Botón de acción con la marca (teal), compatible con clientes de correo. */
function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px"><tr><td style="border-radius:10px;background:#0E7490"><a href="${href}" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none">${label}</a></td></tr></table>`;
}

/** Envía un mensaje del formulario de contacto al buzón configurado. */
export async function sendContactEmail(data: {
  name: string;
  email: string;
  org?: string;
  message: string;
}): Promise<void> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    console.log("[email] (sin RESEND_API_KEY) contacto:", data);
    return;
  }
  const resend = new Resend(apiKey);
  const to = contactEmail();
  const { data: sent, error } = await resend.emails.send({
    from: emailFrom(),
    to,
    replyTo: data.email,
    subject: `PlanTurnos · Contacto de ${data.name}`,
    html: brandedEmail({
      preheader: `${data.name}: ${data.message.slice(0, 90)}`,
      bodyHtml: `
        <h1 style="margin:0 0 16px;font-size:18px;color:#0E7490">Nuevo mensaje desde la web</h1>
        <p style="margin:0 0 6px"><strong>Nombre:</strong> ${esc(data.name)}</p>
        <p style="margin:0 0 6px"><strong>Correo:</strong> <a href="mailto:${esc(data.email)}" style="color:#0E7490">${esc(data.email)}</a></p>
        ${data.org ? `<p style="margin:0 0 6px"><strong>Centro/Empresa:</strong> ${esc(data.org)}</p>` : ""}
        <p style="margin:16px 0 6px"><strong>Mensaje:</strong></p>
        <div style="white-space:pre-wrap;background:#faf6ee;border:1px solid #e7dcc4;padding:14px;border-radius:10px">${esc(data.message)}</div>
      `,
    }),
  });
  if (error) {
    console.error(`[email] contacto FALLÓ (from=${emailFrom()} to=${to}):`, error);
    throw new Error(`Resend: ${error.message}`);
  }
  console.log(`[email] contacto enviado a ${to} (from=${emailFrom()}) id=${sent?.id ?? "?"}`);
}

/** Responde por email a un interesado del formulario (desde el área superadmin). */
export async function sendLeadReply(data: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    console.log("[email] (sin RESEND_API_KEY) respuesta a lead:", data);
    return;
  }
  const resend = new Resend(apiKey);
  const bodyHtml = `
    <div style="white-space:pre-wrap">${esc(data.body)}</div>
    ${ctaButton("https://planturnos.com/demo", "Probar la demo →")}
  `;
  const html = brandedEmail({
    bodyHtml,
    preheader: data.subject,
    footnote: "Recibes este correo porque escribiste a PlanTurnos.",
  });
  const { data: sent, error } = await resend.emails.send({
    from: emailFrom(),
    to: data.to,
    replyTo: contactEmail(),
    subject: data.subject,
    html,
  });
  if (error) {
    console.error(`[email] respuesta a lead FALLÓ (to=${data.to}):`, error);
    throw new Error(`Resend: ${error.message}`);
  }
  console.log(`[email] respuesta a lead enviada a ${data.to} id=${sent?.id ?? "?"}`);
}

/** Mensaje del personal del centro (dirección/subdirección/secretaría) al profesorado. */
export async function sendStaffMessage(data: {
  brand?: EmailBrand;
  senderName: string;
  senderEmail: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    console.log("[email] (sin RESEND_API_KEY) mensaje al profesorado:", {
      to: data.to, cc: data.cc, subject: data.subject,
    });
    return { ok: true };
  }
  const resend = new Resend(apiKey);
  // Conserva la dirección verificada del remitente técnico, pero muestra el nombre del centro.
  const addr = emailFrom().match(/<([^>]+)>/)?.[1] ?? emailFrom();
  const display = data.brand?.name ?? "PlanTurnos";
  const bodyHtml = `
    <div style="white-space:pre-wrap;font-size:15px;color:#1f2937">${esc(data.body)}</div>
    <p style="margin:22px 0 0;font-size:13px;color:#64748b">— ${esc(data.senderName)}</p>
  `;
  const html = brandedEmail({
    bodyHtml,
    preheader: data.subject,
    brand: data.brand,
    footnote: `Mensaje de ${esc(data.senderName)} · ${esc(display)}. Responde a este correo para contestar.`,
  });
  const { data: sent, error } = await resend.emails.send({
    from: `${display} <${addr}>`,
    to: data.to,
    cc: data.cc && data.cc.length ? data.cc : undefined,
    replyTo: data.senderEmail,
    subject: data.subject,
    html,
  });
  if (error) {
    console.error("[email] mensaje al profesorado FALLÓ:", error);
    return { ok: false, error: error.message };
  }
  console.log(`[email] mensaje al profesorado enviado (to=${data.to.length}, cc=${data.cc?.length ?? 0}) id=${sent?.id ?? "?"}`);
  return { ok: true };
}

export async function sendCuadranteEmail(
  email: string,
  name: string,
  label: string,
  url: string,
  brand?: EmailBrand,
): Promise<void> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    console.log(`[email] (sin RESEND_API_KEY) Aviso cuadrante (${label}) para ${email}: ${url}`);
    return;
  }
  const resend = new Resend(apiKey);
  const empresa = brand?.name ?? "tu equipo";
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: email,
    subject: `Nuevo cuadrante publicado · ${label}`,
    html: brandedEmail({
      brand, // personalizado con la empresa (si se pasa); si no, PlanTurnos
      preheader: `Ya puedes consultar el cuadrante de ${label}`,
      bodyHtml: `
        <h1 style="margin:0 0 14px;font-size:18px;color:#0E7490">Nuevo cuadrante: ${esc(label)}</h1>
        <p style="margin:0">${name ? `Hola ${esc(name)}, ` : ""}ya está disponible el cuadrante de <strong>${esc(label)}</strong> de ${esc(empresa)}. Consúltalo cuando quieras.</p>
        ${ctaButton(url, "Ver mi turno →")}
      `,
    }),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export async function sendMagicLink(email: string, url: string): Promise<void> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    // En desarrollo sin Resend configurado: log para poder copiar el enlace.
    console.log(`[email] (sin RESEND_API_KEY) Magic link para ${email}: ${url}`);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: email,
    subject: "Tu acceso a PlanTurnos",
    html: brandedEmail({
      preheader: "Tu enlace de acceso (caduca en 15 minutos)",
      bodyHtml: `
        <h1 style="margin:0 0 14px;font-size:18px;color:#0E7490">Tu acceso a PlanTurnos</h1>
        <p style="margin:0">Has solicitado acceder a tu cuenta. Pulsa el botón para entrar:</p>
        ${ctaButton(url, "Entrar →")}
        <p style="margin:18px 0 0;font-size:13px;color:#6b7280">Este enlace caduca en 15 minutos y solo puede usarse una vez. Si no has sido tú, ignora este correo.</p>
      `,
    }),
  });

  if (error) {
    throw new Error(`Resend: ${error.message}`);
  }
}
