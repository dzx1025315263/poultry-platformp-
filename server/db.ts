import { eq, ne, and, like, or, sql, desc, asc, count, isNull, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, companies, favorites, teams, teamMembers,
  teamSharedCompanies, inquiryTemplates, smtpConfigs, emailHistory, auditLogs,
  companyContacts, companyCreditRatings, customerLifecycle, abTestTemplates,
  teamRegionAccess, backupRecords, poultryTradeData,
  aiRecommendExclusions, todoItems, emailBatchJobs, weeklyMarketReports,
  teamActivities, companyChangeHistory,
  productionRegions, regionMarketPrices, regionDiseaseAlerts, regionIndustryNews,
  regionSubAreaPrices, regionFeedPrices, regionDiseaseLibrary, regionPolicies, regionCompanyProfiles,
  weeklyHeadlines, priceSnapshots, riskAlerts, analysisArticles
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (e) { _db = null; }
  }
  return _db;
}

// ==================== USER ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const f of ["name", "email", "loginMethod"] as const) {
    if (user[f] !== undefined) { values[f] = user[f] ?? null; updateSet[f] = user[f] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (user.feishuUserId !== undefined) { values.feishuUserId = user.feishuUserId; updateSet.feishuUserId = user.feishuUserId; }
  if (user.feishuUnionId !== undefined) { values.feishuUnionId = user.feishuUnionId; updateSet.feishuUnionId = user.feishuUnionId; }
  if (user.avatar !== undefined) { values.avatar = user.avatar; updateSet.avatar = user.avatar; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

// ==================== COMPANIES ====================
export async function getCompanyStats() {
  const db = await getDb();
  if (!db) return { total: 0, countries: 0, continents: 0, chinaImporters: 0, continentDistribution: [] };
  const [t] = await db.select({ cnt: count() }).from(companies);
  const [co] = await db.select({ cnt: sql<number>`COUNT(DISTINCT country)` }).from(companies);
  const [cn] = await db.select({ cnt: sql<number>`COUNT(DISTINCT continent)` }).from(companies);
  const [ch] = await db.select({ cnt: count() }).from(companies).where(eq(companies.hasPurchasedFromChina, '是'));
  const dist = await db.select({ continent: companies.continent, count: count() }).from(companies).groupBy(companies.continent).orderBy(desc(count()));
  return { total: t.cnt, countries: co.cnt, continents: cn.cnt, chinaImporters: ch.cnt, continentDistribution: dist };
}

export async function getCountryStats() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ country: companies.country, continent: companies.continent, count: count() })
    .from(companies).groupBy(companies.country, companies.continent).orderBy(desc(count()));
}

export async function getCityStats() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    country: companies.country,
    city: companies.city,
    latitude: companies.latitude,
    longitude: companies.longitude,
    count: count()
  }).from(companies)
    .where(and(isNotNull(companies.latitude), isNotNull(companies.city)))
    .groupBy(companies.country, companies.city, companies.latitude, companies.longitude)
    .orderBy(desc(count()));
}

export async function getCompaniesByCity(country: string, city: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: companies.id,
    companyName: companies.companyName,
    country: companies.country,
    city: companies.city,
    coreRole: companies.coreRole,
    mainProducts: companies.mainProducts,
    hasPurchasedFromChina: companies.hasPurchasedFromChina,
    latitude: companies.latitude,
    longitude: companies.longitude,
  }).from(companies)
    .where(and(eq(companies.country, country), eq(companies.city, city)))
    .orderBy(asc(companies.id));
}

export async function getMapCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: companies.id,
    companyName: companies.companyName,
    country: companies.country,
    city: companies.city,
    latitude: companies.latitude,
    longitude: companies.longitude,
    coreRole: companies.coreRole,
    mainProducts: companies.mainProducts,
    hasPurchasedFromChina: companies.hasPurchasedFromChina,
  }).from(companies)
    .where(isNotNull(companies.latitude))
    .orderBy(asc(companies.country), asc(companies.city));
}

export async function searchCompanies(opts: {
  query?: string; continent?: string; country?: string; role?: string; chinaOnly?: boolean; page?: number; pageSize?: number;
}) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const { query, continent, country, role, chinaOnly, page = 1, pageSize = 50 } = opts;
  const conds = [];
  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    conds.push(or(like(companies.companyName, q), like(companies.country, q), like(companies.mainProducts, q), like(companies.coreRole, q), like(companies.companyProfile, q)));
  }
  if (continent) conds.push(eq(companies.continent, continent));
  if (country) conds.push(eq(companies.country, country));
  if (role) conds.push(like(companies.coreRole, `%${role}%`));
  if (chinaOnly) conds.push(eq(companies.hasPurchasedFromChina, '是'));
  const where = conds.length > 0 ? and(...conds) : undefined;
  const [totalR] = await db.select({ cnt: count() }).from(companies).where(where);
  const data = await db.select().from(companies).where(where).orderBy(asc(companies.id)).limit(pageSize).offset((page - 1) * pageSize);
  return { data, total: totalR.cnt };
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return r[0] || null;
}

export async function getCompaniesByContinent(continent: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).where(eq(companies.continent, continent)).orderBy(asc(companies.country), asc(companies.id));
}

export async function getCompaniesByCountry(country: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).where(eq(companies.country, country)).orderBy(asc(companies.id));
}

// ==================== FAVORITES ====================
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(favorites).innerJoin(companies, eq(favorites.companyId, companies.id))
    .where(eq(favorites.userId, userId)).orderBy(desc(favorites.updatedAt));
}

export async function addFavorite(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return;
  const ex = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.companyId, companyId))).limit(1);
  if (ex.length > 0) return ex[0];
  await db.insert(favorites).values({ userId, companyId });
}

