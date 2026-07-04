import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: true, user: null });
  }
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
}
