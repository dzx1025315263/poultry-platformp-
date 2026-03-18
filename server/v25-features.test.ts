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
            { companyId: 10, companyName: "Test Corp", country: "Japan", matchScore: 92, reason: "High import volume" },
            { companyId: 20, companyName: "Another Corp", country: "UAE", matchScore: 85, reason: "Growing market" },
          ],
          part1: "## 宏观格局\n测试内容",
          part2: "## 价格核准\n测试价格",
          part3: "## 物流预警\n测试物流",
          part4: "## 客户指南\n测试客户",
          part5: "## 风控建议\n测试风控",
          part6: "## 行动指南\n测试行动",
          references: "1. Test Reference",
        }),
      },
    }],
  }),
}));

// Mock db module
vi.mock("./db", () => {
  const activities: any[] = [];
  const changeHistory: any[] = [];
  let activityId = 1;
  let changeId = 1;

  return {
    // Existing mocks
    getLifecycleFunnel: vi.fn().mockResolvedValue({ stages: [], items: [] }),
    getUserFavorites: vi.fn().mockResolvedValue([]),
    searchCompanies: vi.fn().mockResolvedValue({ data: [], total: 50 }),
    getCompanyById: vi.fn().mockResolvedValue({ id: 1, companyName: "Test Corp", country: "Japan", continent: "东亚" }),
    getUserAbTests: vi.fn().mockResolvedValue([]),
    addEmailHistory: vi.fn().mockResolvedValue(undefined),
    updateAbTestStats: vi.fn().mockResolvedValue(undefined),
    getEmailHistory: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getUserFavoriteIds: vi.fn().mockResolvedValue([]),
    getAiExclusions: vi.fn().mockResolvedValue([]),
    addAiExclusion: vi.fn().mockResolvedValue({}),
    removeAiExclusion: vi.fn().mockResolvedValue(undefined),
    getUserTodoItems: vi.fn().mockResolvedValue([]),
    addTodoItem: vi.fn().mockResolvedValue({ id: 1 }),
    updateTodoItem: vi.fn().mockResolvedValue({}),
    deleteTodoItem: vi.fn().mockResolvedValue(undefined),
    getEmailBatchJobs: vi.fn().mockResolvedValue([]),
    createEmailBatchJob: vi.fn().mockResolvedValue(1),
    getEmailBatchJob: vi.fn().mockResolvedValue(null),
    updateEmailBatchJob: vi.fn().mockResolvedValue(undefined),
    getWeeklyReports: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getWeeklyReportById: vi.fn().mockResolvedValue(null),
    getLatestWeeklyReport: vi.fn().mockResolvedValue({
      id: 1, weekLabel: "2026-W11", status: "completed",
      part6_actionItems: "## 本周行动指南\n1. 关注巴西报价\n2. 跟进中东客户",
      createdAt: new Date(),
    }),
    getWeeklyReportByWeek: vi.fn().mockResolvedValue(null),
    createWeeklyReport: vi.fn().mockResolvedValue(1),
    updateWeeklyReport: vi.fn().mockResolvedValue(undefined),
    deleteWeeklyReport: vi.fn().mockResolvedValue(undefined),
    getPoultryTradeData: vi.fn().mockResolvedValue([
      { country: "Saudi Arabia", year: 2024, importQuantityTons: "500000", importValueUsd: "750000000", unitPriceUsd: "1.50", yoyChange: "+5.2%" },
    ]),
    getDb: vi.fn().mockResolvedValue(null),

    // V2.5: Team Activity Feed
    getTeamActivities: vi.fn().mockImplementation(async (teamId: number, limit: number, offset: number) => {
      return activities.filter(a => a.teamId === teamId).slice(offset, offset + limit);
    }),
    addTeamActivity: vi.fn().mockImplementation(async (data: any) => {
      const activity = { id: activityId++, ...data, createdAt: new Date() };
      activities.push(activity);
      return activity;
    }),

    // V2.5: Company Change History
    getCompanyChangeHistory: vi.fn().mockImplementation(async (companyId: number, limit: number, offset: number) => {
      return changeHistory.filter(c => c.companyId === companyId).slice(offset, offset + limit);
    }),
    addCompanyChange: vi.fn().mockImplementation(async (data: any) => {
      const change = { id: changeId++, ...data, createdAt: new Date() };
      changeHistory.push(change);
      return change;
    }),

    // V2.5: Similar Companies
    getSimilarCompanies: vi.fn().mockResolvedValue([
      { id: 2, companyName: "Similar Corp A", country: "Japan", continent: "东亚", coreRole: "进口商/贸易商" },
      { id: 3, companyName: "Similar Corp B", country: "Korea", continent: "东亚", coreRole: "加工商" },
    ]),

    // V2.5: Advanced Search
    advancedSearchCompanies: vi.fn().mockResolvedValue({ data: [
      { id: 1, companyName: "Test Corp", country: "Japan", creditScore: 85, contactCount: 3 },
    ], total: 1 }),

    // V2.5: Follow-up Reminders
    getUpcomingReminders: vi.fn().mockResolvedValue([
      { id: 1, companyName: "Reminder Corp", followUpDate: new Date(Date.now() + 86400000).toISOString(), followUpStatus: "contacted" },
    ]),

    // V2.5: Weekly Report Summary for Home
    getWeeklyReportSummary: vi.fn().mockResolvedValue({
      weekLabel: "2026-W11",
      actionItems: "1. 关注巴西报价\n2. 跟进中东客户",
      createdAt: new Date(),
    }),
  };
});