export async function removeFavorite(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.companyId, companyId)));
}

export async function updateFavorite(userId: number, companyId: number, data: { followUpStatus?: string; followUpDate?: Date | null; notes?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(favorites).set(data as any).where(and(eq(favorites.userId, userId), eq(favorites.companyId, companyId)));
}

export async function getUserFavoriteIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const r = await db.select({ companyId: favorites.companyId }).from(favorites).where(eq(favorites.userId, userId));
  return r.map(x => x.companyId);
}

// ==================== TEAMS ====================
export async function createTeam(name: string, ownerId: number, inviteCode: string) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.insert(teams).values({ name, ownerId, inviteCode });
  const teamId = Number(r[0].insertId);
  await db.insert(teamMembers).values({ teamId, userId: ownerId, role: 'owner' });
  return teamId;
}

export async function joinTeam(inviteCode: string, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const t = await db.select().from(teams).where(eq(teams.inviteCode, inviteCode)).limit(1);
  if (!t.length) return null;
  const ex = await db.select().from(teamMembers).where(and(eq(teamMembers.teamId, t[0].id), eq(teamMembers.userId, userId))).limit(1);
  if (ex.length) return t[0].id;
  await db.insert(teamMembers).values({ teamId: t[0].id, userId, role: 'member' });
  return t[0].id;
}

export async function getUserTeams(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ team: teams, membership: teamMembers }).from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(eq(teamMembers.userId, userId));
}

export async function getTeamMembers(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ member: teamMembers, user: users }).from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id)).where(eq(teamMembers.teamId, teamId));
}

export async function leaveTeam(teamId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
}

export async function deleteTeam(teamId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teamSharedCompanies).where(eq(teamSharedCompanies.teamId, teamId));
  await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
  await db.delete(teams).where(eq(teams.id, teamId));
}

// ==================== TEAM SHARED ====================
export async function shareCompanyToTeam(teamId: number, companyId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const ex = await db.select().from(teamSharedCompanies).where(and(eq(teamSharedCompanies.teamId, teamId), eq(teamSharedCompanies.companyId, companyId))).limit(1);
  if (ex.length) return;
  await db.insert(teamSharedCompanies).values({ teamId, companyId, sharedByUserId: userId });
}

export async function getTeamSharedCompanies(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamSharedCompanies)
    .innerJoin(companies, eq(teamSharedCompanies.companyId, companies.id))
    .innerJoin(users, eq(teamSharedCompanies.sharedByUserId, users.id))
    .where(eq(teamSharedCompanies.teamId, teamId)).orderBy(desc(teamSharedCompanies.updatedAt));
}

export async function updateTeamSharedCompany(id: number, userId: number, data: { followUpStatus?: string; notes?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(teamSharedCompanies).set({ ...data as any, lastUpdatedByUserId: userId }).where(eq(teamSharedCompanies.id, id));
}

// ==================== INQUIRY TEMPLATES ====================
export async function getInquiryTemplate(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(inquiryTemplates).where(eq(inquiryTemplates.userId, userId)).limit(1);
  return r[0] || null;
}

export async function upsertInquiryTemplate(userId: number, data: any) {
  const db = await getDb();
  if (!db) return;
  const ex = await db.select().from(inquiryTemplates).where(eq(inquiryTemplates.userId, userId)).limit(1);
  if (ex.length) await db.update(inquiryTemplates).set(data).where(eq(inquiryTemplates.userId, userId));
  else await db.insert(inquiryTemplates).values({ userId, ...data });
}

// ==================== EMAIL ====================
export async function addEmailHistory(data: { userId: number; companyId?: number; recipients: string; subject?: string; body?: string; sendType?: string; status?: string; internalNote?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(emailHistory).values(data as any);
}

export async function getEmailHistory(userId: number, page = 1, pageSize = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const [t] = await db.select({ cnt: count() }).from(emailHistory).where(eq(emailHistory.userId, userId));
  const data = await db.select().from(emailHistory).where(eq(emailHistory.userId, userId)).orderBy(desc(emailHistory.sentAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { data, total: t.cnt };
}

// ==================== ADMIN ====================
export async function updateCompany(id: number, data: Record<string, any>) {
  const db = await getDb();
  if (!db) return;
  await db.update(companies).set(data).where(eq(companies.id, id));
}

export async function deleteCompany(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(companies).where(eq(companies.id, id));
}

export async function createCompany(data: any) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.insert(companies).values(data);
  return Number(r[0].insertId);
}

export async function addAuditLog(userId: number, action: string, targetTable?: string, targetId?: number, details?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({ userId, action, targetTable, targetId, details });
}

export async function getAuditLogs(page = 1, pageSize = 50) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const [t] = await db.select({ cnt: count() }).from(auditLogs);
  const data = await db.select().from(auditLogs).innerJoin(users, eq(auditLogs.userId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { data, total: t.cnt };
}

// ==================== COMPANY CONTACTS (V2.0) ====================
export async function getCompanyContacts(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyContacts).where(eq(companyContacts.companyId, companyId)).orderBy(desc(companyContacts.isPrimary), asc(companyContacts.id));
}

export async function addCompanyContact(data: { companyId: number; name: string; title?: string; email?: string; phone?: string; linkedin?: string; isPrimary?: boolean; addedByUserId?: number }) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.insert(companyContacts).values(data as any);
  return Number(r[0].insertId);
}

export async function updateCompanyContact(id: number, data: Record<string, any>) {
  const db = await getDb();
  if (!db) return;
  await db.update(companyContacts).set(data).where(eq(companyContacts.id, id));
}

export async function deleteCompanyContact(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(companyContacts).where(eq(companyContacts.id, id));
}

// ==================== CREDIT RATINGS (V2.0) ====================
export async function getCompanyCreditRating(companyId: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(companyCreditRatings).where(eq(companyCreditRatings.companyId, companyId)).limit(1);
  return r[0] || null;
}

export async function upsertCreditRating(companyId: number, data: { registeredCapital?: string; foundedYear?: number; importFrequency?: string; cooperationHistory?: string; creditScore?: number; ratedByUserId?: number }) {
  const db = await getDb();
  if (!db) return;
  const ex = await db.select().from(companyCreditRatings).where(eq(companyCreditRatings.companyId, companyId)).limit(1);
  if (ex.length) await db.update(companyCreditRatings).set(data as any).where(eq(companyCreditRatings.companyId, companyId));
  else await db.insert(companyCreditRatings).values({ companyId, ...data } as any);
}

// ==================== CUSTOMER LIFECYCLE (V2.0) ====================
export async function getLifecycleFunnel(userId: number) {
  const db = await getDb();
  if (!db) return { stages: [], items: [] };
  const items = await db.select().from(customerLifecycle)
    .innerJoin(companies, eq(customerLifecycle.companyId, companies.id))
    .where(eq(customerLifecycle.userId, userId))
    .orderBy(desc(customerLifecycle.movedAt));
  const stages = await db.select({ stage: customerLifecycle.stage, cnt: count() })
    .from(customerLifecycle).where(eq(customerLifecycle.userId, userId))
    .groupBy(customerLifecycle.stage);
  return { stages, items };
}

export async function addToLifecycle(userId: number, companyId: number, stage: string, data?: { dealValue?: string; expectedCloseDate?: Date; notes?: string }) {
  const db = await getDb();
  if (!db) return null;
  const ex = await db.select().from(customerLifecycle).where(and(eq(customerLifecycle.userId, userId), eq(customerLifecycle.companyId, companyId))).limit(1);
  if (ex.length) {
    await db.update(customerLifecycle).set({ stage: stage as any, movedAt: new Date(), ...data } as any)
      .where(and(eq(customerLifecycle.userId, userId), eq(customerLifecycle.companyId, companyId)));
    return ex[0].id;
  }
  const r = await db.insert(customerLifecycle).values({ userId, companyId, stage: stage as any, ...data } as any);
  return Number(r[0].insertId);
}

export async function removeFromLifecycle(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(customerLifecycle).where(and(eq(customerLifecycle.userId, userId), eq(customerLifecycle.companyId, companyId)));
}

// ==================== A/B TEST (V2.0) ====================
export async function getUserAbTests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(abTestTemplates).where(eq(abTestTemplates.userId, userId)).orderBy(desc(abTestTemplates.createdAt));
}

export async function createAbTest(userId: number, data: { name: string; variantA_subject?: string; variantA_body?: string; variantB_subject?: string; variantB_body?: string }) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.insert(abTestTemplates).values({ userId, ...data } as any);
  return Number(r[0].insertId);
}

