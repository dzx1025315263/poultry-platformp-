import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@test.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "normal-user",
      email: "user@test.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("company.stats", () => {
  it("returns statistics with correct shape", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const stats = await caller.company.stats();
    expect(stats).toBeDefined();
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.countries).toBe("number");
    expect(typeof stats.continents).toBe("number");
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.countries).toBeGreaterThan(0);
    expect(Array.isArray(stats.continentDistribution)).toBe(true);
  });

  it("returns correct total company count (2314)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const stats = await caller.company.stats();
    expect(stats.total).toBe(2314);
  });
});

describe("company.search", () => {
  it("returns paginated results with default params", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.company.search({});
    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.total).toBe("number");
    expect(result.data.length).toBeLessThanOrEqual(50);
  });

  it("filters by continent", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.company.search({ continent: "中东" });
    expect(result.data.length).toBeGreaterThan(0);
    result.data.forEach((c: any) => {
      expect(c.continent).toBe("中东");
    });
  });

  it("searches by query keyword", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.company.search({ query: "chicken" });
    expect(result).toBeDefined();
    expect(typeof result.total).toBe("number");
  });

  it("respects page and pageSize", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.company.search({ page: 1, pageSize: 5 });
    expect(result.data.length).toBeLessThanOrEqual(5);
  });
});

describe("admin procedures - access control", () => {
  it("rejects non-admin users from auditLogs", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.auditLogs({})).rejects.toThrow();
  });

  it("allows admin users to access auditLogs", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.auditLogs({});
    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.openId).toBe("admin-user");
    expect(result?.role).toBe("admin");
  });
});
