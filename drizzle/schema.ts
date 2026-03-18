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