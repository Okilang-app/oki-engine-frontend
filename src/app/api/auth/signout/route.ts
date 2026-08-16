import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const response = NextResponse.redirect(origin + "/");

  // Clear access_token (non-httpOnly variant)
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