export async function updateAbTestStats(id: number, variant: 'A' | 'B', field: 'sent' | 'opened' | 'replied') {
  const db = await getDb();
  if (!db) return;
  const col = `variant${variant}_${field}` as any;
  await db.update(abTestTemplates).set({ [col]: sql`${sql.identifier(col)} + 1` } as any).where(eq(abTestTemplates.id, id));
}

export async function deleteAbTest(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(abTestTemplates).where(eq(abTestTemplates.id, id));
}

// ==================== TEAM REGION ACCESS (V2.0) ====================
export async function getTeamRegionAccess(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamRegionAccess).where(eq(teamRegionAccess.teamId, teamId));
}

export async function setTeamRegionAccess(teamId: number, regions: { continent?: string; country?: string }[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teamRegionAccess).where(eq(teamRegionAccess.teamId, teamId));
  if (regions.length > 0) {
    await db.insert(teamRegionAccess).values(regions.map(r => ({ teamId, ...r })) as any);
  }
}

// ==================== BACKUP RECORDS (V2.0) ====================
export async function addBackupRecord(data: { fileName: string; fileUrl?: string; fileSize?: number; recordCount?: number; backupType?: string; createdByUserId?: number }) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.insert(backupRecords).values(data as any);
  return Number(r[0].insertId);
}

