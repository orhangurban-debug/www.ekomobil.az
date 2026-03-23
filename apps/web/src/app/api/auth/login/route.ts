import { NextResponse } from "next/server";
import { authenticateUser, createSessionToken, getSessionCookieName } from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = body.email?.trim() || "";
  const password = body.password?.trim() || "";

  const user = await authenticateUser(email, password);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  const token = createSessionToken(user);
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return res;
}
