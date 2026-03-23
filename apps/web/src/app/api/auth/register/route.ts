import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName } from "@/lib/auth";
import { createUserAccount } from "@/server/user-store";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    email?: string;
    password?: string;
    fullName?: string;
    city?: string;
    phone?: string;
  };

  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password?.trim() || "";
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ ok: false, error: "Email and strong password are required." }, { status: 400 });
  }

  try {
    const user = await createUserAccount({
      email,
      password,
      fullName: body.fullName?.trim(),
      city: body.city?.trim(),
      phone: body.phone?.trim()
    });

    const token = createSessionToken({ id: user.id, email: user.email, role: user.role });
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to create account." }, { status: 400 });
  }
}
