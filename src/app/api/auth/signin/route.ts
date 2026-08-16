import { NextRequest, NextResponse } from "next/server";
import { randomPKCECodeVerifier, calculatePKCECodeChallenge, randomState } from "openid-client";
import { getOidcConfig } from "@/lib/auth-config";

export async function GET(_req: NextRequest) {
  const config = await getOidcConfig();
  const codeVerifier = randomPKCECodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
  const state = randomState();

  const params = new URLSearchParams({
    client_id: config.clientMetadata().client_id,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: "http://localhost:3000/api/auth/callback",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  const authorizationEndpoint = config.serverMetadata().authorization_endpoint;
  const url = `${authorizationEndpoint}?${params.toString()}`;

  const response = NextResponse.redirect(url);
  response.cookies.set("oidc_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: false,
    maxAge: 600,
    path: "/",
  });
  response.cookies.set("oidc_state", state, {
    httpOnly: true,
    secure: false,
    maxAge: 600,
    path: "/",
  });

  return response;
}
