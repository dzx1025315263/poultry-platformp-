/**
 * 行业配置入口
 * 
 * 通过环境变量 VITE_INDUSTRY 选择加载哪个行业配置。
 * 默认加载禽业（poultry）配置。
 * 
 * 新增行业步骤：
 * 1. 在 shared/industry-config/ 下创建新的配置文件（如 seafood.ts）
 * 2. 实现 IndustryConfig 接口的所有字段
 * 3. 在下方 configMap 中注册
 * 4. 设置环境变量 VITE_INDUSTRY=seafood
 */

import type { IndustryConfig } from "./types";
import poultryConfig from "./poultry";

// 注册所有行业配置
// 新增行业时，在此处添加 import 和注册即可
const configMap: Record<string, IndustryConfig> = {
  poultry: poultryConfig,
  // seafood: seafoodConfig,   // 未来：水产行业
  // beef: beefConfig,         // 未来：牛肉行业
  // dairy: dairyConfig,       // 未来：乳制品行业
};

/**
 * 获取当前行业配置
 * 
 * 前端通过 import.meta.env.VITE_INDUSTRY 读取
 * 后端通过 process.env.VITE_INDUSTRY 读取
 * 默认值为 "poultry"
 */
function getIndustryKey(): string {
  // 兼容前端 Vite 环境和后端 Node 环境
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_INDUSTRY) {
    return (import.meta as any).env.VITE_INDUSTRY;
  }
  if (typeof process !== "undefined" && process.env?.VITE_INDUSTRY) {
    return process.env.VITE_INDUSTRY;
  }
  return "poultry";
}

/** 当前行业配置（单例） */
export const industryConfig: IndustryConfig = configMap[getIndustryKey()] || poultryConfig;

/** 导出类型供外部使用 */
export type { IndustryConfig, InsightItem, RegionInsight } from "./types";

/** 获取所有已注册的行业列表 */
export function getAvailableIndustries(): { key: string; label: string }[] {
  return Object.entries(configMap).map(([key, config]) => ({
    key,
    label: config.industryLabel,
  }));
}
