import path from "path";
import os from "os";
import fs from "fs";
import {
  getAuthTokenWithClientIdOnly,
  refreshAccessToken,
} from "./oauth-linear";
import {
  type LinearAuthResponse,
  linearAuthResponseWithExpiryDateSchema,
  type LinearAuthResponseWithExpiryDate,
} from "./schema";
const TOKEN_FILEPATH = path.join(
  os.homedir(),
  ".config",
  "linear-select-issue-cli",
  "oauth-token.json"
);

function storeToken(token: LinearAuthResponseWithExpiryDate): void {
  fs.writeFileSync(TOKEN_FILEPATH, JSON.stringify(token));
}

function getStoredToken(): {
  token: LinearAuthResponseWithExpiryDate;
  expired: boolean;
} | null {
  if (!fs.existsSync(TOKEN_FILEPATH)) {
    return null;
  }
  try {
    const parsed = linearAuthResponseWithExpiryDateSchema.parse(
      JSON.parse(fs.readFileSync(TOKEN_FILEPATH, "utf8"))
    );
    return { token: parsed, expired: parsed.expiryDate < new Date() };
  } catch (e) {
    return null;
  }
}

function getExpiryDate(expires_in_secoonds: number) {
  return new Date(Date.now() + expires_in_secoonds * 1000);
}

function tokenWithExpiry(
  token: LinearAuthResponse
): LinearAuthResponseWithExpiryDate {
  return { ...token, expiryDate: getExpiryDate(token.expires_in) };
}

export async function getOrSetToken(): Promise<LinearAuthResponse> {
  if (!fs.existsSync(TOKEN_FILEPATH)) {
    fs.mkdirSync(path.dirname(TOKEN_FILEPATH), { recursive: true });
  }
  const stored = getStoredToken();
  if (stored && !stored.expired) {
    return stored.token;
  }
  if (stored?.token.refresh_token) {
    try {
      const refreshed = await refreshAccessToken(stored.token.refresh_token);
      storeToken(tokenWithExpiry(refreshed));
      return refreshed;
    } catch {
      // refresh failed — fall through to full re-auth
    }
  }
  const newToken = await getAuthTokenWithClientIdOnly();
  storeToken(tokenWithExpiry(newToken));
  return newToken;
}
