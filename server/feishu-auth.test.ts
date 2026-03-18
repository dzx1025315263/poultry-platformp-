import { describe, expect, it } from "vitest";

describe("Feishu OAuth credentials", () => {
  it("should have FEISHU_APP_ID configured", () => {
    const appId = process.env.FEISHU_APP_ID;
    expect(appId).toBeDefined();
    expect(appId).not.toBe("");
    expect(appId).toMatch(/^cli_/);
  });

  it("should have FEISHU_APP_SECRET configured", () => {
    const appSecret = process.env.FEISHU_APP_SECRET;
    expect(appSecret).toBeDefined();
    expect(appSecret).not.toBe("");
    expect(appSecret!.length).toBeGreaterThan(10);
  });

  it("should be able to get tenant_access_token from Feishu API", async () => {
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;

    const response = await fetch(
      "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId,
          app_secret: appSecret,
        }),
      }
    );

    const data = await response.json();
    expect(data.code).toBe(0);
    expect(data.tenant_access_token).toBeDefined();
    expect(data.tenant_access_token.length).toBeGreaterThan(0);
  });
});
