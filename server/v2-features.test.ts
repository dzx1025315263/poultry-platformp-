import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  // Contact
  getCompanyContacts: vi.fn().mockResolvedValue([
    { id: 1, companyId: 10, name: "John Doe", title: "CEO", email: "john@test.com", phone: "+1234", linkedin: "https://linkedin.com/in/john", isPrimary: true },
    { id: 2, companyId: 10, name: "Jane Smith", title: "Buyer", email: "jane@test.com", phone: null, linkedin: null, isPrimary: false },
  ]),
  addCompanyContact: vi.fn().mockResolvedValue(3),
  updateCompanyContact: vi.fn().mockResolvedValue(undefined),
  deleteCompanyContact: vi.fn().mockResolvedValue(undefined),

  // Credit
  getCompanyCreditRating: vi.fn().mockResolvedValue({
    id: 1, companyId: 10, registeredCapital: "$10M", foundedYear: 2005,
    importFrequency: "frequent", cooperationHistory: "regular", creditScore: 85,
  }),
  upsertCreditRating: vi.fn().mockResolvedValue(undefined),

  // Lifecycle
  getLifecycleFunnel: vi.fn().mockResolvedValue({
    stages: [
      { stage: "prospect", cnt: 5 },
      { stage: "contacted", cnt: 3 },
      { stage: "quoted", cnt: 2 },
      { stage: "won", cnt: 1 },
      { stage: "repurchase", cnt: 0 },
    ],
    items: [
      { customer_lifecycle: { companyId: 10, stage: "prospect" }, companies: { companyName: "TestCo", country: "US" } },
    ],
  }),
  addToLifecycle: vi.fn().mockResolvedValue(1),
  removeFromLifecycle: vi.fn().mockResolvedValue(undefined),

  // A/B Test
  getUserAbTests: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, name: "Test Campaign", variantA_subject: "SubA", variantA_body: "BodyA", variantB_subject: "SubB", variantB_body: "BodyB", variantA_sent: 10, variantA_opened: 5, variantA_replied: 2, variantB_sent: 10, variantB_opened: 3, variantB_replied: 1, isActive: true },
  ]),
  createAbTest: vi.fn().mockResolvedValue(2),
  updateAbTestStats: vi.fn().mockResolvedValue(undefined),
  deleteAbTest: vi.fn().mockResolvedValue(undefined),

  // Export
  exportCompanies: vi.fn().mockResolvedValue([
    { id: 1, companyName: "CompanyA", country: "Vietnam", continent: "东南亚", coreRole: "进口商", hasPurchasedFromChina: "是" },
    { id: 2, companyName: "CompanyB", country: "Brazil", continent: "南美洲", coreRole: "加工商", hasPurchasedFromChina: "否" },
  ]),
  exportFavorites: vi.fn().mockResolvedValue([
    { favorites: { companyId: 1, followUpStatus: "contacted", notes: "Good lead" }, companies: { companyName: "CompanyA", country: "Vietnam" } },
  ]),

  // Backup
  getBackupRecords: vi.fn().mockResolvedValue({
    data: [{ id: 1, fileName: "backup_2026-03-18.json", recordCount: 2314, backupType: "manual", createdAt: new Date() }],
    total: 1,
  }),
  addBackupRecord: vi.fn().mockResolvedValue(2),

  // Region Access
  getTeamRegionAccess: vi.fn().mockResolvedValue([
    { id: 1, teamId: 1, continent: "东南亚", country: null },
  ]),
  setTeamRegionAccess: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" | "editor" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ==================== CONTACT TESTS ====================
describe("contact router", () => {
  it("lists contacts for a company (requires login)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const contacts = await caller.contact.list({ companyId: 10 });
    expect(contacts).toHaveLength(2);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[0].isPrimary).toBe(true);
  });

  it("adds a contact (authenticated)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const id = await caller.contact.add({ companyId: 10, name: "New Contact", title: "Manager", email: "new@test.com" });
    expect(id).toBe(3);
  });

  it("rejects add contact without name", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.contact.add({ companyId: 10, name: "" })).rejects.toThrow();
  });

  it("deletes a contact (authenticated)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.contact.delete({ id: 1 })).resolves.not.toThrow();
  });
});

