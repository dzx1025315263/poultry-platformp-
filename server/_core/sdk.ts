import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

// ============================================================
// Feishu (Lark) Official OAuth API Types
// ============================================================

export interface FeishuTokenResponse {
  code: number;
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

export interface FeishuUserInfo {
  code: number;
  msg: string;
  data: {
    name: string;
    en_name?: string;
    avatar_url?: string;
    avatar_thumb?: string;
    avatar_middle?: string;
    avatar_big?: string;
    open_id: string;
    union_id?: string;
    email?: string;
    enterprise_email?: string;
    user_id?: string;
    mobile?: string;
    tenant_key?: string;
    employee_no?: string;
  };
}

// ============================================================
// Feishu OAuth Service - Direct API calls to Feishu Open Platform
// ============================================================

class FeishuOAuthService {
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 30_000,
    });
    console.log("[Feishu OAuth] Initialized with App ID:", ENV.feishuAppId);
    if (!ENV.feishuAppId || !ENV.feishuAppSecret) {
      console.error(
        "[Feishu OAuth] ERROR: FEISHU_APP_ID or FEISHU_APP_SECRET is not configured!"
      );
    }
  }

  /**
   * Exchange authorization code for user_access_token
   * API: POST https://open.feishu.cn/open-apis/authen/v2/oauth/token
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<FeishuTokenResponse> {
    const payload = {
      grant_type: "authorization_code",
      client_id: ENV.feishuAppId,
      client_secret: ENV.feishuAppSecret,
      code,
      redirect_uri: redirectUri,
    };

    console.log("[Feishu OAuth] Exchanging code for token...");

    const { data } = await this.httpClient.post<FeishuTokenResponse>(
      "https://open.feishu.cn/open-apis/authen/v2/oauth/token",
      payload,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (data.code !== 0 && data.code !== undefined && data.error) {
      console.error("[Feishu OAuth] Token exchange failed:", data);
      throw new Error(
        `Feishu token exchange failed: ${data.error} - ${data.error_description}`
      );
    }

    console.log("[Feishu OAuth] Token exchange successful");
    return data;
  }

  /**
   * Get user info using user_access_token
   * API: GET https://open.feishu.cn/open-apis/authen/v1/user_info
   */
  async getUserInfo(userAccessToken: string): Promise<FeishuUserInfo> {
    console.log("[Feishu OAuth] Fetching user info...");

    const { data } = await this.httpClient.get<FeishuUserInfo>(
      "https://open.feishu.cn/open-apis/authen/v1/user_info",
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );

    if (data.code !== 0) {
      console.error("[Feishu OAuth] Get user info failed:", data);
      throw new Error(
        `Feishu get user info failed: code=${data.code}, msg=${data.msg}`
      );
    }

    console.log(
      "[Feishu OAuth] User info fetched:",
      data.data.name,
      data.data.open_id
    );
    return data;
  }
}

// ============================================================
// SDK Server - Session management (JWT-based, independent)
// ============================================================

class SDKServer {
  private readonly feishuOAuth: FeishuOAuthService;

  constructor() {
    this.feishuOAuth = new FeishuOAuthService();
  }

  /**
   * Get the Feishu OAuth authorization URL
   */
  getFeishuAuthUrl(redirectUri: string, state?: string): string {
    const url = new URL(
      "https://accounts.feishu.cn/open-apis/authen/v1/authorize"
    );
    url.searchParams.set("client_id", ENV.feishuAppId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri);
    if (state) {
      url.searchParams.set("state", state);
    }
    return url.toString();
  }

  /**
   * Exchange Feishu authorization code for user_access_token
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<FeishuTokenResponse> {
    return this.feishuOAuth.exchangeCodeForToken(code, redirectUri);
  }

  /**
   * Get user info from Feishu using user_access_token
   */
  async getUserInfo(userAccessToken: string): Promise<FeishuUserInfo> {
    return this.feishuOAuth.getUserInfo(userAccessToken);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token (JWT) for a user
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.feishuAppId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        openId,
        appId,
        name,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    // Regular authentication flow using JWT session cookie
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(sessionUserId);

    if (!user) {
      // User has a valid JWT but not in DB - create a minimal record
      console.warn(
        "[Auth] User has valid session but not in DB, creating record for:",
        sessionUserId
      );
      await db.upsertUser({
        openId: sessionUserId,
        name: session.name || null,
        loginMethod: "feishu",
        lastSignedIn: signedInAt,
      });
      user = await db.getUserByOpenId(sessionUserId);
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const sdk = new SDKServer();
