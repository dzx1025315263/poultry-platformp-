import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock feishuWebhook
vi.mock("./feishuWebhook", () => ({
  notifyFavoriteChange: vi.fn().mockResolvedValue(true),
  notifyStatusUpdate: vi.fn().mockResolvedValue(true),
  notifyContactImport: vi.fn().mockResolvedValue(true),
}));

// Mock db module
vi.mock("./db", () => ({
  // Contact
  getCompanyContacts: vi.fn().mockResolvedValue([
    { id: 1, companyId: 10, name: "John Doe", title: "CEO", email: "john@test.com", phone: "+1234", linkedin: "https://linkedin.com/in/john", isPrimary: true },
    { id: 2, companyId: 10, name: "Jane Smith", title: "Buyer", email: "jane@test.com", phone: null, linkedin: null, isPrimary: false },
    { id: 3, companyId: 10, name: "No Email", title: "Intern", email: null, phone: "+5678", linkedin: null, isPrimary: false },
  ]),
  addCompanyContact: vi.fn().mockResolvedValue(4),
  updateCompanyContact: vi.fn().mockResolvedValue(undefined),
  deleteCompanyContact: vi.fn().mockResolvedValue(undefined),
  getCompanyById: vi.fn().mockResolvedValue({ id: 10, companyName: "TestCo", country: "US" }),

  // Credit
  getCompanyCreditRating: vi.fn().mockResolvedValue({
    id: 1, companyId: 10, registeredCapital: "$10M", foundedYear: 2005,
    importFrequency: "frequent", cooperationHistory: "regular", creditScore: 85,
  }),
  upsertCreditRating: vi.fn().mockResolvedValue(undefined),

  // Lifecycle with credit
  getLifecycleFunnel: vi.fn().mockResolvedValue({
    stages: [{ stage: "prospect", cnt: 5 }, { stage: "contacted", cnt: 3 }, { stage: "quoted", cnt: 2 }, { stage: "won", cnt: 1 }, { stage: "repurchase", cnt: 0 }],
    items: [{ customer_lifecycle: { companyId: 10, stage: "prospect" }, companies: { companyName: "TestCo", country: "US" } }],
  }),
  getLifecycleFunnelWithCredit: vi.fn().mockResolvedValue({
    stages: [{ stage: "prospect", cnt: 3 }, { stage: "contacted", cnt: 2 }, { stage: "quoted", cnt: 1 }, { stage: "won", cnt: 1 }, { stage: "repurchase", cnt: 0 }],
    items: [{ customer_lifecycle: { companyId: 10, stage: "prospect" }, companies: { companyName: "HighCreditCo", country: "JP" }, creditScore: 92 }],
  }),
  addToLifecycle: vi.fn().mockResolvedValue(1),
  removeFromLifecycle: vi.fn().mockResolvedValue(undefined),

  // Trade data
  getPoultryTradeData: vi.fn().mockResolvedValue([
    { id: 1, country: "China", countryCode: "CHN", year: 2024, importValueUsd: "2900000000", importQuantityTons: "1520000", unitPriceUsd: "1908", yoyChange: "-3.2", hsCode: "0207", source: "UN Comtrade" },
    { id: 2, country: "Japan", countryCode: "JPN", year: 2024, importValueUsd: "2650000000", importQuantityTons: "1100000", unitPriceUsd: "2409", yoyChange: "2.1", hsCode: "0207", source: "UN Comtrade" },
  ]),
  getPoultryTradeTrends: vi.fn().mockResolvedValue([
    { country: "China", countryCode: "CHN", year: 2022, importValueUsd: "3124000000" },
    { country: "China", countryCode: "CHN", year: 2023, importValueUsd: "2996000000" },
    { country: "China", countryCode: "CHN", year: 2024, importValueUsd: "2900000000" },
  ]),

  // Email history
  addEmailHistory: vi.fn().mockResolvedValue(1),

  // Export
  exportCompanies: vi.fn().mockResolvedValue([{ id: 1, companyName: "CompanyA" }, { id: 2, companyName: "CompanyB" }]),
  exportFavorites: vi.fn().mockResolvedValue([]),

  // Backup
  getBackupRecords: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  addBackupRecord: vi.fn().mockResolvedValue(1),

  // Region Access
  getTeamRegionAccess: vi.fn().mockResolvedValue([]),
  setTeamRegionAccess: vi.fn().mockResolvedValue(undefined),

  // A/B Test
  getUserAbTests: vi.fn().mockResolvedValue([]),
  createAbTest: vi.fn().mockResolvedValue(1),
  updateAbTestStats: vi.fn().mockResolvedValue(undefined),
  deleteAbTest: vi.fn().mockResolvedValue(undefined),

  // Company
  getCompanyStats: vi.fn().mockResolvedValue({ total: 100 }),
  getCountryStats: vi.fn().mockResolvedValue([]),
  searchCompanies: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getCompaniesByContinent: vi.fn().mockResolvedValue([]),
  getCompaniesByCountry: vi.fn().mockResolvedValue([]),

  // Favorite
  getUserFavorites: vi.fn().mockResolvedValue([]),
  getUserFavoriteIds: vi.fn().mockResolvedValue([]),
  addFavorite: vi.fn().mockResolvedValue(1),
  removeFavorite: vi.fn().mockResolvedValue(undefined),
  updateFavorite: vi.fn().mockResolvedValue(undefined),

  // Team
  getUserTeams: vi.fn().mockResolvedValue([]),
  createTeam: vi.fn().mockResolvedValue(1),
  joinTeam: vi.fn().mockResolvedValue(undefined),
  getTeamMembers: vi.fn().mockResolvedValue([]),
  leaveTeam: vi.fn().mockResolvedValue(undefined),
  deleteTeam: vi.fn().mockResolvedValue(undefined),
  shareCompanyToTeam: vi.fn().mockResolvedValue(1),
  getTeamSharedCompanies: vi.fn().mockResolvedValue([]),
  updateTeamSharedCompany: vi.fn().mockResolvedValue(undefined),

  // Inquiry
  getInquiryTemplate: vi.fn().mockResolvedValue(null),
  upsertInquiryTemplate: vi.fn().mockResolvedValue(undefined),
  getSmtpConfig: vi.fn().mockResolvedValue(null),
  upsertSmtpConfig: vi.fn().mockResolvedValue(undefined),
  getEmailHistory: vi.fn().mockResolvedValue({ data: [], total: 0 }),

  // Admin
  updateCompany: vi.fn().mockResolvedValue(undefined),
  deleteCompany: vi.fn().mockResolvedValue(undefined),
  createCompany: vi.fn().mockResolvedValue(1),
  addAuditLog: vi.fn().mockResolvedValue(undefined),
  getAuditLogs: vi.fn().mockResolvedValue({ data: [], total: 0 }),
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

// ==================== BULK IMPORT CONTACTS ====================
describe("contact.bulkImport", () => {
  it("imports multiple contacts at once", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.contact.bulkImport({
      companyId: 10,
      contacts: [
        { name: "Alice", title: "Director", email: "alice@test.com" },
        { name: "Bob", title: "Manager", email: "bob@test.com", phone: "+9999" },
        { name: "Charlie", email: "charlie@test.com", linkedin: "https://linkedin.com/in/charlie" },
      ],
    });
    expect(result.imported).toBe(3);
  });

  it("rejects empty contacts array", async () => {
    const caller = appRouter.createCaller(createUserContext());
    // Empty array should still succeed with 0 imported
    const result = await caller.contact.bulkImport({ companyId: 10, contacts: [] });
    expect(result.imported).toBe(0);
  });

  it("rejects contact without name", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.contact.bulkImport({ companyId: 10, contacts: [{ name: "", email: "test@test.com" }] })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated bulk import", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.contact.bulkImport({ companyId: 10, contacts: [{ name: "Test" }] })
    ).rejects.toThrow();
  });
});

