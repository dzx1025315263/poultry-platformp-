import { eq, and, like, or, sql, desc, asc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, companies, favorites, teams, teamMembers,
  teamSharedCompanies, inquiryTemplates, smtpConfigs, emailHistory, auditLogs
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
