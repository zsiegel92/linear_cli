import express from "express";
import { openInBrowser } from "./utils";
import qs from "qs";
import { linearAuthResponseSchema, type LinearAuthResponse } from "./schema";

const CLIENT_ID = process.env.LINEAR_CLIENT_ID;
const CLIENT_SECRET = process.env.LINEAR_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3002/token";
const PORT = 3002;
const CALLBACK_ROUTE = "/token";
// TODO: store on disk somewhere, maybe ~/.config/linear-select-issue-cli/oauth-token.txt

const RANDOM_STATE = Math.random().toString(36).substring(2, 15);
export async function getAuthToken(): Promise<LinearAuthResponse> {
  return new Promise((resolve, reject) => {
    const app = express();
    app.get(CALLBACK_ROUTE, async (req, res) => {
      const code = req.query.code as string;
      const state = req.query.state as string;
      if (state !== RANDOM_STATE) {
        res.status(400).send("Invalid state");
        return reject("Invalid state");
      }
      if (!code) {
        res.status(400).send("Missing code");
        return reject("No code in callback");
      }
      try {
        const tokenRes = await fetch("https://api.linear.app/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: qs.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            state: RANDOM_STATE,
          }),
        });

        if (!tokenRes.ok) {
          throw new Error(`Token exchange failed: ${tokenRes.status}`);
        }
        const data = await tokenRes.json();
        const parsedData = linearAuthResponseSchema.parse(data);
        res.send("Login successful. You can close this window.");
        server.close();
        resolve(parsedData);
      } catch (err: any) {
        res.status(500).send("Token exchange failed.");
        reject(err.response?.data || err.message);
      }
    });
    const server = app.listen(PORT, () => {
      const params = {
        response_type: "code",
        client_id: CLIENT_ID,
        scope: "read",
        state: RANDOM_STATE,
        redirect_uri: REDIRECT_URI,
      };
      const authUrl = `https://linear.app/oauth/authorize?${qs.stringify(params)}`;
      openInBrowser(authUrl);
    });
  });
}