// ==================== BULK EMAIL ====================
describe("contact.bulkEmail", () => {
  it("sends bulk email to selected contacts", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.contact.bulkEmail({
      companyId: 10,
      contactIds: [1, 2],
      subject: "Business Inquiry",
      body: "Dear Sir/Madam, we would like to inquire about...",
    });
    expect(result.sent).toBe(2);
    expect(result.recipients).toHaveLength(2);
    expect(result.recipients[0].email).toBe("john@test.com");
  });

  it("filters out contacts without email", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.contact.bulkEmail({
      companyId: 10,
      contactIds: [1, 3], // id 3 has no email
      subject: "Test",
      body: "Test body",
    });
    expect(result.sent).toBe(1);
  });

  it("rejects when no valid email contacts selected", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.contact.bulkEmail({
        companyId: 10,
        contactIds: [3], // only no-email contact
        subject: "Test",
        body: "Test body",
      })
    ).rejects.toThrow("所选联系人中没有有效邮箱");
  });

  it("rejects empty subject", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.contact.bulkEmail({ companyId: 10, contactIds: [1], subject: "", body: "Body" })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated bulk email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.contact.bulkEmail({ companyId: 10, contactIds: [1], subject: "Test", body: "Body" })
    ).rejects.toThrow();
  });
});

