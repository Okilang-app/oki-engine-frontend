import { NextRequest, NextResponse } from "next/server";
import { authorizationCodeGrant, allowInsecureRequests } from "openid-client";
import { getOidcConfig } from "@/lib/auth-config";

export async function GET(req: NextRequest) {
  const config = await getOidcConfig();
  const codeVerifier = req.cookies.get("oidc_code_verifier")?.value;
  const state = req.cookies.get("oidc_state")?.value;

  if (!codeVerifier || !state) {
    return NextResponse.redirect("http://localhost:3000/?error=missing_params");
  }

  try {
    allowInsecureRequests(config);
    const tokenSet = await authorizationCodeGrant(config, new URL(req.url), {
      pkceCodeVerifier: codeVerifier,
      expectedState: state,
    });

    const origin = new URL(req.url).origin;
    const response = NextResponse.redirect(origin + "/");

    // Keycloak's accessTokenLifespan is short (300s in the oki realm). Pin the
    // cookie to the token's real lifetime so it cannot outlive what it holds —
    // a 1h cookie around a 5m token makes the app look logged in while every
    // API call 401s.
    const accessMaxAge = tokenSet.expires_in ?? 300;

    // access_token is NOT httpOnly so client-side JS can read it for Authorization header
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
    // The refresh token is what keeps the session alive past those 5 minutes.
    // httpOnly — only /api/auth/refresh needs to read it.
    if (tokenSet.refresh_token) {
      response.cookies.set("refresh_token", tokenSet.refresh_token, {
        httpOnly: true,
        secure: false,
        maxAge: 1800, // realm ssoSessionIdleTimeout
        path: "/",
        sameSite: "lax",
      });
    }
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
  } catch (err) {
    console.error("OAuth callback error:", err);
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(origin + "/?error=oauth_callback");
  }
}