export async function getBackupRecords(page = 1, pageSize = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const [t] = await db.select({ cnt: count() }).from(backupRecords);
  const data = await db.select().from(backupRecords).orderBy(desc(backupRecords.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { data, total: t.cnt };
}

// ==================== DATA EXPORT (V2.0) ====================
export async function exportCompanies(opts: { continent?: string; country?: string; role?: string; chinaOnly?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conds = [];
  if (opts.continent) conds.push(eq(companies.continent, opts.continent));
  if (opts.country) conds.push(eq(companies.country, opts.country));
  if (opts.role) conds.push(like(companies.coreRole, `%${opts.role}%`));
  if (opts.chinaOnly) conds.push(eq(companies.hasPurchasedFromChina, '是'));
  const where = conds.length > 0 ? and(...conds) : undefined;
  return db.select().from(companies).where(where).orderBy(asc(companies.id));
}

export async function exportFavorites(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conds = [eq(favorites.userId, userId)];
  if (status) conds.push(eq(favorites.followUpStatus, status as any));
  return db.select().from(favorites).innerJoin(companies, eq(favorites.companyId, companies.id))
    .where(and(...conds)).orderBy(desc(favorites.updatedAt));
}

// ==================== SMTP ====================
export async function getSmtpConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(smtpConfigs).where(eq(smtpConfigs.userId, userId)).limit(1);
  return r[0] || null;
}

export async function upsertSmtpConfig(userId: number, data: any) {
  const db = await getDb();
  if (!db) return;
  const ex = await db.select().from(smtpConfigs).where(eq(smtpConfigs.userId, userId)).limit(1);
  if (ex.length) await db.update(smtpConfigs).set(data).where(eq(smtpConfigs.userId, userId));
  else await db.insert(smtpConfigs).values({ userId, ...data });
}

// ==================== LIFECYCLE WITH CREDIT (V2.1) ====================
export async function getLifecycleFunnelWithCredit(userId: number, filters?: { minCreditScore?: number; maxCreditScore?: number }) {
  const db = await getDb();
  if (!db) return { stages: [], items: [] };

  // Get all lifecycle items with company info
  let items = await db.select().from(customerLifecycle)
    .innerJoin(companies, eq(customerLifecycle.companyId, companies.id))
    .where(eq(customerLifecycle.userId, userId))
    .orderBy(desc(customerLifecycle.movedAt));

  // If credit score filters are provided, fetch credit ratings and filter
  if (filters?.minCreditScore !== undefined || filters?.maxCreditScore !== undefined) {
    const companyIds = items.map((i: any) => i.customer_lifecycle.companyId);
    if (companyIds.length === 0) return { stages: [], items: [] };

    const creditRatings = await db.select().from(companyCreditRatings)
      .where(sql`${companyCreditRatings.companyId} IN (${sql.join(companyIds.map(id => sql`${id}`), sql`, `)})`);

    const creditMap = new Map(creditRatings.map(cr => [cr.companyId, cr]));

    items = items.filter((item: any) => {
      const credit = creditMap.get(item.customer_lifecycle.companyId);
      const score = credit?.creditScore ?? 0;
      if (filters.minCreditScore !== undefined && score < filters.minCreditScore) return false;
      if (filters.maxCreditScore !== undefined && score > filters.maxCreditScore) return false;
      return true;
    });

    // Attach credit info to items
    items = items.map((item: any) => ({
      ...item,
      creditRating: creditMap.get(item.customer_lifecycle.companyId) || null,
    }));
  }

  // Calculate stage counts from filtered items
  const stageCounts: Record<string, number> = {};
  items.forEach((item: any) => {
    const stage = item.customer_lifecycle.stage;
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  });
  const stages = Object.entries(stageCounts).map(([stage, cnt]) => ({ stage, cnt }));

  return { stages, items };
}

// ==================== POULTRY TRADE DATA (V2.1) ====================
export async function getPoultryTradeData(year?: number) {
  const db = await getDb();
  if (!db) return [];
  const conds = [];
  if (year) conds.push(eq(poultryTradeData.year, year));
  const where = conds.length > 0 ? and(...conds) : undefined;
  return db.select().from(poultryTradeData).where(where)
    .orderBy(desc(sql`CAST(${poultryTradeData.importValueUsd} AS DECIMAL)`));
}

export async function getPoultryTradeTrends(country?: string) {
  const db = await getDb();
  if (!db) return [];
  const conds = [];
  if (country) conds.push(eq(poultryTradeData.country, country));
  const where = conds.length > 0 ? and(...conds) : undefined;
  return db.select().from(poultryTradeData).where(where)
    .orderBy(asc(poultryTradeData.year), asc(poultryTradeData.country));
}

export async function insertPoultryTradeData(data: {
  country: string; countryCode?: string; year: number;
  importValueUsd?: string; importQuantityTons?: string; unitPriceUsd?: string;
  yoyChange?: string; hsCode?: string; source?: string;
}[]) {
  const db = await getDb();
  if (!db) return;
  if (data.length > 0) {
    await db.insert(poultryTradeData).values(data as any);
  }
}

// ==================== TRADE DATA ANNUAL SUMMARY (V3.0) ====================
export async function getTradeAnnualSummary() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    year: poultryTradeData.year,
    totalValue: sql<string>`SUM(CAST(${poultryTradeData.importValueUsd} AS DECIMAL(20,2)))`,
    totalQuantity: sql<string>`SUM(CAST(${poultryTradeData.importQuantityTons} AS DECIMAL(20,2)))`,
    avgUnitPrice: sql<string>`AVG(CAST(${poultryTradeData.unitPriceUsd} AS DECIMAL(10,4)))`,
    countryCount: sql<number>`COUNT(DISTINCT ${poultryTradeData.country})`,
  }).from(poultryTradeData)
    .groupBy(poultryTradeData.year)
    .orderBy(asc(poultryTradeData.year));
}

export async function getTradeTopCountriesByYear(year: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(poultryTradeData)
    .where(eq(poultryTradeData.year, year))
    .orderBy(desc(sql`CAST(${poultryTradeData.importValueUsd} AS DECIMAL(20,2))`))
    .limit(limit);
}

// ==================== AI RECOMMEND EXCLUSIONS (V2.3) ====================
export async function getAiExclusions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiRecommendExclusions).where(eq(aiRecommendExclusions.userId, userId));
}

export async function addAiExclusion(userId: number, companyId: number, reason?: string) {
  const db = await getDb();
  if (!db) return null;
  const ex = await db.select().from(aiRecommendExclusions)
    .where(and(eq(aiRecommendExclusions.userId, userId), eq(aiRecommendExclusions.companyId, companyId))).limit(1);
  if (ex.length) return ex[0].id;
  const r = await db.insert(aiRecommendExclusions).values({ userId, companyId, reason } as any);
  return Number(r[0].insertId);
}

export async function removeAiExclusion(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(aiRecommendExclusions).where(and(eq(aiRecommendExclusions.userId, userId), eq(aiRecommendExclusions.companyId, companyId)));
}

