/**
 * 每周全球市场分析报告 - 自动生成服务
 * 
 * 在服务器启动时注册定时任务，每周一上午8:00（UTC+8）自动生成本周报告。
 * 也可通过 Express 路由 POST /api/cron/weekly-report 手动触发。
 */

import * as db from "../server/db";
import { invokeLLM } from "./_core/llm";

function getCurrentWeekLabel(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export async function generateWeeklyReportAuto(): Promise<{ id: number; weekLabel: string; status: string }> {
  const weekLabel = getCurrentWeekLabel();
  const now = new Date();
  
  // 检查是否已存在
  const existing = await db.getWeeklyReportByWeek(weekLabel);
  if (existing && existing.status === 'completed') {
    console.log(`[WeeklyReport] ${weekLabel} 报告已存在，跳过生成`);
    return { id: existing.id, weekLabel, status: 'already_exists' };
  }
  
  const reportId = existing?.id || await db.createWeeklyReport({ weekLabel, reportDate: now });
  if (existing) await db.updateWeeklyReport(existing.id, { status: 'generating' });
  
  console.log(`[WeeklyReport] 开始生成 ${weekLabel} 报告...`);
  
  // 获取贸易数据
  const tradeData = await db.getPoultryTradeData();
  const tradeContext = tradeData.slice(0, 30).map((t: any) =>
    `${t.country} ${t.year}: 进口量${t.importQuantityTons}吨, 金额$${t.importValueUsd}, 单价$${t.unitPriceUsd}/kg, 同比${t.yoyChange}`
  ).join('\n');
  
  const companyStats = await db.searchCompanies({ page: 1, pageSize: 1 });
  
  try {
    const systemPrompt = `你是一位资深的全球禽肉行业外贸分析师，专注于肉鸡（白羽肉鸡）行业的国际贸易分析。
你需要生成一份专业的每周全球肉鸡行业市场分析报告，格式参考以下结构：

报告必须包含6个部分，每部分用JSON格式返回，包含中英文双语内容：
1. 全球宏观与贸易格局（供需基本面、HPAI疫情、贸易壁垒）
2. 全球核心产区生产因素与价格核准（中国/巴西/美国/泰国/乌克兰价格监测）
3. 国际航运费率与物流预警（航线费率、港口拥堵、附加费）
4. 全球大客户开发指南与实战话术（按区域推荐目标客户和话术）
5. 外贸风控模型与结算建议（按市场风险等级推荐结算方式）
6. 本周行动指南（3-5条具体可执行建议）

数据来源参考：World Bank, USDA FAS, Aviagen, JBzyw.com, ABPA, Krungsri Research, Wattagnet

请用Markdown格式撰写每个部分，包含表格、数据和分析。价格用人民币元/斤 + 美元/kg双标注。`;

    const userPrompt = `请生成${weekLabel}周的全球肉鸡行业外贸深度分析报告。

平台已有贸易数据参考：\n${tradeContext}\n\n平台企业数据库共${companyStats.total}家企业。\n\n请严格按照JSON格式返回，包含以下6个字段：
{"part1": "第一部分内容(Markdown)", "part2": "...", "part3": "...", "part4": "...", "part5": "...", "part6": "...", "references": "参考文献列表"}`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'weekly_report',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              part1: { type: 'string', description: '全球宏观与贸易格局' },
              part2: { type: 'string', description: '核心产区价格核准' },
              part3: { type: 'string', description: '航运费率与物流预警' },
              part4: { type: 'string', description: '大客户开发指南' },
              part5: { type: 'string', description: '风控模型与结算建议' },
              part6: { type: 'string', description: '本周行动指南' },
              references: { type: 'string', description: '参考文献' },
            },
            required: ['part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'references'],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0].message.content;
    const content = JSON.parse(typeof rawContent === 'string' ? rawContent : '{}');
    const rid = typeof reportId === 'number' ? reportId : Number(reportId);
    
    await db.updateWeeklyReport(rid, {
      status: 'completed',
      part1_macroLandscape: content.part1,
      part2_priceVerification: content.part2,
      part3_logisticsAlerts: content.part3,
      part4_keyAccountGuide: content.part4,
      part5_riskControl: content.part5,
      part6_actionItems: content.part6,
      references: content.references,
    });
    
    console.log(`[WeeklyReport] ${weekLabel} 报告生成完成`);
    return { id: rid, weekLabel, status: 'completed' };
  } catch (err: any) {
    const rid = typeof reportId === 'number' ? reportId : Number(reportId);
    await db.updateWeeklyReport(rid, { status: 'failed' });
    console.error(`[WeeklyReport] ${weekLabel} 报告生成失败:`, err.message);
    throw err;
  }
}

/**
 * 注册定时任务和Express路由
 */
export function registerWeeklyReportCron(app: import("express").Express) {
  // 注册手动触发API
  app.post('/api/cron/weekly-report', async (_req, res) => {
    try {
      const result = await generateWeeklyReportAuto();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // 注册定时任务：每周一 UTC 00:00（即北京时间08:00）
  const MONDAY = 1;
  const CHECK_INTERVAL = 60 * 60 * 1000; // 每小时检查一次
  
  setInterval(async () => {
    const now = new Date();
    // 只在周一 UTC 0点（±30分钟）触发
    if (now.getUTCDay() === MONDAY && now.getUTCHours() === 0 && now.getUTCMinutes() < 30) {
      try {
        console.log(`[WeeklyReport] 定时任务触发，开始自动生成报告...`);
        await generateWeeklyReportAuto();
      } catch (err: any) {
        console.error(`[WeeklyReport] 定时生成失败:`, err.message);
      }
    }
  }, CHECK_INTERVAL);
  
  console.log('[WeeklyReport] 定时任务已注册：每周一 08:00 (UTC+8) 自动生成');
}
