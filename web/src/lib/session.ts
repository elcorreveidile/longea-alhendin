import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { authSecret } from "./env";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export interface SessionData {
  userId: string;
  email: string;
  name: string | null;
  role: "admin" | "worker";
  workerId: string | null;
}

function key(): Uint8Array {
  return new TextEncoder().encode(authSecret());
}

export async function createSession(data: SessionData): Promise<void> {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: (payload.name as string | null) ?? null,
      role: payload.role === "admin" ? "admin" : "worker",
      workerId: (payload.workerId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
