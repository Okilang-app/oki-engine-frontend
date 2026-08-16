import { Configuration, allowInsecureRequests } from "openid-client";

const ISSUER_URL = process.env.KEYCLOAK_ISSUER || "http://127.0.0.1:58080/realms/oki";
const CLIENT_ID = process.env.KEYCLOAK_ID || "oki-web";
const CLIENT_SECRET = process.env.KEYCLOAK_SECRET || "oki-web-secret";

let cachedConfig: Configuration | null = null;

export async function getOidcConfig(): Promise<Configuration> {
  if (cachedConfig) return cachedConfig;

  cachedConfig = new Configuration(
    {
      issuer: ISSUER_URL,
      authorization_endpoint: `${ISSUER_URL}/protocol/openid-connect/auth`,
      token_endpoint: `${ISSUER_URL}/protocol/openid-connect/token`,
      userinfo_endpoint: `${ISSUER_URL}/protocol/openid-connect/userinfo`,
      jwks_uri: `${ISSUER_URL}/protocol/openid-connect/certs`,
    },
    CLIENT_ID,
    { client_secret: CLIENT_SECRET },
  );

  allowInsecureRequests(cachedConfig);
  return cachedConfig;
}