// ==================== TODO ITEMS (V2.3) ====================
export async function getUserTodoItems(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conds = [eq(todoItems.userId, userId)];
  if (status) conds.push(eq(todoItems.status, status as any));
  return db.select().from(todoItems).where(and(...conds)).orderBy(desc(todoItems.createdAt));
}

export async function addTodoItem(data: { userId: number; title: string; description?: string; source?: string; sourceId?: string; priority?: string; dueDate?: Date }) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.insert(todoItems).values(data as any);
  return Number(r[0].insertId);
}

export async function updateTodoItem(id: number, userId: number, data: { title?: string; description?: string; priority?: string; status?: string; dueDate?: Date | null; completedAt?: Date | null }) {
  const db = await getDb();
  if (!db) return;
  await db.update(todoItems).set(data as any).where(and(eq(todoItems.id, id), eq(todoItems.userId, userId)));
}

export async function deleteTodoItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(todoItems).where(and(eq(todoItems.id, id), eq(todoItems.userId, userId)));
}

// ==================== EMAIL BATCH JOBS (V2.3) ====================
export async function createEmailBatchJob(data: { userId: number; abTestId?: number; totalRecipients: number; recipientsJson: string }) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.insert(emailBatchJobs).values(data as any);
  return Number(r[0].insertId);
}

export async function getEmailBatchJobs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailBatchJobs).where(eq(emailBatchJobs.userId, userId)).orderBy(desc(emailBatchJobs.createdAt));
}

export async function getEmailBatchJob(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(emailBatchJobs).where(eq(emailBatchJobs.id, id)).limit(1);
  return r[0] || null;
}

export async function updateEmailBatchJob(id: number, data: { status?: string; sentCount?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(emailBatchJobs).set(data as any).where(eq(emailBatchJobs.id, id));
}

// ===== V2.4: 每周全球市场分析报告 =====
export async function getWeeklyReports(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const data = await db.select().from(weeklyMarketReports).orderBy(desc(weeklyMarketReports.reportDate)).limit(limit).offset(offset);
  const [{ cnt }] = await db.select({ cnt: count() }).from(weeklyMarketReports);
  return { data, total: cnt };
}

export async function getWeeklyReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [report] = await db.select().from(weeklyMarketReports).where(eq(weeklyMarketReports.id, id));
  return report || null;
}

export async function getLatestWeeklyReport() {
  const db = await getDb();
  if (!db) return null;
  const [report] = await db.select().from(weeklyMarketReports).where(eq(weeklyMarketReports.status, "completed")).orderBy(desc(weeklyMarketReports.reportDate)).limit(1);
  return report || null;
}

export async function getWeeklyReportByWeek(weekLabel: string) {
  const db = await getDb();
  if (!db) return null;
  const [report] = await db.select().from(weeklyMarketReports).where(eq(weeklyMarketReports.weekLabel, weekLabel));
  return report || null;
}

export async function createWeeklyReport(data: { weekLabel: string; reportDate: Date; generatedByUserId?: number }) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.insert(weeklyMarketReports).values({
    weekLabel: data.weekLabel,
    reportDate: data.reportDate,
    status: "generating",
    generatedByUserId: data.generatedByUserId || null,
  });
  return result.insertId;
}

export async function updateWeeklyReport(id: number, data: Partial<{
  status: "generating" | "completed" | "failed";
  part1_macroLandscape: string;
  part2_priceVerification: string;
  part3_logisticsAlerts: string;
  part4_keyAccountGuide: string;
  part5_riskControl: string;
  part6_actionItems: string;
  references: string;
}>) {
  const db = await getDb();
  if (!db) return;
  await db.update(weeklyMarketReports).set(data).where(eq(weeklyMarketReports.id, id));
}

export async function deleteWeeklyReport(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(weeklyMarketReports).where(eq(weeklyMarketReports.id, id));
}


// ==================== V2.5: TEAM ACTIVITIES ====================
export async function addTeamActivity(data: {
  teamId: number; userId: number; userName?: string;
  actionType: string; targetType?: string; targetId?: number; targetName?: string; details?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(teamActivities).values(data as any);
}

export async function getTeamActivities(teamId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamActivities)
    .where(eq(teamActivities.teamId, teamId))
    .orderBy(desc(teamActivities.createdAt))
    .limit(limit).offset(offset);
}

// ==================== V2.5: COMPANY CHANGE HISTORY ====================
export async function addCompanyChangeHistory(data: {
  companyId: number; userId: number; userName?: string;
  fieldName: string; oldValue?: string; newValue?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(companyChangeHistory).values(data as any);
}

export async function getCompanyChangeHistory(companyId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyChangeHistory)
    .where(eq(companyChangeHistory.companyId, companyId))
    .orderBy(desc(companyChangeHistory.createdAt))
    .limit(limit);
}

// ==================== V2.5: SIMILAR COMPANIES ====================
export async function getSimilarCompanies(companyId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  // Get the target company first
  const [target] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!target) return [];
  // Find companies in same country with same role, excluding self
  const results = await db.select().from(companies)
    .where(
      and(
        ne(companies.id, companyId),
        or(
          eq(companies.country, target.country),
          target.coreRole ? eq(companies.coreRole, target.coreRole) : undefined
        )
      )
    )
    .limit(limit);
  return results;
}