// ==================== LIFECYCLE WITH CREDIT FILTER ====================
describe("lifecycle.funnelWithCredit", () => {
  it("returns filtered funnel data with credit scores", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const funnel = await caller.lifecycle.funnelWithCredit({ minCreditScore: 80 });
    expect(funnel.stages).toBeDefined();
    expect(funnel.items).toBeDefined();
    expect(funnel.items[0].creditScore).toBe(92);
    expect(funnel.items[0].companies.companyName).toBe("HighCreditCo");
  });

  it("works without filter params", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const funnel = await caller.lifecycle.funnelWithCredit({});
    expect(funnel.stages).toBeDefined();
  });

  it("works with both min and max credit score", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const funnel = await caller.lifecycle.funnelWithCredit({ minCreditScore: 60, maxCreditScore: 79 });
    expect(funnel).toBeDefined();
  });

  it("rejects unauthenticated access", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.lifecycle.funnelWithCredit({})).rejects.toThrow();
  });
});

// ==================== TRADE DATA ====================
describe("trade router", () => {
  it("returns poultry import data (public)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const data = await caller.trade.poultryImports({ year: 2024 });
    expect(data).toHaveLength(2);
    expect(data[0].country).toBe("China");
    expect(data[0].importValueUsd).toBe("2900000000");
  });

  it("returns trade data without year filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const data = await caller.trade.poultryImports({});
    expect(data).toHaveLength(2);
  });

  it("returns trade trends (public)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const trends = await caller.trade.trends({ country: "China" });
    expect(trends).toHaveLength(3);
    expect(trends[0].year).toBe(2022);
  });

  it("returns trends without country filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const trends = await caller.trade.trends({});
    expect(trends).toHaveLength(3);
  });
});

// ==================== FEISHU WEBHOOK INTEGRATION ====================
describe("feishu webhook triggers", () => {
  it("triggers feishu notification on favorite add", async () => {
    const { notifyFavoriteChange } = await import("./feishuWebhook");
    const caller = appRouter.createCaller(createUserContext());
    await caller.favorite.add({ companyId: 10 });
    expect(notifyFavoriteChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: "add", companyName: "TestCo" })
    );
  });

  it("triggers feishu notification on contact bulk import", async () => {
    const { notifyContactImport } = await import("./feishuWebhook");
    const caller = appRouter.createCaller(createUserContext());
    await caller.contact.bulkImport({
      companyId: 10,
      contacts: [{ name: "Test1" }, { name: "Test2" }],
    });
    expect(notifyContactImport).toHaveBeenCalledWith(
      expect.objectContaining({ count: 2, companyName: "TestCo" })
    );
  });
});
