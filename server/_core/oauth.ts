import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // ============================================================
  // Feishu OAuth Callback
  // Called after user authorizes on Feishu's authorization page
  // ============================================================
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");

    // Handle user denial
    if (error === "access_denied") {
      console.warn("[Feishu OAuth] User denied authorization");
      res.redirect(302, "/");
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      // Build the redirect_uri that was used when initiating the OAuth flow
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const redirectUri = `${protocol}://${host}/api/oauth/callback`;

      console.log("[Feishu OAuth] Processing callback with redirect_uri:", redirectUri);

      // Step 1: Exchange authorization code for user_access_token
      const tokenResponse = await sdk.exchangeCodeForToken(code, redirectUri);

      if (!tokenResponse.access_token) {
        console.error("[Feishu OAuth] No access_token in response:", tokenResponse);
        res.status(400).json({ error: "Failed to get access token from Feishu" });
        return;
      }

      // Step 2: Get user info from Feishu
      const userInfo = await sdk.getUserInfo(tokenResponse.access_token);

      if (!userInfo.data?.open_id) {
        console.error("[Feishu OAuth] No open_id in user info:", userInfo);
        res.status(400).json({ error: "Failed to get user info from Feishu" });
        return;
      }

      const feishuUser = userInfo.data;

      // Step 3: Upsert user in database
      // Check if this user's open_id matches the configured admin
      const isOwner = feishuUser.open_id === ENV.ownerOpenId;

      await db.upsertUser({
        openId: feishuUser.open_id,
        name: feishuUser.name || null,
        email: feishuUser.email || feishuUser.enterprise_email || null,
        loginMethod: "feishu",
        feishuUserId: feishuUser.user_id || null,
        feishuUnionId: feishuUser.union_id || null,
        avatar: feishuUser.avatar_url || null,
        lastSignedIn: new Date(),
        ...(isOwner ? { role: "admin" as const } : {}),
      });

      console.log(
        "[Feishu OAuth] User upserted:",
        feishuUser.name,
        feishuUser.open_id,
        isOwner ? "(admin)" : "(user)"
      );

      // Step 4: Create JWT session token
      const sessionToken = await sdk.createSessionToken(feishuUser.open_id, {
        name: feishuUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Step 5: Set session cookie and redirect
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Redirect to the state URL if provided, otherwise to home
      const redirectTo = state || "/";
      res.redirect(302, redirectTo);
    } catch (error) {
      console.error("[Feishu OAuth] Callback failed:", error);
      res.status(500).json({ error: "Feishu OAuth callback failed" });
    }
  });

  // ============================================================
  // API endpoint to get the Feishu login URL (for frontend)
  // ============================================================
  app.get("/api/auth/feishu-login-url", (req: Request, res: Response) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const redirectUri = `${protocol}://${host}/api/oauth/callback`;
    const state = getQueryParam(req, "redirect") || "/";

    const loginUrl = sdk.getFeishuAuthUrl(redirectUri, state);
    res.json({ url: loginUrl });
  });
}
