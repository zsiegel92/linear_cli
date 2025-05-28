import path from "path";
import os from "os";
import fs from "fs";
import { getAuthTokenWithClientIdOnly } from "./oauth-linear";
import {
  type LinearAuthResponse,
  linearAuthResponseSchema,
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

function getStoredToken(): LinearAuthResponse | null {
  if (!fs.existsSync(TOKEN_FILEPATH)) {
    return null;
  }
  try {
    const parsed = linearAuthResponseWithExpiryDateSchema.parse(
      JSON.parse(fs.readFileSync(TOKEN_FILEPATH, "utf8"))
    );
    if (parsed.expiryDate < new Date()) {
      return null;
    }
    return linearAuthResponseSchema.parse(parsed);
  } catch (e) {
    return null;
  }
}

function getExpiryDate(expires_in_secoonds: number) {
  return new Date(Date.now() + expires_in_secoonds * 1000);
}

export async function getOrSetToken(): Promise<LinearAuthResponse> {
  if (!fs.existsSync(TOKEN_FILEPATH)) {
    fs.mkdirSync(path.dirname(TOKEN_FILEPATH), { recursive: true });
  }
  const token = getStoredToken();
  if (token) {
    return token;
  } else {
    const newToken = await getAuthTokenWithClientIdOnly();
    storeToken({
      ...newToken,
      expiryDate: getExpiryDate(newToken.expires_in),
    });
    return newToken;
  }
}
