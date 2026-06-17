import "server-only";
import { labsmobileUsername, labsmobileToken, smsSender, smsConfigured } from "./env";

/**
 * Envía un SMS con LabsMobile (proveedor español).
 * API JSON: https://api.labsmobile.com/json/send  (auth básica usuario:token).
 * Si no hay credenciales, en desarrollo se registra el mensaje por consola.
 */
export async function sendSms(phoneE164: string, text: string): Promise<void> {
  if (!smsConfigured()) {
    console.log(`[sms] (sin LabsMobile) SMS a ${phoneE164}: ${text}`);
    return;
  }

  const auth = Buffer.from(`${labsmobileUsername()}:${labsmobileToken()}`).toString("base64");
  // LabsMobile espera el número sin el "+" inicial.
  const msisdn = phoneE164.replace(/^\+/, "");

  const body: Record<string, unknown> = {
    message: text,
    tac: 1,
    recipient: [{ msisdn }],
  };
  const sender = smsSender();
  if (sender) body.sender = sender;

  const res = await fetch("https://api.labsmobile.com/json/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  // Un fallo del proveedor se registra pero NO rompe el login (sin error 500).
  if (!res.ok) {
    const txt = await res.text();
    console.error(`[sms] LabsMobile ${res.status}: ${txt}`);
    return;
  }
  const data = (await res.json()) as { code?: string | number; message?: string };
  // LabsMobile devuelve code "0" cuando el envío es correcto.
  if (data.code !== undefined && String(data.code) !== "0") {
    console.error(`[sms] LabsMobile error ${data.code}: ${data.message ?? ""}`);
  }
}
