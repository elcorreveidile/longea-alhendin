import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
import { appUrl } from "@/lib/env";

export async function GET() {
  await destroySession();
  return NextResponse.redirect(`${appUrl()}/login`);
}
