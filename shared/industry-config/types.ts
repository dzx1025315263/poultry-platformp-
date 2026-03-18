/**
 * 行业配置类型接口
 * 
 * 所有行业特定的文案、标签、Prompt 等均通过此接口定义。
 * 新增行业时，只需创建一个实现此接口的配置文件即可。
 */

export interface InsightItem {
  type: "warning" | "opportunity" | "trend";
  title: string;
  desc: string;
}

export interface RegionInsight {
  region: string;
  icon: string;
  color: string;
  items: InsightItem[];
}

export interface IndustryConfig {
  // ===== 基础信息 =====
  /** 平台全称，如 "全球禽业数据协作平台" */
  platformName: string;
  /** 平台简称，如 "全球禽业数据平台" */
  platformShortName: string;
  /** 行业标识符，如 "poultry" */
  industryKey: string;
  /** 行业中文名，如 "禽业" */
  industryLabel: string;
  /** 产品中文名，如 "禽肉" */
  productLabel: string;
  /** 产品英文名，如 "Broiler" */
  productLabelEn: string;
  /** 行业产品名（用于动态拼接），如 "禽肉" */
  industryName: string;

  // ===== 企业分类 =====
  /** 企业角色标签列表 */
  roleTags: string[];
  /** 导出页面的角色标签（可能与搜索页略有不同） */
  exportRoleTags: string[];

  // ===== 贸易数据 =====
  /** HS Code，如 "0207" */
  hsCode: string;
  /** HS Code 描述，如 "禽肉及可食用杂碎" */
  hsCodeDesc: string;
  /** 贸易数据页面标题 */
  tradePageTitle: string;
  /** 贸易数据页面副标题 */
  tradePageSubtitle: string;
  /** Top N 进口国标题 */
  topImportersLabel: string;
  /** 贸易数据来源说明 */
  tradeDataSource: string;

  // ===== 市场洞察 =====
  /** 各区域市场洞察内容 */
  regionInsights: RegionInsight[];

  // ===== AI Prompt =====
  /** AI 客户匹配专家角色描述 */
  aiMatchExpertPrompt: string;
  /** AI 市场分析师角色描述 */
  aiAnalystSystemPrompt: string;
  /** 每周报告标题 */
  weeklyReportTitle: string;
  /** 每周报告英文标题 */
  weeklyReportTitleEn: string;
  /** 生成报告时的用户提示词模板（包含 {{weekLabel}} 占位符） */
  weeklyReportUserPromptTemplate: string;
  /** 生成报告时的加载提示文案 */
  weeklyReportLoadingText: string;

  // ===== 飞书通知 =====
  /** 飞书机器人推荐名称 */
  feishuBotName: string;
  /** 飞书群推荐名称 */
  feishuGroupName: string;
  /** 飞书通知底部签名 */
  feishuSignature: string;

  // ===== 首页 =====
  /** 首页数据概览副标题 */
  homeSubtitle: string;
  /** 企业总数描述 */
  homeTotalDesc: string;
  /** 中国采购企业描述 */
  homeChinaPurchaseDesc: string;

  // ===== 报告页 =====
  /** 报告全文页面副标题 */
  reportPageSubtitle: string;

  // ===== 登录页 =====
  /** 登录页标题 */
  loginTitle: string;
  /** 登录页描述 */
  loginDesc: string;
}
