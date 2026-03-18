import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock feishuWebhook
vi.mock("./feishuWebhook", () => ({
  notifyFavoriteChange: vi.fn().mockResolvedValue(true),
  notifyStatusUpdate: vi.fn().mockResolvedValue(true),
  notifyContactImport: vi.fn().mockResolvedValue(true),
  setFeishuWebhookUrl: vi.fn(),
  getFeishuWebhookUrl: vi.fn().mockReturnValue("https://open.feishu.cn/open-apis/bot/v2/hook/test123"),
  sendFeishuNotification: vi.fn().mockResolvedValue(true),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          recommendations: [
            { companyId: 5, matchScore: 92, reason: "同为沙特市场禽肉进口商，主营产品高度匹配" },
            { companyId: 8, matchScore: 78, reason: "阿联酋市场冷冻禽肉需求旺盛" },
          ],
          profileSummary: "客户画像：主要集中在中东地区禽肉进口商，偏好冷冻鸡肉产品",
        }),
      },
    }],
  }),
}));

// Mock db module
vi.mock("./db", () => ({
  // Feishu - no db ops needed, just webhook functions

  // AI Recommend
  getLifecycleFunnel: vi.fn().mockResolvedValue({
    stages: [{ stage: "won", cnt: 2 }],
    items: [
      { customer_lifecycle: { companyId: 1, stage: "won" }, companies: { id: 1, companyName: "Saudi Foods", country: "Saudi Arabia", continent: "Asia", coreRole: "Importer", mainProducts: "Frozen Chicken" } },
      { customer_lifecycle: { companyId: 2, stage: "repurchase" }, companies: { id: 2, companyName: "Dubai Meats", country: "UAE", continent: "Asia", coreRole: "Distributor", mainProducts: "Poultry Products" } },
    ],
  }),
  getUserFavorites: vi.fn().mockResolvedValue([
    { favorites: { companyId: 1, followUpStatus: "closed_won" }, companies: { id: 1, companyName: "Saudi Foods", country: "Saudi Arabia", continent: "Asia" } },
    { favorites: { companyId: 3, followUpStatus: "contacted" }, companies: { id: 3, companyName: "Egypt Trade", country: "Egypt", continent: "Africa" } },
  ]),
  searchCompanies: vi.fn().mockResolvedValue({
    data: [
      { id: 5, companyName: "Riyadh Imports", country: "Saudi Arabia", continent: "Asia", coreRole: "Importer", mainProducts: "Frozen Poultry", hasPurchasedFromChina: "是" },
      { id: 8, companyName: "Abu Dhabi Foods", country: "UAE", continent: "Asia", coreRole: "Wholesaler", mainProducts: "Chicken Products", hasPurchasedFromChina: "否" },
    ],
    total: 2,
  }),
  getCompanyById: vi.fn().mockImplementation(async (id: number) => {
    const map: Record<number, any> = {
      5: { id: 5, companyName: "Riyadh Imports", country: "Saudi Arabia", continent: "Asia", coreRole: "Importer", mainProducts: "Frozen Poultry", hasPurchasedFromChina: "是", websiteSocial: "https://riyadh.com" },
      8: { id: 8, companyName: "Abu Dhabi Foods", country: "UAE", continent: "Asia", coreRole: "Wholesaler", mainProducts: "Chicken Products", hasPurchasedFromChina: "否" },
    };
    return map[id] || null;
  }),

  // Email Automation
  getUserAbTests: vi.fn().mockResolvedValue([
    { id: 1, name: "沙特市场测试", isActive: true, variantA_subject: "Inquiry A", variantA_body: "Dear {{company_name}}, A", variantB_subject: "Inquiry B", variantB_body: "Dear {{company_name}}, B", variantA_sent: 5, variantA_opened: 3, variantA_replied: 1, variantB_sent: 5, variantB_opened: 2, variantB_replied: 2, createdAt: Date.now() },
  ]),
  addEmailHistory: vi.fn().mockResolvedValue(undefined),
  updateAbTestStats: vi.fn().mockResolvedValue(undefined),
  getEmailHistory: vi.fn().mockResolvedValue({
    data: [
      { id: 1, sentAt: Date.now(), recipients: "test@test.com", subject: "Test", status: "sent", internalNote: "A/B测试" },
      { id: 2, sentAt: Date.now() - 86400000 * 2, recipients: "test2@test.com", subject: "Test2", status: "sent", internalNote: "" },
    ],
    total: 2,
  }),
  getUserFavoriteIds: vi.fn().mockResolvedValue([1, 3]),
}));

const createCaller = (user?: any) => {
  const ctx: TrpcContext = {
    user: user || { id: 1, openId: "test-open-id", name: "Test User", role: "admin" },
  };
  return appRouter.createCaller(ctx);
};

const createAnonymousCaller = () => {
  const ctx: TrpcContext = { user: null };
  return appRouter.createCaller(ctx);
};

