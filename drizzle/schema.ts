import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "editor"]).default("user").notNull(),
  feishuUserId: varchar("feishuUserId", { length: 64 }),
  feishuUnionId: varchar("feishuUnionId", { length: 64 }),
  avatar: text("avatar"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  seqNo: int("seqNo"),
  companyName: text("companyName").notNull(),
  country: text("country").notNull(),
  continent: varchar("continent", { length: 100 }).notNull(),
  coreRole: text("coreRole"),
  purchaseTendency: text("purchaseTendency"),
  companyProfile: text("companyProfile"),
  mainProducts: text("mainProducts"),
  websiteSocial: text("websiteSocial"),
  contactInfo: text("contactInfo"),
  hasPurchasedFromChina: varchar("hasPurchasedFromChina", { length: 500 }).default("否"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId").notNull(),
  followUpStatus: mysqlEnum("followUpStatus", [
    "new", "contacted", "negotiating", "quoted", "closed_won", "closed_lost"
  ]).default("new").notNull(),
  followUpDate: timestamp("followUpDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  inviteCode: varchar("inviteCode", { length: 20 }).notNull().unique(),
  ownerId: int("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export const teamSharedCompanies = mysqlTable("team_shared_companies", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  companyId: int("companyId").notNull(),
  sharedByUserId: int("sharedByUserId").notNull(),
  followUpStatus: mysqlEnum("followUpStatus", [
    "new", "contacted", "negotiating", "quoted", "closed_won", "closed_lost"
  ]).default("new").notNull(),
  notes: text("notes"),
  lastUpdatedByUserId: int("lastUpdatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const inquiryTemplates = mysqlTable("inquiry_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 200 }),
  contactPerson: varchar("contactPerson", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  destinationPort: varchar("destinationPort", { length: 200 }),
  emailBody: text("emailBody"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const smtpConfigs = mysqlTable("smtp_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  host: varchar("host", { length: 200 }).notNull(),
  port: int("port").notNull(),
  secure: boolean("secure").default(true),
  username: varchar("username", { length: 200 }).notNull(),
  password: text("password").notNull(),
  fromName: varchar("fromName", { length: 200 }),
  fromEmail: varchar("fromEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const emailHistory = mysqlTable("email_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId"),
  recipients: text("recipients").notNull(),
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  sendType: mysqlEnum("sendType", ["single", "bcc"]).default("single"),
  status: mysqlEnum("status", ["sent", "failed"]).default("sent"),
  internalNote: text("internalNote"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  targetTable: varchar("targetTable", { length: 50 }),
  targetId: int("targetId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V2.0: 企业联系人表
export const companyContacts = mysqlTable("company_contacts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  title: varchar("title", { length: 200 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 100 }),
  linkedin: text("linkedin"),
  isPrimary: boolean("isPrimary").default(false),
  addedByUserId: int("addedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// V2.0: 企业信用评级表
export const companyCreditRatings = mysqlTable("company_credit_ratings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  registeredCapital: varchar("registeredCapital", { length: 200 }),
  foundedYear: int("foundedYear"),
  importFrequency: mysqlEnum("importFrequency", ["unknown", "rare", "occasional", "frequent", "very_frequent"]).default("unknown"),
  cooperationHistory: mysqlEnum("cooperationHistory", ["none", "inquiry", "sample", "trial_order", "regular"]).default("none"),
  creditScore: int("creditScore").default(0),
  ratedByUserId: int("ratedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// V2.0: 客户生命周期阶段表（漏斗看板）
export const customerLifecycle = mysqlTable("customer_lifecycle", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId").notNull(),
  stage: mysqlEnum("stage", ["prospect", "contacted", "quoted", "won", "repurchase"]).default("prospect").notNull(),
  dealValue: text("dealValue"),
  expectedCloseDate: timestamp("expectedCloseDate"),
  notes: text("notes"),
  movedAt: timestamp("movedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// V2.0: 询盘A/B测试模板表
export const abTestTemplates = mysqlTable("ab_test_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  variantA_subject: varchar("variantA_subject", { length: 500 }),
  variantA_body: text("variantA_body"),
  variantB_subject: varchar("variantB_subject", { length: 500 }),
  variantB_body: text("variantB_body"),
  variantA_sent: int("variantA_sent").default(0),
  variantA_opened: int("variantA_opened").default(0),
  variantA_replied: int("variantA_replied").default(0),
  variantB_sent: int("variantB_sent").default(0),
  variantB_opened: int("variantB_opened").default(0),
  variantB_replied: int("variantB_replied").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// V2.0: 团队区域权限表
export const teamRegionAccess = mysqlTable("team_region_access", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  continent: varchar("continent", { length: 100 }),
  country: text("country"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V2.0: 数据备份记录表
export const backupRecords = mysqlTable("backup_records", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileUrl: text("fileUrl"),
  fileSize: int("fileSize"),
  recordCount: int("recordCount"),
  backupType: mysqlEnum("backupType", ["manual", "scheduled"]).default("manual"),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});