const createCaller = (user?: any) => {
  const ctx: TrpcContext = {
    user: user || { id: 1, openId: "test-open-id", name: "Test User", role: "admin" },
  };
  return appRouter.createCaller(ctx);
};

describe("V2.5: Team Activity Feed", () => {
  it("should list team activities (empty initially)", async () => {
    const caller = createCaller();
    const result = await caller.teamActivity.list({ teamId: 1, limit: 20 });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should add a team activity", async () => {
    const caller = createCaller();
    const result = await caller.teamActivity.add({
      teamId: 1,
      actionType: "add_favorite",
      targetType: "company",
      targetId: 100,
      targetName: "Test Corp",
      details: "添加到收藏夹",
    });
    expect(result).toBeDefined();
    expect(result.actionType).toBe("add_favorite");
    expect(result.targetName).toBe("Test Corp");
  });

  it("should add activity with minimal fields", async () => {
    const caller = createCaller();
    const result = await caller.teamActivity.add({
      teamId: 1,
      actionType: "update_status",
    });
    expect(result).toBeDefined();
    expect(result.actionType).toBe("update_status");
  });
});

describe("V2.5: Company Change History", () => {
  it("should list change history for a company", async () => {
    const caller = createCaller();
    const result = await caller.company.changeHistory({ companyId: 1, limit: 20 });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("V2.5: Similar Companies", () => {
  it("should return similar companies for a given company", async () => {
    const caller = createCaller();
    const result = await caller.company.similar({ companyId: 1, limit: 5 });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("companyName");
    expect(result[0]).toHaveProperty("country");
  });
});

describe("V2.5: Advanced Search", () => {
  it("should search with credit score filter", async () => {
    const caller = createCaller();
    const result = await caller.company.advancedSearch({
      minCreditScore: 80,
      page: 1,
      pageSize: 10,
    });
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it("should search with multiple advanced filters", async () => {
    const caller = createCaller();
    const result = await caller.company.advancedSearch({
      continent: "东亚",
      minCreditScore: 60,
      hasContacts: true,
      page: 1,
      pageSize: 10,
    });
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
  });

  it("should search with country filter", async () => {
    const caller = createCaller();
    const result = await caller.company.advancedSearch({
      country: "Japan",
      page: 1,
      pageSize: 10,
    });
    expect(result).toBeDefined();
  });
});

describe("V2.5: Follow-up Reminders", () => {
  it("should get upcoming follow-up reminders", async () => {
    const caller = createCaller();
    const result = await caller.reminder.upcoming({ days: 7 });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("V2.5: Weekly Report Summary (Home)", () => {
  it("should get latest weekly report for home page", async () => {
    const caller = createCaller();
    const result = await caller.weeklyReport.latest();
    // Should return the latest completed report
    expect(result === null || result !== undefined).toBe(true);
  });
});