describe("V2.2 - 飞书Webhook配置", () => {
  it("获取Webhook配置状态", async () => {
    const caller = createCaller();
    const result = await caller.feishu.getWebhookUrl();
    expect(result).toHaveProperty("configured");
    expect(result).toHaveProperty("url");
    expect(result.configured).toBe(true);
  });

  it("设置Webhook URL（管理员）", async () => {
    const caller = createCaller();
    const result = await caller.feishu.setWebhookUrl({ url: "https://open.feishu.cn/open-apis/bot/v2/hook/new123" });
    expect(result.success).toBe(true);
  });

  it("非管理员不能设置Webhook URL", async () => {
    const caller = createCaller({ id: 2, openId: "user2", name: "Normal", role: "user" });
    await expect(caller.feishu.setWebhookUrl({ url: "https://open.feishu.cn/open-apis/bot/v2/hook/hack" }))
      .rejects.toThrow();
  });

  it("发送测试通知", async () => {
    const caller = createCaller();
    const result = await caller.feishu.testNotification();
    expect(result).toHaveProperty("success");
  });

  it("未登录用户无法访问飞书配置", async () => {
    const caller = createAnonymousCaller();
    await expect(caller.feishu.getWebhookUrl()).rejects.toThrow();
  });
});

describe("V2.2 - AI智能客户推荐", () => {
  it("获取AI推荐结果", async () => {
    const caller = createCaller();
    const result = await caller.aiRecommend.getRecommendations({ limit: 10 });
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("profileSummary");
    expect(result).toHaveProperty("message");
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]).toHaveProperty("matchScore");
    expect(result.recommendations[0]).toHaveProperty("reason");
    expect(result.recommendations[0]).toHaveProperty("company");
  });

  it("推荐结果按匹配度排序", async () => {
    const caller = createCaller();
    const result = await caller.aiRecommend.getRecommendations({ limit: 10 });
    if (result.recommendations.length >= 2) {
      expect(result.recommendations[0].matchScore).toBeGreaterThanOrEqual(result.recommendations[1].matchScore);
    }
  });

  it("未登录用户无法使用AI推荐", async () => {
    const caller = createAnonymousCaller();
    await expect(caller.aiRecommend.getRecommendations({ limit: 5 })).rejects.toThrow();
  });
});

describe("V2.2 - 邮件自动化工作流", () => {
  it("使用A/B测试模板发送邮件", async () => {
    const caller = createCaller();
    const result = await caller.emailAutomation.sendWithAbTest({
      abTestId: 1,
      recipients: [
        { email: "buyer1@test.com", companyName: "Test Co 1" },
        { email: "buyer2@test.com", companyName: "Test Co 2" },
        { email: "buyer3@test.com", companyName: "Test Co 3" },
        { email: "buyer4@test.com", companyName: "Test Co 4" },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.sent).toBe(4);
    expect(result.variantA).toBe(2);
    expect(result.variantB).toBe(2);
  });

  it("A/B测试不存在时报错", async () => {
    const caller = createCaller();
    await expect(caller.emailAutomation.sendWithAbTest({
      abTestId: 999,
      recipients: [{ email: "test@test.com" }],
    })).rejects.toThrow();
  });

  it("记录邮件打开事件", async () => {
    const caller = createCaller();
    const result = await caller.emailAutomation.trackEvent({
      abTestId: 1,
      variant: "A",
      event: "opened",
    });
    expect(result.success).toBe(true);
  });

  it("记录邮件回复事件", async () => {
    const caller = createCaller();
    const result = await caller.emailAutomation.trackEvent({
      abTestId: 1,
      variant: "B",
      event: "replied",
    });
    expect(result.success).toBe(true);
  });

  it("获取邮件发送统计", async () => {
    const caller = createCaller();
    const result = await caller.emailAutomation.stats();
    expect(result).toHaveProperty("totalSent");
    expect(result).toHaveProperty("recent7d");
    expect(result).toHaveProperty("activeAbTests");
    expect(result).toHaveProperty("totalAbTests");
    expect(result.totalSent).toBe(2);
    expect(result.activeAbTests).toBe(1);
  });

  it("定时发送邮件", async () => {
    const caller = createCaller();
    const futureTime = new Date(Date.now() + 3600000).toISOString();
    const result = await caller.emailAutomation.scheduleEmail({
      recipients: "test@test.com",
      subject: "Scheduled Test",
      body: "This is a scheduled email",
      scheduledAt: futureTime,
    });
    expect(result.success).toBe(true);
    expect(result.scheduledAt).toBeDefined();
  });

  it("过去时间不能定时发送", async () => {
    const caller = createCaller();
    const pastTime = new Date(Date.now() - 3600000).toISOString();
    await expect(caller.emailAutomation.scheduleEmail({
      recipients: "test@test.com",
      subject: "Past Test",
      body: "This should fail",
      scheduledAt: pastTime,
    })).rejects.toThrow();
  });

  it("未登录用户无法使用邮件自动化", async () => {
    const caller = createAnonymousCaller();
    await expect(caller.emailAutomation.stats()).rejects.toThrow();
  });
});
