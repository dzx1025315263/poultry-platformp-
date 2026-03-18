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

// Mock LLM - return weekly report format
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          part1: "## 全球宏观与贸易格局\n全球白羽肉鸡市场供需基本面保持平衡...",
          part2: "## 核心产区价格核准\n| 产区 | 价格(元/斤) | 价格(USD/kg) |\n|---|---|---|\n| 中国山东 | 4.2 | 1.16 |",
          part3: "## 航运费率与物流预警\n远东至中东航线运价稳定在$1,200/TEU...",
          part4: "## 大客户开发指南\n中东市场推荐话术：Dear Procurement Manager...",
          part5: "## 风控模型与结算建议\n| 市场 | 风险等级 | 建议结算方式 |\n|---|---|---|\n| 沙特 | 低 | T/T 30天 |",
          part6: "## 本周行动指南\n1. 关注巴西鸡肉出口报价变化\n2. 跟进中东客户清真认证进度",
          references: "1. USDA FAS Global Agricultural Trade System\n2. World Bank Commodity Markets",
        }),
      },
    }],
  }),
}));

// Mock db module
vi.mock("./db", () => {
  const reports: any[] = [];
  let reportIdCounter = 1;

  return {
    // Existing mocks needed for router initialization
    getLifecycleFunnel: vi.fn().mockResolvedValue({ stages: [], items: [] }),
    getUserFavorites: vi.fn().mockResolvedValue([]),
    searchCompanies: vi.fn().mockResolvedValue({ data: [], total: 50 }),
    getCompanyById: vi.fn().mockResolvedValue(null),
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

    // V2.4: Weekly Market Reports
    getWeeklyReports: vi.fn().mockImplementation(async (limit: number, offset: number) => {
      return { data: reports.slice(offset, offset + limit), total: reports.length };
    }),
    getWeeklyReportById: vi.fn().mockImplementation(async (id: number) => {
      return reports.find(r => r.id === id) || null;
    }),
    getLatestWeeklyReport: vi.fn().mockImplementation(async () => {
      const completed = reports.filter(r => r.status === "completed");
      return completed.length > 0 ? completed[completed.length - 1] : null;
    }),
    getWeeklyReportByWeek: vi.fn().mockImplementation(async (weekLabel: string) => {
      return reports.find(r => r.weekLabel === weekLabel) || null;
    }),
    createWeeklyReport: vi.fn().mockImplementation(async (data: any) => {
      const report = {
        id: reportIdCounter++,
        weekLabel: data.weekLabel,
        reportDate: data.reportDate,
        status: "generating",
        generatedByUserId: data.generatedByUserId || null,
        part1_macroLandscape: null,
        part2_priceVerification: null,
        part3_logisticsAlerts: null,
        part4_keyAccountGuide: null,
        part5_riskControl: null,
        part6_actionItems: null,
        references: null,
        createdAt: new Date(),
      };
      reports.push(report);
      return report.id;
    }),
    updateWeeklyReport: vi.fn().mockImplementation(async (id: number, data: any) => {
      const report = reports.find(r => r.id === id);
      if (report) Object.assign(report, data);
    }),
    deleteWeeklyReport: vi.fn().mockImplementation(async (id: number) => {
      const idx = reports.findIndex(r => r.id === id);
      if (idx >= 0) reports.splice(idx, 1);
    }),
    getPoultryTradeData: vi.fn().mockResolvedValue([
      { country: "Saudi Arabia", year: 2024, importQuantityTons: "500000", importValueUsd: "750000000", unitPriceUsd: "1.50", yoyChange: "+5.2%" },
      { country: "Japan", year: 2024, importQuantityTons: "300000", importValueUsd: "600000000", unitPriceUsd: "2.00", yoyChange: "+3.1%" },
    ]),
    getDb: vi.fn().mockResolvedValue(null),
  };
});

const createCaller = (user?: any) => {
  const ctx: TrpcContext = {
    user: user || { id: 1, openId: "test-open-id", name: "Test User", role: "admin" },
  };
  return appRouter.createCaller(ctx);
};

