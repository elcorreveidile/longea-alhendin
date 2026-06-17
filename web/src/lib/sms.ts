import "server-only";
import {
  twilioAccountSid,
  twilioAuthToken,
  twilioVerifyServiceSid,
  twilioConfigured,
  verifyChannel,
} from "./env";

const DEV_CODE = "000000"; // solo cuando Twilio NO está configurado (desarrollo)

function authHeader(): string {
  const creds = `${twilioAccountSid()}:${twilioAuthToken()}`;
  return "Basic " + Buffer.from(creds).toString("base64");
}

/** Pide a Twilio Verify que envíe un código al número (E.164) por el canal configurado. */
export async function startSmsVerification(phoneE164: string): Promise<void> {
  const channel = verifyChannel();
  if (!twilioConfigured()) {
    console.log(`[verify] (sin Twilio) Código de desarrollo para ${phoneE164} [${channel}]: ${DEV_CODE}`);
    return;
  }
  const sid = twilioVerifyServiceSid();
  const res = await fetch(`https://verify.twilio.com/v2/Services/${sid}/Verifications`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phoneE164, Channel: channel }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Twilio Verify (start): ${res.status} ${txt}`);
  }
}

/** Comprueba el código introducido. Devuelve true si es correcto. */
export async function checkSmsVerification(phoneE164: string, code: string): Promise<boolean> {
  if (!twilioConfigured()) {
    return code === DEV_CODE;
  }
  const sid = twilioVerifyServiceSid();
  const res = await fetch(`https://verify.twilio.com/v2/Services/${sid}/VerificationCheck`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phoneE164, Code: code }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { status?: string };
  return data.status === "approved";
}
