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
            { companyId: 5, matchScore: 92, reason: "高度匹配" },
          ],
          profileSummary: "测试画像",
        }),
      },
    }],
  }),
}));

// Mock db module
vi.mock("./db", () => {
  const todoItems: any[] = [];
  let todoIdCounter = 1;
  const exclusions: any[] = [];
  let exclusionIdCounter = 1;
  const batchJobs: any[] = [];
  let batchIdCounter = 1;

  return {
    // Existing mocks needed for router initialization
    getLifecycleFunnel: vi.fn().mockResolvedValue({
      stages: [{ stage: "won", cnt: 1 }],
      items: [
        { customer_lifecycle: { companyId: 1, stage: "won" }, companies: { id: 1, companyName: "Test Co", country: "Saudi Arabia", continent: "Asia", coreRole: "Importer", mainProducts: "Chicken" } },
      ],
    }),
    getUserFavorites: vi.fn().mockResolvedValue([]),
    searchCompanies: vi.fn().mockResolvedValue({ data: [{ id: 5, companyName: "Candidate Co", country: "UAE", continent: "Asia", coreRole: "Importer", mainProducts: "Poultry", hasPurchasedFromChina: "是" }], total: 1 }),
    getCompanyById: vi.fn().mockImplementation(async (id: number) => {
      if (id === 5) return { id: 5, companyName: "Candidate Co", country: "UAE", continent: "Asia" };
      return null;
    }),
    getUserAbTests: vi.fn().mockResolvedValue([]),
    addEmailHistory: vi.fn().mockResolvedValue(undefined),
    updateAbTestStats: vi.fn().mockResolvedValue(undefined),
    getEmailHistory: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getUserFavoriteIds: vi.fn().mockResolvedValue([]),

    // V2.3: AI Exclusions
    getAiExclusions: vi.fn().mockImplementation(async (userId: number) => {
      return exclusions.filter(e => e.userId === userId);
    }),
    addAiExclusion: vi.fn().mockImplementation(async (userId: number, companyId: number, reason?: string) => {
      const item = { id: exclusionIdCounter++, userId, companyId, reason, createdAt: new Date() };
      exclusions.push(item);
      return item;
    }),
    removeAiExclusion: vi.fn().mockImplementation(async (userId: number, companyId: number) => {
      const idx = exclusions.findIndex(e => e.userId === userId && e.companyId === companyId);
      if (idx >= 0) exclusions.splice(idx, 1);
    }),

    // V2.3: Todo items
    getUserTodoItems: vi.fn().mockImplementation(async (userId: number, status?: string) => {
      let items = todoItems.filter(t => t.userId === userId);
      if (status) items = items.filter(t => t.status === status);
      return items;
    }),
    addTodoItem: vi.fn().mockImplementation(async (data: any) => {
      const item = { id: todoIdCounter++, ...data, status: "pending", createdAt: new Date(), completedAt: null };
      todoItems.push(item);
      return item;
    }),
    updateTodoItem: vi.fn().mockImplementation(async (id: number, userId: number, data: any) => {
      const item = todoItems.find(t => t.id === id && t.userId === userId);
      if (item) Object.assign(item, data);
      return item;
    }),
    deleteTodoItem: vi.fn().mockImplementation(async (id: number, userId: number) => {
      const idx = todoItems.findIndex(t => t.id === id && t.userId === userId);
      if (idx >= 0) todoItems.splice(idx, 1);
    }),

    // V2.3: Email batch jobs
    getEmailBatchJobs: vi.fn().mockImplementation(async (userId: number) => {
      return batchJobs.filter(j => j.userId === userId);
    }),
    createEmailBatchJob: vi.fn().mockImplementation(async (data: any) => {
      const job = { id: batchIdCounter++, ...data, status: "running", sentCount: 0, createdAt: new Date() };
      batchJobs.push(job);
      return job.id;
    }),
    getEmailBatchJob: vi.fn().mockImplementation(async (id: number) => {
      return batchJobs.find(j => j.id === id) || null;
    }),
    updateEmailBatchJob: vi.fn().mockImplementation(async (id: number, data: any) => {
      const job = batchJobs.find(j => j.id === id);
      if (job) Object.assign(job, data);
    }),
    getDb: vi.fn().mockResolvedValue(null),
  };
});

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

describe("V2.3 - AI推荐不感兴趣标记", () => {
  it("标记企业为不感兴趣", async () => {
    const caller = createCaller();
    const result = await caller.aiRecommend.exclude({ companyId: 5, reason: "已通过其他渠道联系" });
    expect(result.success).toBe(true);
  });

  it("获取不感兴趣列表", async () => {
    const caller = createCaller();
    const result = await caller.aiRecommend.getExclusions();
    expect(Array.isArray(result)).toBe(true);
  });

  it("取消不感兴趣标记", async () => {
    const caller = createCaller();
    await caller.aiRecommend.exclude({ companyId: 10 });
    const result = await caller.aiRecommend.removeExclusion({ companyId: 10 });
    expect(result.success).toBe(true);
  });

  it("未登录用户无法操作排除列表", async () => {
    const caller = createAnonymousCaller();
    await expect(caller.aiRecommend.exclude({ companyId: 5 })).rejects.toThrow();
    await expect(caller.aiRecommend.getExclusions()).rejects.toThrow();
  });
});

