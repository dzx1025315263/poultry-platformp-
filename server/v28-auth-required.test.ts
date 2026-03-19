import { describe, it, expect } from "vitest";

/**
 * V2.8 测试：验证所有API接口均需要登录认证
 * 
 * 确保routers.ts中除auth.me和auth.logout外，
 * 所有procedure都使用protectedProcedure或adminProcedure
 */

import * as fs from "fs";
import * as path from "path";

const routersContent = fs.readFileSync(
  path.resolve(__dirname, "routers.ts"),
  "utf-8"
);

describe("V2.8 - 全平台登录限制", () => {
  it("routers.ts中不应有非auth的publicProcedure", () => {
    // 提取所有publicProcedure的使用
    const lines = routersContent.split("\n");
    const publicLines: { line: number; content: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("publicProcedure")) {
        publicLines.push({ line: i + 1, content: lines[i].trim() });
      }
    }

    // 过滤掉import语句和auth路由中的publicProcedure（auth.me和auth.logout需要保持public）
    const nonAuthPublic = publicLines.filter((p) => {
      // import语句
      if (p.content.includes("import")) return false;
      // auth.me
      if (p.content.includes("me:") && p.content.includes("publicProcedure")) return false;
      // auth.logout
      if (p.content.includes("logout:") && p.content.includes("publicProcedure")) return false;
      return true;
    });

    expect(nonAuthPublic).toEqual([]);
  });

  it("auth.me应保持publicProcedure（用于检测登录状态）", () => {
    expect(routersContent).toContain("me: publicProcedure.query");
  });

  it("auth.logout应保持publicProcedure", () => {
    expect(routersContent).toContain("logout: publicProcedure.mutation");
  });

  it("company路由应全部使用protectedProcedure", () => {
    // 提取company路由块中的所有procedure
    const companyMatch = routersContent.match(/company:\s*router\(\{([\s\S]*?)\}\),\s*\n\s*\n/);
    expect(companyMatch).not.toBeNull();
    if (companyMatch) {
      const companyBlock = companyMatch[1];
      expect(companyBlock).not.toContain("publicProcedure");
      expect(companyBlock).toContain("protectedProcedure");
    }
  });

  it("contact路由应全部使用protectedProcedure", () => {
    const contactMatch = routersContent.match(/contact:\s*router\(\{([\s\S]*?)\}\),\s*\n\s*\n/);
    expect(contactMatch).not.toBeNull();
    if (contactMatch) {
      const contactBlock = contactMatch[1];
      expect(contactBlock).not.toContain("publicProcedure");
    }
  });

  it("credit路由应全部使用protectedProcedure", () => {
    const creditMatch = routersContent.match(/credit:\s*router\(\{([\s\S]*?)\}\),\s*\n\s*\n/);
    expect(creditMatch).not.toBeNull();
    if (creditMatch) {
      const creditBlock = creditMatch[1];
      expect(creditBlock).not.toContain("publicProcedure");
    }
  });

  it("trade路由应全部使用protectedProcedure", () => {
    const tradeMatch = routersContent.match(/trade:\s*router\(\{([\s\S]*?)\}\),\s*\n\s*\n/);
    expect(tradeMatch).not.toBeNull();
    if (tradeMatch) {
      const tradeBlock = tradeMatch[1];
      expect(tradeBlock).not.toContain("publicProcedure");
    }
  });

  it("DashboardLayout应包含未登录拦截逻辑", () => {
    const layoutContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/components/DashboardLayout.tsx"),
      "utf-8"
    );
    // 验证有useAuth调用
    expect(layoutContent).toContain("useAuth()");
    // 验证有loading状态处理
    expect(layoutContent).toContain("if (loading)");
    // 验证有未登录判断
    expect(layoutContent).toContain("if (!user)");
    // 验证引用了LoginPage组件
    expect(layoutContent).toContain("LoginPage");
  });

  it("LoginPage组件应包含登录引导和品牌展示", () => {
    const loginPageContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/components/LoginPage.tsx"),
      "utf-8"
    );
    // 验证有登录URL
    expect(loginPageContent).toContain("getLoginUrl()");
    // 验证有公司Logo
    expect(loginPageContent).toContain("Universal Gourmand Group");
    // 验证有功能展示图片
    expect(loginPageContent).toContain("SHOWCASE_IMAGES");
    // 验证有功能介绍
    expect(loginPageContent).toContain("FEATURES");
  });

  it("所有页面路由都在DashboardLayout内", () => {
    const appContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/App.tsx"),
      "utf-8"
    );
    // App.tsx中Router组件应包裹在DashboardLayout中
    expect(appContent).toContain("<DashboardLayout>");
    expect(appContent).toContain("</DashboardLayout>");
  });
});