// ==================== V2.5: ADVANCED SEARCH ====================
export async function advancedSearchCompanies(input: {
  query?: string; continent?: string; country?: string; role?: string; chinaOnly?: boolean;
  minCreditScore?: number; maxCreditScore?: number; hasContacts?: boolean; hasLinkedin?: boolean;
  page?: number; pageSize?: number;
}) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const page = input.page || 1;
  const pageSize = input.pageSize || 30;
  const offset = (page - 1) * pageSize;

  const conditions: any[] = [];
  if (input.query) conditions.push(or(
    like(companies.companyName, `%${input.query}%`),
    like(companies.country, `%${input.query}%`),
    like(companies.mainProducts, `%${input.query}%`)
  ));
  if (input.continent) conditions.push(eq(companies.continent, input.continent));
  if (input.country) conditions.push(eq(companies.country, input.country));
  if (input.role) conditions.push(eq(companies.coreRole, input.role));
  if (input.chinaOnly) conditions.push(eq(companies.hasPurchasedFromChina, "是"));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let results = await db.select().from(companies).where(whereClause).limit(pageSize * 5).offset(0);

  // Post-filter for credit score and contacts (requires joins)
  if (input.minCreditScore !== undefined || input.maxCreditScore !== undefined) {
    const creditRatings = await db.select().from(companyCreditRatings);
    const creditMap = new Map(creditRatings.map(c => [c.companyId, c.creditScore || 0]));
    results = results.filter(c => {
      const score = creditMap.get(c.id) || 0;
      if (input.minCreditScore !== undefined && score < input.minCreditScore) return false;
      if (input.maxCreditScore !== undefined && score > input.maxCreditScore) return false;
      return true;
    });
  }

  if (input.hasContacts) {
    const contactCounts = await db.select({ companyId: companyContacts.companyId }).from(companyContacts);
    const contactSet = new Set(contactCounts.map(c => c.companyId));
    results = results.filter(c => contactSet.has(c.id));
  }

  if (input.hasLinkedin) {
    const linkedinContacts = await db.select({ companyId: companyContacts.companyId }).from(companyContacts)
      .where(and(sql`${companyContacts.linkedin} IS NOT NULL`, sql`${companyContacts.linkedin} != ''`));
    const linkedinSet = new Set(linkedinContacts.map(c => c.companyId));
    results = results.filter(c => linkedinSet.has(c.id));
  }

  const total = results.length;
  const paged = results.slice(offset, offset + pageSize);
  return { data: paged, total };
}

// ==================== V2.5: FOLLOW-UP REMINDERS ====================
export async function getUpcomingReminders(userId: number, days = 7) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return db.select({
    favoriteId: favorites.id,
    companyId: favorites.companyId,
    followUpStatus: favorites.followUpStatus,
    followUpDate: favorites.followUpDate,
    notes: favorites.notes,
    companyName: companies.companyName,
    country: companies.country,
    continent: companies.continent,
  }).from(favorites)
    .innerJoin(companies, eq(favorites.companyId, companies.id))
    .where(
      and(
        eq(favorites.userId, userId),
        sql`${favorites.followUpDate} IS NOT NULL`,
        sql`${favorites.followUpDate} >= ${now}`,
        sql`${favorites.followUpDate} <= ${futureDate}`
      )
    )
    .orderBy(asc(favorites.followUpDate));
}


// ==================== PRODUCTION REGIONS ====================
export async function getAllProductionRegions() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: productionRegions.id,
    code: productionRegions.code,
    name: productionRegions.name,
    nameEn: productionRegions.nameEn,
    flagEmoji: productionRegions.flagEmoji,
    annualProductionMt: productionRegions.annualProductionMt,
    annualExportMt: productionRegions.annualExportMt,
    globalProductionRank: productionRegions.globalProductionRank,
    globalExportRank: productionRegions.globalExportRank,
    mainProducingAreas: productionRegions.mainProducingAreas,
    topCompanies: productionRegions.topCompanies,
    industryStatus: productionRegions.industryStatus,
    statusDescription: productionRegions.statusDescription,
    keyAdvantages: productionRegions.keyAdvantages,
    halalCertification: productionRegions.halalCertification,
    heatTreatmentCapability: productionRegions.heatTreatmentCapability,
    dataYear: productionRegions.dataYear,
    dataSources: productionRegions.dataSources,
  }).from(productionRegions).orderBy(asc(productionRegions.globalProductionRank));
}

export async function getProductionRegionByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    id: productionRegions.id,
    code: productionRegions.code,
    name: productionRegions.name,
    nameEn: productionRegions.nameEn,
    flagEmoji: productionRegions.flagEmoji,
    annualProductionMt: productionRegions.annualProductionMt,
    annualExportMt: productionRegions.annualExportMt,
    globalProductionRank: productionRegions.globalProductionRank,
    globalExportRank: productionRegions.globalExportRank,
    mainProducingAreas: productionRegions.mainProducingAreas,
    topCompanies: productionRegions.topCompanies,
    industryStatus: productionRegions.industryStatus,
    statusDescription: productionRegions.statusDescription,
    keyAdvantages: productionRegions.keyAdvantages,
    halalCertification: productionRegions.halalCertification,
    heatTreatmentCapability: productionRegions.heatTreatmentCapability,
    dataYear: productionRegions.dataYear,
    dataSources: productionRegions.dataSources,
  }).from(productionRegions).where(eq(productionRegions.code, code)).limit(1);
  return result[0] ?? undefined;
}

export async function getRegionMarketPricesByCode(regionCode: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: regionMarketPrices.id,
    regionCode: regionMarketPrices.regionCode,
    date: regionMarketPrices.date,
    productType: regionMarketPrices.productType,
    productLabel: regionMarketPrices.productLabel,
    price: regionMarketPrices.price,
    unit: regionMarketPrices.unit,
    priceUsd: regionMarketPrices.priceUsd,
    trend: regionMarketPrices.trend,
    changePercent: regionMarketPrices.changePercent,
    source: regionMarketPrices.source,
  }).from(regionMarketPrices)
    .where(eq(regionMarketPrices.regionCode, regionCode))
    .orderBy(desc(regionMarketPrices.date))
    .limit(limit);
}

