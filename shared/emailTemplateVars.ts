/**
 * 邮件模板变量替换工具
 * 
 * 支持在邮件主题和正文中使用 {{变量名}} 格式的占位符，
 * 发送时自动替换为实际的企业/联系人数据。
 * 
 * 前后端共享此模块，前端用于预览，后端用于实际替换。
 */

/** 变量定义 */
export interface TemplateVariable {
  /** 变量标识符（用于替换），如 "company_name" */
  key: string;
  /** 变量中文标签（用于UI展示），如 "公司名" */
  label: string;
  /** 模板中的占位符格式，如 "{{公司名}}" */
  placeholder: string;
  /** 变量说明 */
  description: string;
  /** 数据来源：company=企业表, contact=联系人表 */
  source: "company" | "contact";
  /** 对应的数据库字段名 */
  fieldName: string;
  /** 分组（用于UI分组展示） */
  group: "company" | "contact";
}

/** 所有支持的模板变量 */
export const EMAIL_TEMPLATE_VARIABLES: TemplateVariable[] = [
  // 企业信息变量
  {
    key: "company_name",
    label: "公司名",
    placeholder: "{{公司名}}",
    description: "企业名称",
    source: "company",
    fieldName: "companyName",
    group: "company",
  },
  {
    key: "country",
    label: "国家",
    placeholder: "{{国家}}",
    description: "企业所在国家/地区",
    source: "company",
    fieldName: "country",
    group: "company",
  },
  {
    key: "continent",
    label: "大洲",
    placeholder: "{{大洲}}",
    description: "企业所在大洲",
    source: "company",
    fieldName: "continent",
    group: "company",
  },
  {
    key: "core_role",
    label: "核心角色",
    placeholder: "{{核心角色}}",
    description: "企业核心角色（如进口商、加工商等）",
    source: "company",
    fieldName: "coreRole",
    group: "company",
  },
  {
    key: "main_products",
    label: "主营产品",
    placeholder: "{{主营产品}}",
    description: "企业主营产品",
    source: "company",
    fieldName: "mainProducts",
    group: "company",
  },
  {
    key: "website",
    label: "网站",
    placeholder: "{{网站}}",
    description: "企业网站/社媒链接",
    source: "company",
    fieldName: "websiteSocial",
    group: "company",
  },
  // 联系人信息变量
  {
    key: "contact_name",
    label: "联系人",
    placeholder: "{{联系人}}",
    description: "联系人姓名",
    source: "contact",
    fieldName: "name",
    group: "contact",
  },
  {
    key: "contact_title",
    label: "职位",
    placeholder: "{{职位}}",
    description: "联系人职位/头衔",
    source: "contact",
    fieldName: "title",
    group: "contact",
  },
  {
    key: "contact_email",
    label: "邮箱",
    placeholder: "{{邮箱}}",
    description: "联系人邮箱地址",
    source: "contact",
    fieldName: "email",
    group: "contact",
  },
  {
    key: "contact_phone",
    label: "电话",
    placeholder: "{{电话}}",
    description: "联系人电话号码",
    source: "contact",
    fieldName: "phone",
    group: "contact",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "{{LinkedIn}}",
    description: "联系人LinkedIn链接",
    source: "contact",
    fieldName: "linkedin",
    group: "contact",
  },
];

/** 变量数据上下文 */
export interface TemplateContext {
  company?: {
    companyName?: string | null;
    country?: string | null;
    continent?: string | null;
    coreRole?: string | null;
    mainProducts?: string | null;
    websiteSocial?: string | null;
    [key: string]: any;
  };
  contact?: {
    name?: string | null;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedin?: string | null;
    [key: string]: any;
  };
}

/**
 * 替换模板中的变量占位符
 * 
 * @param template 包含 {{变量名}} 占位符的模板字符串
 * @param context 变量数据上下文（企业+联系人数据）
 * @param fallback 当变量值为空时的回退值，默认为空字符串
 * @returns 替换后的字符串
 */
export function replaceTemplateVariables(
  template: string,
  context: TemplateContext,
  fallback: string = ""
): string {
  if (!template) return template;

  let result = template;

  for (const variable of EMAIL_TEMPLATE_VARIABLES) {
    const { placeholder, source, fieldName } = variable;
    const data = source === "company" ? context.company : context.contact;
    const value = data?.[fieldName];
    // 使用全局替换，转义花括号用于正则
    const escapedPlaceholder = placeholder.replace(/[{}]/g, "\\$&");
    const regex = new RegExp(escapedPlaceholder, "g");
    result = result.replace(regex, value != null && value !== "" ? String(value) : fallback);
  }

  return result;
}

/**
 * 检测模板中使用了哪些变量
 * 
 * @param template 模板字符串
 * @returns 使用到的变量列表
 */
export function detectUsedVariables(template: string): TemplateVariable[] {
  if (!template) return [];
  return EMAIL_TEMPLATE_VARIABLES.filter((v) => template.includes(v.placeholder));
}

/**
 * 获取模板中使用的变量但缺少数据的列表
 * 
 * @param template 模板字符串
 * @param context 变量数据上下文
 * @returns 缺少数据的变量列表
 */
export function getMissingVariables(
  template: string,
  context: TemplateContext
): TemplateVariable[] {
  const used = detectUsedVariables(template);
  return used.filter((v) => {
    const data = v.source === "company" ? context.company : context.contact;
    const value = data?.[v.fieldName];
    return value == null || value === "";
  });
}

/**
 * 生成预览用的示例数据
 */
export function getSampleContext(): TemplateContext {
  return {
    company: {
      companyName: "ABC Foods International",
      country: "Saudi Arabia",
      continent: "中东",
      coreRole: "进口商/贸易商",
      mainProducts: "Frozen Chicken, Poultry Products",
      websiteSocial: "www.abcfoods.com",
    },
    contact: {
      name: "Ahmed Al-Rashid",
      title: "Procurement Manager",
      email: "ahmed@abcfoods.com",
      phone: "+966-123-456789",
      linkedin: "https://linkedin.com/in/ahmed-al-rashid",
    },
  };
}

/** 按分组获取变量列表 */
export function getVariablesByGroup(): { group: string; label: string; variables: TemplateVariable[] }[] {
  return [
    {
      group: "company",
      label: "企业信息",
      variables: EMAIL_TEMPLATE_VARIABLES.filter((v) => v.group === "company"),
    },
    {
      group: "contact",
      label: "联系人信息",
      variables: EMAIL_TEMPLATE_VARIABLES.filter((v) => v.group === "contact"),
    },
  ];
}
