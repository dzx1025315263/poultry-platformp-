import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

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
  city: varchar("city", { length: 200 }),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
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
// V2.3: AI推荐排除表（不感兴趣标记）
export const aiRecommendExclusions = mysqlTable("ai_recommend_exclusions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V2.3: 待办事项表
export const todoItems = mysqlTable("todo_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  source: varchar("source", { length: 100 }),
  sourceId: varchar("sourceId", { length: 200 }),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  status: mysqlEnum("status", ["pending", "in_progress", "done"]).default("pending"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// V2.3: 邮件批量发送任务表（支持暂停/恢复）
export const emailBatchJobs = mysqlTable("email_batch_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  abTestId: int("abTestId"),
  totalRecipients: int("totalRecipients").notNull(),
  sentCount: int("sentCount").default(0),
  status: mysqlEnum("status", ["running", "paused", "completed", "cancelled"]).default("running"),
  recipientsJson: text("recipientsJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// V2.1: 禽肉贸易数据表（UN Comtrade数据）
export const poultryTradeData = mysqlTable("poultry_trade_data", {
  id: int("id").autoincrement().primaryKey(),
  country: varchar("country", { length: 200 }).notNull(),
  countryCode: varchar("countryCode", { length: 10 }),
  year: int("year").notNull(),
  importValueUsd: text("importValueUsd"),
  importQuantityTons: text("importQuantityTons"),
  unitPriceUsd: text("unitPriceUsd"),
  yoyChange: text("yoyChange"),
  hsCode: varchar("hsCode", { length: 20 }).default("0207"),
  source: varchar("source", { length: 100 }).default("UN Comtrade"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// V2.4: 每周全球市场分析报告表
export const weeklyMarketReports = mysqlTable("weekly_market_reports", {
  id: int("id").autoincrement().primaryKey(),
  weekLabel: varchar("weekLabel", { length: 50 }).notNull(), // e.g. "2026-W11"
  reportDate: timestamp("reportDate").notNull(),
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating").notNull(),
  // Part 1: 全球宏观与贸易格局
  part1_macroLandscape: text("part1_macroLandscape"),
  // Part 2: 核心产区价格核准
  part2_priceVerification: text("part2_priceVerification"),
  // Part 3: 国际航运费率与物流预警
  part3_logisticsAlerts: text("part3_logisticsAlerts"),
  // Part 4: 大客户开发指南与实战话术
  part4_keyAccountGuide: text("part4_keyAccountGuide"),
  // Part 5: 外贸风控模型与结算建议
  part5_riskControl: text("part5_riskControl"),
  // Part 6: 本周行动指南
  part6_actionItems: text("part6_actionItems"),
  // 数据来源引用
  references: text("references"),
  generatedByUserId: int("generatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// V2.5: 团队活动动态流
export const teamActivities = mysqlTable("team_activities", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 200 }),
  actionType: varchar("actionType", { length: 50 }).notNull(), // favorite_add, favorite_remove, status_update, email_sent, company_shared, contact_added
  targetType: varchar("targetType", { length: 50 }), // company, contact, email
  targetId: int("targetId"),
  targetName: varchar("targetName", { length: 500 }),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V2.5: 企业数据变更历史
export const companyChangeHistory = mysqlTable("company_change_history", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 200 }),
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V3.0: 主产区分析模块 - 产区基础信息表
export const productionRegions = mysqlTable("production_regions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),      // 'CN','US','BR','EU','TH','TR'
  name: varchar("name", { length: 100 }).notNull(),               // 中文名
  nameEn: varchar("nameEn", { length: 100 }).notNull(),           // 英文名
  flagEmoji: varchar("flagEmoji", { length: 10 }),                // 国旗emoji
  annualProductionMt: text("annualProductionMt"),                 // 年产量(万吨)
  annualExportMt: text("annualExportMt"),                         // 年出口量(万吨)
  globalProductionRank: int("globalProductionRank"),              // 全球产量排名
  globalExportRank: int("globalExportRank"),                      // 全球出口排名
  mainProducingAreas: text("mainProducingAreas"),                 // 主产区(JSON)
  topCompanies: text("topCompanies"),                             // 龙头企业(JSON)
  industryStatus: varchar("industryStatus", { length: 50 }),      // 产业状态
  statusDescription: text("statusDescription"),                   // 状态详细描述
  keyAdvantages: text("keyAdvantages"),                           // 核心优势(JSON)
  halalCertification: boolean("halalCertification").default(false),
  heatTreatmentCapability: boolean("heatTreatmentCapability").default(false),
  dataYear: int("dataYear").default(2025),
  dataSources: text("dataSources"),                               // 数据来源(JSON)
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// V3.0: 主产区分析模块 - 产区价格行情表
export const regionMarketPrices = mysqlTable("region_market_prices", {
  id: int("id").autoincrement().primaryKey(),
  regionCode: varchar("regionCode", { length: 10 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),                // '2025-03' 或 '2025-03-25'
  productType: varchar("productType", { length: 50 }).notNull(),  // 'broiler','corn','soybean','frozen_chicken'
  productLabel: varchar("productLabel", { length: 100 }),         // 显示名称
  price: text("price").notNull(),                                 // 价格数值
  unit: varchar("unit", { length: 30 }).notNull(),                // 'CNY/kg','USD/lb','BRL/kg'
  priceUsd: text("priceUsd"),                                     // 统一换算为USD的价格
  trend: varchar("trend", { length: 10 }),                        // 'up','down','stable'
  changePercent: text("changePercent"),                            // 环比变化%
  source: varchar("source", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V3.0: 主产区分析模块 - 产区疫病预警表
export const regionDiseaseAlerts = mysqlTable("region_disease_alerts", {
  id: int("id").autoincrement().primaryKey(),
  regionCode: varchar("regionCode", { length: 10 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  diseaseType: varchar("diseaseType", { length: 100 }).notNull(), // 'HPAI H5N1','Newcastle Disease'
  location: varchar("location", { length: 300 }),                 // 具体地点
  impactLevel: mysqlEnum("impactLevel", ["critical", "high", "medium", "low"]).default("medium"),
  affectedBirds: text("affectedBirds"),                           // 受影响禽只数
  tradeImpact: text("tradeImpact"),                               // 贸易影响描述
  description: text("description"),
  source: varchar("source", { length: 200 }),
  sourceUrl: text("sourceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V3.0: 主产区分析模块 - 产区产业动态表
export const regionIndustryNews = mysqlTable("region_industry_news", {
  id: int("id").autoincrement().primaryKey(),
  regionCode: varchar("regionCode", { length: 10 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),       // 'policy','company','market','technology','trade'
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary"),                                       // 摘要
  content: text("content"),                                       // 详细内容
  importance: mysqlEnum("importance", ["breaking", "important", "normal"]).default("normal"),
  source: varchar("source", { length: 200 }),
  sourceUrl: text("sourceUrl"),
  tags: text("tags"),                                             // JSON标签数组
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V3.1: 分区域/分州报价表（对标鸡病专业网的分地区报价）
export const regionSubAreaPrices = mysqlTable("region_sub_area_prices", {
  id: int("id").autoincrement().primaryKey(),
  regionCode: varchar("regionCode", { length: 10 }).notNull(),     // 'CN','US','BR' etc
  subArea: varchar("subArea", { length: 200 }).notNull(),           // 州/省名 e.g. 'Georgia','Shandong'
  subAreaLocal: varchar("subAreaLocal", { length: 200 }),           // 本地语言名
  date: varchar("date", { length: 20 }).notNull(),
  productType: varchar("productType", { length: 50 }).notNull(),   // 'broiler','layer','chick','frozen_whole'
  productLabel: varchar("productLabel", { length: 100 }),
  price: text("price").notNull(),
  unit: varchar("unit", { length: 30 }).notNull(),
  priceUsd: text("priceUsd"),
  trend: varchar("trend", { length: 10 }),
  changePercent: text("changePercent"),
  source: varchar("source", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V3.1: 饲料原料价格表（上下游联动分析）
export const regionFeedPrices = mysqlTable("region_feed_prices", {
  id: int("id").autoincrement().primaryKey(),
  regionCode: varchar("regionCode", { length: 10 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  feedType: varchar("feedType", { length: 50 }).notNull(),         // 'corn','soybean_meal','wheat','fish_meal','premix'
  feedLabel: varchar("feedLabel", { length: 100 }),
  price: text("price").notNull(),
  unit: varchar("unit", { length: 30 }).notNull(),
  priceUsd: text("priceUsd"),
  trend: varchar("trend", { length: 10 }),
  changePercent: text("changePercent"),
  source: varchar("source", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V3.1: 疫病防控知识库（疾病图谱，对标鸡病专业网的鸡病防控频道）
export const regionDiseaseLibrary = mysqlTable("region_disease_library", {
  id: int("id").autoincrement().primaryKey(),
  regionCode: varchar("regionCode", { length: 10 }),               // null = 全球通用
  diseaseCategory: varchar("diseaseCategory", { length: 50 }).notNull(), // 'respiratory','digestive','parasitic','viral','bacterial','immune'
  diseaseName: varchar("diseaseName", { length: 200 }).notNull(),
  diseaseNameEn: varchar("diseaseNameEn", { length: 200 }),
  pathogen: varchar("pathogen", { length: 200 }),                  // 病原体
  symptoms: text("symptoms"),                                       // 症状描述
  pathologicalChanges: text("pathologicalChanges"),                 // 病理变化
  diagnosis: text("diagnosis"),                                     // 诊断方法
  prevention: text("prevention"),                                   // 预防措施
  treatment: text("treatment"),                                     // 治疗方案
  vaccineInfo: text("vaccineInfo"),                                 // 疫苗信息
  seasonalRisk: varchar("seasonalRisk", { length: 100 }),          // 'spring','summer','autumn','winter','year_round'
  prevalenceLevel: mysqlEnum("prevalenceLevel", ["endemic", "sporadic", "rare", "emerging"]).default("sporadic"),
  economicImpact: text("economicImpact"),                          // 经济影响
  source: varchar("source", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// V3.1: 产区政策法规表
export const regionPolicies = mysqlTable("region_policies", {
  id: int("id").autoincrement().primaryKey(),
  regionCode: varchar("regionCode", { length: 10 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  policyType: varchar("policyType", { length: 50 }).notNull(),    // 'trade','welfare','food_safety','veterinary','environmental','subsidy'
  policyLabel: varchar("policyLabel", { length: 100 }),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary"),
  content: text("content"),
  impactOnTrade: text("impactOnTrade"),                            // 对贸易的影响
  effectiveDate: varchar("effectiveDate", { length: 20 }),
  status: mysqlEnum("status", ["active", "pending", "expired"]).default("active"),
  source: varchar("source", { length: 200 }),
  sourceUrl: text("sourceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// V3.1: 龙头企业动态追踪表
export const regionCompanyProfiles = mysqlTable("region_company_profiles", {
  id: int("id").autoincrement().primaryKey(),
  regionCode: varchar("regionCode", { length: 10 }).notNull(),
  companyName: varchar("companyName", { length: 300 }).notNull(),
  companyNameLocal: varchar("companyNameLocal", { length: 300 }),
  companyType: varchar("companyType", { length: 50 }),             // 'integrator','processor','breeder','exporter'
  annualCapacityMt: text("annualCapacityMt"),                      // 年产能(万吨)
  annualRevenue: text("annualRevenue"),                            // 年营收
  employeeCount: text("employeeCount"),
  exportMarkets: text("exportMarkets"),                            // 出口市场(JSON)
  certifications: text("certifications"),                          // 认证(JSON: halal, brc, ifs, etc.)
  recentNews: text("recentNews"),                                  // 最新动态(JSON)
  website: text("website"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== V4.0: Market Insights 市场洞察首页 ====================

// 周度行业头条
export const weeklyHeadlines = mysqlTable("weekly_headlines", {
  id: int("id").autoincrement().primaryKey(),
  week: varchar("week", { length: 10 }).notNull(),                 // e.g. '2026-W13'
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary"),
  impactLevel: mysqlEnum("impact_level", ["high", "medium", "low"]).default("medium"),
  category: varchar("category", { length: 100 }),                   // trade/disease/policy/market/supply
  source: varchar("source", { length: 200 }),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 价格快照（6大产区比较）
export const priceSnapshots = mysqlTable("price_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  week: varchar("week", { length: 10 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  product: varchar("product", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  unit: varchar("unit", { length: 50 }).default("per kg"),
  changePct: decimal("change_pct", { precision: 5, scale: 2 }),
  changeDirection: mysqlEnum("change_direction", ["up", "down", "stable"]).default("stable"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 风险预警
export const riskAlerts = mysqlTable("risk_alerts", {
  id: int("id").autoincrement().primaryKey(),
  week: varchar("week", { length: 10 }).notNull(),
  riskType: mysqlEnum("risk_type", ["disease", "trade_policy", "exchange_rate", "supply_chain", "weather"]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).default("medium"),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  affectedRegions: text("affected_regions"),                        // comma-separated
  status: mysqlEnum("status", ["active", "monitoring", "resolved"]).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 深度分析文章
export const analysisArticles = mysqlTable("analysis_articles", {
  id: int("id").autoincrement().primaryKey(),
  week: varchar("week", { length: 10 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  subtitle: varchar("subtitle", { length: 300 }),
  content: text("content"),                                         // Markdown format
  coverImage: varchar("cover_image", { length: 500 }),
  author: varchar("author", { length: 100 }).default("UGG Research Team"),
  readingTime: int("reading_time").default(5),
  tags: varchar("tags", { length: 300 }),                           // comma-separated
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// ==================== V5.0: 访问统计 Page View Analytics ====================
export const pageViews = mysqlTable("page_views", {
  id: int("id").autoincrement().primaryKey(),
  pagePath: varchar("page_path", { length: 255 }).notNull(),      // e.g. "/", "/weekly-reports", "/search"
  reportId: int("report_id"),                                      // 关联周报 ID（仅周报页面）
  visitorId: varchar("visitor_id", { length: 64 }).notNull(),      // 匿名访客标识（基于 fingerprint）
  isGuest: boolean("is_guest").default(true).notNull(),             // 是否为访客（未登录）
  userAgent: varchar("user_agent", { length: 500 }),
  referrer: varchar("referrer", { length: 500 }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});
