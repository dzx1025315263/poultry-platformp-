export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Generate Feishu OAuth login URL at runtime.
 * Redirects user to Feishu's official authorization page.
 * After authorization, Feishu redirects back to /api/oauth/callback with a code.
 */
export const getLoginUrl = () => {
  const feishuAppId = import.meta.env.VITE_FEISHU_APP_ID;

  // If Feishu App ID is not configured, fall back to server-side URL generation
  if (!feishuAppId) {
    // Use the server API to get the login URL
    return "/api/auth/feishu-login-url-redirect";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const url = new URL(
    "https://accounts.feishu.cn/open-apis/authen/v1/authorize"
  );
  url.searchParams.set("client_id", feishuAppId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", "/");

  return url.toString();
};
