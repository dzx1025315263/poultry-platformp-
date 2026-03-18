import type { IndustryConfig } from "./types";

const poultryConfig: IndustryConfig = {
  // ===== 基础信息 =====
  platformName: "全球禽业数据协作平台",
  platformShortName: "全球禽业数据平台",
  industryKey: "poultry",
  industryLabel: "禽业",
  productLabel: "禽肉",
  productLabelEn: "Broiler",
  industryName: "禽肉",

  // ===== 企业分类 =====
  roleTags: ["全产业链巨头", "进口商/贸易商", "加工商", "冷链物流", "养殖/饲料", "零售商/超市", "行业协会", "其他"],
  exportRoleTags: ["全产业链巨头", "进口商/分销商", "贸易商/经纪人", "加工商/制造商", "冷链物流", "养殖/饲料", "零售商/超市", "行业协会/政府"],

  // ===== 贸易数据 =====
  hsCode: "0207",
  hsCodeDesc: "禽肉及可食用杂碎",
  tradePageTitle: "全球禽肉贸易数据",
  tradePageSubtitle: "基于 UN Comtrade 数据，HS Code 0207（禽肉及可食用杂碎）进口统计",
  topImportersLabel: "Top 5 禽肉进口国",
  tradeDataSource: "数据来源：UN Comtrade Database · HS Code 0207（禽肉及可食用杂碎） · 数据仅供参考",

  // ===== 市场洞察 =====
  regionInsights: [
    {
      region: "中东", icon: "🇸🇦", color: "border-l-amber-500", items: [
        { type: "warning", title: "沙特禁令影响", desc: "沙特阿拉伯对部分国家禽肉进口实施禁令，中国企业需关注清真认证和检疫标准变化" },
        { type: "opportunity", title: "阿联酋转口贸易枢纽", desc: "迪拜作为中东最大冷链物流中心，是进入中东市场的理想跳板" },
        { type: "trend", title: "清真认证必备", desc: "中东市场100%要求清真认证，建议优先获取GCC国家认可的认证机构资质" },
      ]
    },
    {
      region: "亚洲", icon: "🇻🇳", color: "border-l-blue-500", items: [
        { type: "trend", title: "东南亚需求快速增长", desc: "菲律宾、越南、泰国禽肉进口量连续3年增长，中国冻鸡爪、鸡翅在该地区有强劲需求" },
        { type: "opportunity", title: "日韩高端市场", desc: "日本、韩国对高品质禽肉需求大，但检疫标准极严，需要HACCP和ISO22000认证" },
        { type: "warning", title: "印度市场壁垒", desc: "印度国内禽肉产能充足，进口需求主要集中在特定部位和加工产品" },
      ]
    },
    {
      region: "非洲", icon: "🇳🇬", color: "border-l-green-500", items: [
        { type: "opportunity", title: "巨大增量市场", desc: "非洲人口增长和城市化驱动禽肉需求持续上升，尼日利亚、加纳、南非是重点市场" },
        { type: "trend", title: "价格敏感度高", desc: "非洲市场对价格极度敏感，中国禽肉的价格优势是核心竞争力" },
        { type: "warning", title: "支付风险", desc: "部分非洲国家外汇储备不足，建议采用信用证或前置付款方式" },
      ]
    },
    {
      region: "欧洲", icon: "🇪🇺", color: "border-l-indigo-500", items: [
        { type: "trend", title: "波兰产能扩张", desc: "波兰已成为欧盟最大禽肉生产国，对中国企业既是竞争者也是潜在合作伙伴" },
        { type: "warning", title: "EU标准壁垒", desc: "欧盟食品安全标准极为严格，中国企业直接出口欧盟难度大，可考虑与欧洲企业合作加工" },
        { type: "opportunity", title: "英国脱欧机会", desc: "英国脱欧后独立贸易政策，对中国禽肉进口可能更加开放" },
      ]
    },
    {
      region: "南美洲", icon: "🇧🇷", color: "border-l-red-500", items: [
        { type: "warning", title: "巴西竞争压力", desc: "巴西是全球最大禽肉出口国，与中国在多个市场直接竞争" },
        { type: "opportunity", title: "合作而非竞争", desc: "可与巴西企业探索供应链合作，互补产品线和市场覆盖" },
        { type: "trend", title: "智利、秘鲁新兴市场", desc: "南美其他国家禽肉进口需求增长，是值得关注的新兴市场" },
      ]
    },
  ],

  // ===== AI Prompt =====
  aiMatchExpertPrompt: `你是一个禽肉行业外贸客户匹配专家。基于用户已成交客户的画像（国家、大洲、企业类型、主营产品），从候选企业中推荐最可能成交的潜在客户。请返回JSON格式。`,

  aiAnalystSystemPrompt: `你是一位资深的全球禽肉行业外贸分析师，专注于肉鸡（白羽肉鸡）行业的国际贸易分析。
你需要生成一份专业的每周全球肉鸡行业市场分析报告，格式参考以下结构：

1. 宏观格局速览（macroOverview）：全球禽肉贸易格局变化、主要出口国动态
2. 价格核准（priceAnalysis）：各主要市场的禽肉价格走势、FOB/CIF报价对比
3. 物流预警（logisticsAlert）：海运费率变化、港口拥堵情况、冷链物流动态
4. 客户指南（customerGuide）：重点市场的采购商动态、新兴需求信号
5. 风控建议（riskControl）：汇率风险、政策变化、疫病防控等风险提示
6. 行动指南（actionGuide）：本周建议的具体行动项

请用中文撰写，每个部分200-400字，专业但易读。`,

  weeklyReportTitle: "全球肉鸡行业外贸深度分析报告",
  weeklyReportTitleEn: "Weekly Global Broiler Market Intelligence Report",
  weeklyReportUserPromptTemplate: `请生成{{weekLabel}}周的全球肉鸡行业外贸深度分析报告。`,
  weeklyReportLoadingText: "正在分析全球禽肉贸易数据、价格走势、航运费率等信息，预计需要 30-60 秒",

  // ===== 飞书通知 =====
  feishuBotName: "禽业数据助手",
  feishuGroupName: "禽业数据通知",
  feishuSignature: "全球禽业数据平台",

  // ===== 首页 =====
  homeSubtitle: "全球禽肉进口商企业数据库实时统计",
  homeTotalDesc: "覆盖全球禽肉产业链",
  homeChinaPurchaseDesc: "已在中国采购过禽肉",

  // ===== 报告页 =====
  reportPageSubtitle: "全球禽肉进口商数据报告完整版",

  // ===== 登录页 =====
  loginTitle: "登录全球禽业数据平台",
  loginDesc: "访问全球禽业数据协作平台需要登录。请点击下方按钮继续。",
};

export default poultryConfig;