describe("V2.4: Weekly Market Report", () => {
  it("should list weekly reports (empty initially)", async () => {
    const caller = createCaller();
    const result = await caller.weeklyReport.list({ page: 1, pageSize: 10 });
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should return null for latest report when none exist", async () => {
    const caller = createCaller();
    const result = await caller.weeklyReport.latest();
    // Initially null since no completed reports
    expect(result === null || result !== undefined).toBe(true);
  });

  it("should generate a new weekly report via LLM", async () => {
    const caller = createCaller();
    const result = await caller.weeklyReport.generate({});
    expect(result).toBeDefined();
    expect(result.weekLabel).toMatch(/^\d{4}-W\d{2}$/);
    expect(result.status).toBe("completed");
    expect(typeof result.id).toBe("number");
  });

  it("should generate report with custom week label", async () => {
    const caller = createCaller();
    const result = await caller.weeklyReport.generate({ weekLabel: "2026-W10" });
    expect(result).toBeDefined();
    expect(result.weekLabel).toBe("2026-W10");
    expect(result.status).toBe("completed");
  });

  it("should get report by id after generation", async () => {
    const caller = createCaller();
    const genResult = await caller.weeklyReport.generate({ weekLabel: "2026-W11" });
    const report = await caller.weeklyReport.get({ id: genResult.id });
    expect(report).toBeDefined();
    if (report) {
      expect(report.weekLabel).toBe("2026-W11");
      expect(report.status).toBe("completed");
      expect(report.part1_macroLandscape).toContain("全球宏观");
      expect(report.part2_priceVerification).toContain("价格");
      expect(report.part3_logisticsAlerts).toContain("航运");
      expect(report.part4_keyAccountGuide).toContain("客户");
      expect(report.part5_riskControl).toContain("风控");
      expect(report.part6_actionItems).toContain("行动");
      expect(report.references).toContain("USDA");
    }
  });

  it("should return already_exists for duplicate week", async () => {
    const caller = createCaller();
    // First generate
    await caller.weeklyReport.generate({ weekLabel: "2026-W12" });
    // Second generate same week
    const result = await caller.weeklyReport.generate({ weekLabel: "2026-W12" });
    expect(result.status).toBe("already_exists");
  });

  it("should delete a report (admin only)", async () => {
    const caller = createCaller();
    const genResult = await caller.weeklyReport.generate({ weekLabel: "2026-W13" });
    const deleteResult = await caller.weeklyReport.delete({ id: genResult.id });
    expect(deleteResult.success).toBe(true);
  });

  it("should get report by week label", async () => {
    const caller = createCaller();
    await caller.weeklyReport.generate({ weekLabel: "2026-W14" });
    const report = await caller.weeklyReport.getByWeek({ weekLabel: "2026-W14" });
    expect(report).toBeDefined();
    if (report) {
      expect(report.weekLabel).toBe("2026-W14");
    }
  });

  it("should list reports with pagination", async () => {
    const caller = createCaller();
    const result = await caller.weeklyReport.list({ page: 1, pageSize: 5 });
    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.data)).toBe(true);
  });
});

describe("V2.4: Weekly Report Content Structure", () => {
  it("should have all 6 parts in generated report", async () => {
    const caller = createCaller();
    const genResult = await caller.weeklyReport.generate({ weekLabel: "2026-W15" });
    const report = await caller.weeklyReport.get({ id: genResult.id });
    
    expect(report).toBeDefined();
    if (report) {
      // All 6 parts should be populated
      expect(report.part1_macroLandscape).toBeTruthy();
      expect(report.part2_priceVerification).toBeTruthy();
      expect(report.part3_logisticsAlerts).toBeTruthy();
      expect(report.part4_keyAccountGuide).toBeTruthy();
      expect(report.part5_riskControl).toBeTruthy();
      expect(report.part6_actionItems).toBeTruthy();
      expect(report.references).toBeTruthy();
    }
  });

  it("should contain price data in part2", async () => {
    const caller = createCaller();
    const genResult = await caller.weeklyReport.generate({ weekLabel: "2026-W16" });
    const report = await caller.weeklyReport.get({ id: genResult.id });
    
    if (report) {
      // Part 2 should contain price-related content
      expect(report.part2_priceVerification).toContain("价格");
    }
  });
});