// ==================== CREDIT RATING TESTS ====================
describe("credit router", () => {
  it("gets credit rating for a company (requires login)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const credit = await caller.credit.get({ companyId: 10 });
    expect(credit).toBeTruthy();
    expect(credit!.creditScore).toBe(85);
    expect(credit!.foundedYear).toBe(2005);
  });

  it("upserts credit rating (authenticated)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.credit.upsert({ companyId: 10, creditScore: 90, foundedYear: 2000 })
    ).resolves.not.toThrow();
  });
});

// ==================== LIFECYCLE TESTS ====================
describe("lifecycle router", () => {
  it("gets funnel data (authenticated)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const funnel = await caller.lifecycle.funnel();
    expect(funnel.stages).toHaveLength(5);
    expect(funnel.items).toHaveLength(1);
    const prospectStage = funnel.stages.find((s: any) => s.stage === "prospect");
    expect(prospectStage?.cnt).toBe(5);
  });

  it("adds company to lifecycle (authenticated)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const id = await caller.lifecycle.add({ companyId: 10, stage: "prospect" });
    expect(id).toBe(1);
  });

  it("adds company with deal value", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const id = await caller.lifecycle.add({ companyId: 10, stage: "won", dealValue: "$50,000" });
    expect(id).toBe(1);
  });

  it("removes company from lifecycle", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.lifecycle.remove({ companyId: 10 })).resolves.not.toThrow();
  });

  it("rejects unauthenticated funnel access", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.lifecycle.funnel()).rejects.toThrow();
  });
});

// ==================== A/B TEST TESTS ====================
describe("abTest router", () => {
  it("lists user A/B tests", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const tests = await caller.abTest.list();
    expect(tests).toHaveLength(1);
    expect(tests[0].name).toBe("Test Campaign");
    expect(tests[0].variantA_sent).toBe(10);
  });

  it("creates a new A/B test", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const id = await caller.abTest.create({
      name: "New Test",
      variantA_subject: "Subject A",
      variantA_body: "Body A",
      variantB_subject: "Subject B",
      variantB_body: "Body B",
    });
    expect(id).toBe(2);
  });

  it("rejects A/B test with empty name", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.abTest.create({ name: "" })).rejects.toThrow();
  });

  it("updates A/B test stats", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.abTest.updateStats({ id: 1, variant: "A", field: "opened" })
    ).resolves.not.toThrow();
  });

  it("deletes an A/B test", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.abTest.delete({ id: 1 })).resolves.not.toThrow();
  });
});

// ==================== EXPORT TESTS ====================
describe("export router", () => {
  it("exports companies with filters", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.export.companies({ continent: "东南亚" });
    expect(data).toHaveLength(2);
    expect(data[0].companyName).toBe("CompanyA");
  });

  it("exports companies without filters", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.export.companies({});
    expect(data).toHaveLength(2);
  });

  it("exports favorites with status filter", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const data = await caller.export.favorites({ status: "contacted" });
    expect(data).toHaveLength(1);
  });

  it("rejects unauthenticated export", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.export.companies({})).rejects.toThrow();
  });
});

// ==================== BACKUP TESTS ====================
describe("backup router", () => {
  it("lists backups (admin only)", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.backup.list({ page: 1, pageSize: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].fileName).toContain("backup");
  });

  it("creates a backup (admin only)", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.backup.create();
    expect(result.id).toBe(2);
    expect(result.recordCount).toBe(2);
  });

  it("rejects backup list for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.backup.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("rejects backup create for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.backup.create()).rejects.toThrow();
  });
});

// ==================== REGION ACCESS TESTS ====================
describe("regionAccess router", () => {
  it("gets team region access (authenticated)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const regions = await caller.regionAccess.get({ teamId: 1 });
    expect(regions).toHaveLength(1);
    expect(regions[0].continent).toBe("东南亚");
  });

  it("sets team region access (admin only)", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    await expect(
      caller.regionAccess.set({ teamId: 1, regions: [{ continent: "中东" }, { country: "Brazil" }] })
    ).resolves.not.toThrow();
  });

  it("rejects region set for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(
      caller.regionAccess.set({ teamId: 1, regions: [{ continent: "中东" }] })
    ).rejects.toThrow();
  });
});
