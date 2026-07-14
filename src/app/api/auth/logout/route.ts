import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 0,
  });
  return response;
}