export async function getRegionDiseaseAlertsByCode(regionCode: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: regionDiseaseAlerts.id,
    regionCode: regionDiseaseAlerts.regionCode,
    date: regionDiseaseAlerts.date,
    diseaseType: regionDiseaseAlerts.diseaseType,
    location: regionDiseaseAlerts.location,
    impactLevel: regionDiseaseAlerts.impactLevel,
    affectedBirds: regionDiseaseAlerts.affectedBirds,
    tradeImpact: regionDiseaseAlerts.tradeImpact,
    description: regionDiseaseAlerts.description,
    source: regionDiseaseAlerts.source,
    sourceUrl: regionDiseaseAlerts.sourceUrl,
  }).from(regionDiseaseAlerts)
    .where(eq(regionDiseaseAlerts.regionCode, regionCode))
    .orderBy(desc(regionDiseaseAlerts.date))
    .limit(limit);
}

export async function getRegionIndustryNewsByCode(regionCode: string, category?: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(regionIndustryNews.regionCode, regionCode)];
  if (category && category !== 'all') {
    conditions.push(eq(regionIndustryNews.category, category));
  }
  return db.select({
    id: regionIndustryNews.id,
    regionCode: regionIndustryNews.regionCode,
    date: regionIndustryNews.date,
    category: regionIndustryNews.category,
    title: regionIndustryNews.title,
    summary: regionIndustryNews.summary,
    content: regionIndustryNews.content,
    importance: regionIndustryNews.importance,
    source: regionIndustryNews.source,
    sourceUrl: regionIndustryNews.sourceUrl,
    tags: regionIndustryNews.tags,
  }).from(regionIndustryNews)
    .where(and(...conditions))
    .orderBy(desc(regionIndustryNews.date))
    .limit(limit);
}

export async function getGlobalDiseaseAlerts(limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: regionDiseaseAlerts.id,
    regionCode: regionDiseaseAlerts.regionCode,
    date: regionDiseaseAlerts.date,
    diseaseType: regionDiseaseAlerts.diseaseType,
    location: regionDiseaseAlerts.location,
    impactLevel: regionDiseaseAlerts.impactLevel,
    affectedBirds: regionDiseaseAlerts.affectedBirds,
    tradeImpact: regionDiseaseAlerts.tradeImpact,
    description: regionDiseaseAlerts.description,
    source: regionDiseaseAlerts.source,
    sourceUrl: regionDiseaseAlerts.sourceUrl,
  }).from(regionDiseaseAlerts)
    .orderBy(desc(regionDiseaseAlerts.date))
    .limit(limit);
}

// ==================== V3.1: 分区域报价 ====================
export async function getRegionSubAreaPrices(regionCode: string, limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: regionSubAreaPrices.id,
    regionCode: regionSubAreaPrices.regionCode,
    subArea: regionSubAreaPrices.subArea,
    subAreaLocal: regionSubAreaPrices.subAreaLocal,
    date: regionSubAreaPrices.date,
    productType: regionSubAreaPrices.productType,
    productLabel: regionSubAreaPrices.productLabel,
    price: regionSubAreaPrices.price,
    unit: regionSubAreaPrices.unit,
    priceUsd: regionSubAreaPrices.priceUsd,
    trend: regionSubAreaPrices.trend,
    changePercent: regionSubAreaPrices.changePercent,
    source: regionSubAreaPrices.source,
  }).from(regionSubAreaPrices)
    .where(eq(regionSubAreaPrices.regionCode, regionCode))
    .orderBy(desc(regionSubAreaPrices.date))
    .limit(limit);
}

// ==================== V3.1: 饲料原料价格 ====================
export async function getRegionFeedPrices(regionCode: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: regionFeedPrices.id,
    regionCode: regionFeedPrices.regionCode,
    date: regionFeedPrices.date,
    feedType: regionFeedPrices.feedType,
    feedLabel: regionFeedPrices.feedLabel,
    price: regionFeedPrices.price,
    unit: regionFeedPrices.unit,
    priceUsd: regionFeedPrices.priceUsd,
    trend: regionFeedPrices.trend,
    changePercent: regionFeedPrices.changePercent,
    source: regionFeedPrices.source,
  }).from(regionFeedPrices)
    .where(eq(regionFeedPrices.regionCode, regionCode))
    .orderBy(desc(regionFeedPrices.date))
    .limit(limit);
}

// ==================== V3.1: 疫病知识库 ====================
export async function getRegionDiseaseLibrary(regionCode?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (regionCode) {
    conditions.push(
      or(eq(regionDiseaseLibrary.regionCode, regionCode), isNull(regionDiseaseLibrary.regionCode))
    );
  }
  return db.select({
    id: regionDiseaseLibrary.id,
    regionCode: regionDiseaseLibrary.regionCode,
    diseaseCategory: regionDiseaseLibrary.diseaseCategory,
    diseaseName: regionDiseaseLibrary.diseaseName,
    diseaseNameEn: regionDiseaseLibrary.diseaseNameEn,
    pathogen: regionDiseaseLibrary.pathogen,
    symptoms: regionDiseaseLibrary.symptoms,
    pathologicalChanges: regionDiseaseLibrary.pathologicalChanges,
    diagnosis: regionDiseaseLibrary.diagnosis,
    prevention: regionDiseaseLibrary.prevention,
    treatment: regionDiseaseLibrary.treatment,
    vaccineInfo: regionDiseaseLibrary.vaccineInfo,
    seasonalRisk: regionDiseaseLibrary.seasonalRisk,
    prevalenceLevel: regionDiseaseLibrary.prevalenceLevel,
    economicImpact: regionDiseaseLibrary.economicImpact,
    source: regionDiseaseLibrary.source,
  }).from(regionDiseaseLibrary)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(regionDiseaseLibrary.diseaseCategory), asc(regionDiseaseLibrary.diseaseName));
}