describe("V2.3 - 待办事项系统", () => {
  it("创建待办事项", async () => {
    const caller = createCaller();
    const result = await caller.todo.add({
      title: "配置飞书Webhook",
      description: "在飞书群中创建自定义机器人",
      source: "飞书通知",
      priority: "high",
    });
    expect(result).toBeDefined();
  });

  it("获取待办列表", async () => {
    const caller = createCaller();
    const result = await caller.todo.list({ status: "pending" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("完成待办事项", async () => {
    const caller = createCaller();
    const added = await caller.todo.add({ title: "测试完成", priority: "medium" });
    if (added && typeof added === 'object' && 'id' in added) {
      const result = await caller.todo.complete({ id: (added as any).id });
      expect(result).toBeDefined();
    }
  });

  it("更新待办事项状态", async () => {
    const caller = createCaller();
    const added = await caller.todo.add({ title: "测试更新", priority: "low" });
    if (added && typeof added === 'object' && 'id' in added) {
      const result = await caller.todo.update({ id: (added as any).id, status: "in_progress" });
      expect(result).toBeDefined();
    }
  });

  it("删除待办事项", async () => {
    const caller = createCaller();
    const added = await caller.todo.add({ title: "测试删除", priority: "low" });
    if (added && typeof added === 'object' && 'id' in added) {
      await caller.todo.delete({ id: (added as any).id });
      // Should not throw
    }
  });

  it("未登录用户无法操作待办事项", async () => {
    const caller = createAnonymousCaller();
    await expect(caller.todo.list()).rejects.toThrow();
    await expect(caller.todo.add({ title: "Test", priority: "medium" })).rejects.toThrow();
  });
});

describe("V2.3 - 邮件批量任务暂停/恢复", () => {
  it("创建邮件批量任务", async () => {
    const caller = createCaller();
    const result = await caller.emailBatch.create({
      recipients: [
        { email: "buyer1@test.com", companyName: "Co1" },
        { email: "buyer2@test.com", companyName: "Co2" },
        { email: "buyer3@test.com", companyName: "Co3" },
      ],
      subject: "Inquiry",
      body: "Dear buyer...",
    });
    expect(result.jobId).toBeDefined();
    expect(result.totalRecipients).toBe(3);
  });

  it("获取批量任务列表", async () => {
    const caller = createCaller();
    const result = await caller.emailBatch.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("暂停批量任务", async () => {
    const caller = createCaller();
    const created = await caller.emailBatch.create({
      recipients: [{ email: "test@test.com" }],
      subject: "Test",
      body: "Test",
    });
    const result = await caller.emailBatch.pause({ id: created.jobId });
    expect(result.success).toBe(true);
  });

  it("恢复批量任务", async () => {
    const caller = createCaller();
    const created = await caller.emailBatch.create({
      recipients: [{ email: "test@test.com" }],
      subject: "Test",
      body: "Test",
    });
    await caller.emailBatch.pause({ id: created.jobId });
    const result = await caller.emailBatch.resume({ id: created.jobId });
    expect(result.success).toBe(true);
  });

  it("取消批量任务", async () => {
    const caller = createCaller();
    const created = await caller.emailBatch.create({
      recipients: [{ email: "test@test.com" }],
      subject: "Test",
      body: "Test",
    });
    const result = await caller.emailBatch.cancel({ id: created.jobId });
    expect(result.success).toBe(true);
  });

  it("发送下一封邮件", async () => {
    const caller = createCaller();
    const created = await caller.emailBatch.create({
      recipients: [{ email: "next@test.com", companyName: "NextCo" }],
      subject: "Next Test",
      body: "Next body",
    });
    const result = await caller.emailBatch.sendNext({ id: created.jobId });
    expect(result.success).toBe(true);
  });

  it("暂停后无法发送下一封", async () => {
    const caller = createCaller();
    const created = await caller.emailBatch.create({
      recipients: [{ email: "paused@test.com" }],
      subject: "Paused",
      body: "Paused body",
    });
    await caller.emailBatch.pause({ id: created.jobId });
    const result = await caller.emailBatch.sendNext({ id: created.jobId });
    expect(result.success).toBe(false);
  });

  it("未登录用户无法操作批量任务", async () => {
    const caller = createAnonymousCaller();
    await expect(caller.emailBatch.list()).rejects.toThrow();
  });
});
