import { NextRequest, NextResponse } from "next/server";
import { refreshTokenGrant, allowInsecureRequests } from "openid-client";
import { getOidcConfig } from "@/lib/auth-config";

/**
 * Exchange the refresh token for a fresh access token.
 *
 * The oki realm issues 5-minute access tokens, so without this the app breaks a
 * few minutes after sign-in. The realm also sets revokeRefreshToken with
 * refreshTokenMaxReuse=0, meaning refresh tokens rotate and are single-use —
 * the replacement must be written back on every call or the next refresh fails.
 */
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "no_refresh_token" }, { status: 401 });
  }

  try {
    const config = await getOidcConfig();
    allowInsecureRequests(config);
    const tokenSet = await refreshTokenGrant(config, refreshToken);

    const accessMaxAge = tokenSet.expires_in ?? 300;
    const response = NextResponse.json({ ok: true, expires_in: accessMaxAge });

    response.cookies.set("access_token", tokenSet.access_token || "", {
      httpOnly: false,
      secure: false,
      maxAge: accessMaxAge,
      path: "/",
      sameSite: "lax",
    });
    if (tokenSet.id_token) {
      response.cookies.set("id_token", tokenSet.id_token, {
        httpOnly: true,
        secure: false,
        maxAge: accessMaxAge,
        path: "/",
      });
    }
    if (tokenSet.refresh_token) {
      response.cookies.set("refresh_token", tokenSet.refresh_token, {
        httpOnly: true,
        secure: false,
        maxAge: 1800,
        path: "/",
        sameSite: "lax",
      });
    }
    return response;
  } catch (err) {
    console.error("Token refresh failed:", err);
    // The session is genuinely over (idle timeout, revoked, reused token).
    // Clear the cookies so the client stops retrying and signs in again.
    const response = NextResponse.json({ error: "refresh_failed" }, { status: 401 });
    for (const name of ["access_token", "id_token", "refresh_token"]) {
      response.cookies.set(name, "", { maxAge: 0, path: "/" });
    }
    return response;
  }
}