// ==================== V3.1: 产区政策法规 ====================
export async function getRegionPolicies(regionCode: string, policyType?: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(regionPolicies.regionCode, regionCode)];
  if (policyType && policyType !== 'all') {
    conditions.push(eq(regionPolicies.policyType, policyType));
  }
  return db.select({
    id: regionPolicies.id,
    regionCode: regionPolicies.regionCode,
    date: regionPolicies.date,
    policyType: regionPolicies.policyType,
    policyLabel: regionPolicies.policyLabel,
    title: regionPolicies.title,
    summary: regionPolicies.summary,
    content: regionPolicies.content,
    impactOnTrade: regionPolicies.impactOnTrade,
    effectiveDate: regionPolicies.effectiveDate,
    status: regionPolicies.status,
    source: regionPolicies.source,
    sourceUrl: regionPolicies.sourceUrl,
  }).from(regionPolicies)
    .where(and(...conditions))
    .orderBy(desc(regionPolicies.date))
    .limit(limit);
}

// ==================== V3.1: 龙头企业档案 ====================
export async function getRegionCompanyProfiles(regionCode: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: regionCompanyProfiles.id,
    regionCode: regionCompanyProfiles.regionCode,
    companyName: regionCompanyProfiles.companyName,
    companyNameLocal: regionCompanyProfiles.companyNameLocal,
    companyType: regionCompanyProfiles.companyType,
    annualCapacityMt: regionCompanyProfiles.annualCapacityMt,
    annualRevenue: regionCompanyProfiles.annualRevenue,
    employeeCount: regionCompanyProfiles.employeeCount,
    exportMarkets: regionCompanyProfiles.exportMarkets,
    certifications: regionCompanyProfiles.certifications,
    recentNews: regionCompanyProfiles.recentNews,
    website: regionCompanyProfiles.website,
    description: regionCompanyProfiles.description,
  }).from(regionCompanyProfiles)
    .where(eq(regionCompanyProfiles.regionCode, regionCode))
    .orderBy(asc(regionCompanyProfiles.companyName));
}


// ==================== V4.0: Market Insights 市场洞察 ====================

// 获取当前周标识
export function getCurrentWeekLabel(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// 获取最新一期头条（按周）
export async function getWeeklyHeadlines(week?: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  if (week) {
    return db.select().from(weeklyHeadlines)
      .where(eq(weeklyHeadlines.week, week))
      .orderBy(desc(weeklyHeadlines.publishedAt))
      .limit(limit);
  }
  // 获取最新一周的头条
  const latestWeek = await db.select({ week: weeklyHeadlines.week })
    .from(weeklyHeadlines)
    .orderBy(desc(weeklyHeadlines.publishedAt))
    .limit(1);
  if (latestWeek.length === 0) return [];
  return db.select().from(weeklyHeadlines)
    .where(eq(weeklyHeadlines.week, latestWeek[0].week))
    .orderBy(desc(weeklyHeadlines.publishedAt))
    .limit(limit);
}

// 获取价格快照
export async function getPriceSnapshots(week?: string) {
  const db = await getDb();
  if (!db) return [];
  if (week) {
    return db.select().from(priceSnapshots)
      .where(eq(priceSnapshots.week, week))
      .orderBy(asc(priceSnapshots.region));
  }
  const latestWeek = await db.select({ week: priceSnapshots.week })
    .from(priceSnapshots)
    .orderBy(desc(priceSnapshots.createdAt))
    .limit(1);
  if (latestWeek.length === 0) return [];
  return db.select().from(priceSnapshots)
    .where(eq(priceSnapshots.week, latestWeek[0].week))
    .orderBy(asc(priceSnapshots.region));
}

// 获取风险预警
export async function getRiskAlerts(week?: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (week) {
    conditions.push(eq(riskAlerts.week, week));
  }
  // 默认只显示 active 和 monitoring 的预警
  conditions.push(or(eq(riskAlerts.status, 'active'), eq(riskAlerts.status, 'monitoring'))!);
  return db.select().from(riskAlerts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(riskAlerts.createdAt))
    .limit(limit);
}

// 获取深度分析文章
export async function getAnalysisArticles(week?: string, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  if (week) {
    return db.select().from(analysisArticles)
      .where(eq(analysisArticles.week, week))
      .orderBy(desc(analysisArticles.publishedAt))
      .limit(limit);
  }
  return db.select().from(analysisArticles)
    .orderBy(desc(analysisArticles.publishedAt))
    .limit(limit);
}

// 获取单篇分析文章
export async function getAnalysisArticleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(analysisArticles)
    .where(eq(analysisArticles.id, id))
    .limit(1);
  return result[0] || null;
}

// 获取 Market Insights 首页聚合数据
export async function getMarketInsightsDashboard() {
  const db = await getDb();
  if (!db) return { headlines: [], prices: [], risks: [], articles: [], week: '', stats: null };
  
  // 获取最新周标识
  const latestHeadline = await db.select({ week: weeklyHeadlines.week })
    .from(weeklyHeadlines)
    .orderBy(desc(weeklyHeadlines.publishedAt))
    .limit(1);
  
  const week = latestHeadline.length > 0 ? latestHeadline[0].week : getCurrentWeekLabel();
  
  // 并行获取所有数据
  const [headlines, prices, risks, articles, companyStats] = await Promise.all([
    getWeeklyHeadlines(week),
    getPriceSnapshots(week),
    getRiskAlerts(undefined, 10),
    getAnalysisArticles(undefined, 3),
    getCompanyStats(),
  ]);
  
  return { headlines, prices, risks, articles, week, stats: companyStats };
}
