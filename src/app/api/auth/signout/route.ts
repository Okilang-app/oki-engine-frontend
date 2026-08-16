import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect("http://localhost:3000/");

  // Clear access_token (both httpOnly and non-httpOnly variants)
  response.cookies.set("access_token", "", {
    httpOnly: false,
    secure: false,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });

  // Clear id_token
  response.cookies.set("id_token", "", {
    httpOnly: true,
    secure: false,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });

  // Clear OIDC cookies
  response.cookies.set("oidc_code_verifier", "", {
    httpOnly: true,
    secure: false,
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("oidc_state", "", {
    httpOnly: true,
    secure: false,
    maxAge: 0,
    path: "/",
  });

  return response;
}
