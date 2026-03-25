import { trpc } from "@/lib/trpc";
import { industryConfig } from "@shared/industry-config";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, Globe, MapPin, TrendingUp, TrendingDown, Newspaper, CalendarClock,
  ArrowRight, Bell, DollarSign, Package, BarChart3, Activity
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart, Area
} from "recharts";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { useMemo } from "react";

const CONTINENT_COLORS: Record<string, string> = {
  "中东": "#e67e22", "非洲": "#8e44ad", "东南亚": "#27ae60", "东亚": "#e74c3c",
  "南亚": "#f39c12", "欧洲": "#2980b9", "北美洲": "#1abc9c", "南美洲": "#d35400",
  "独联体/中亚": "#7f8c8d", "大洋洲": "#16a085", "其他": "#95a5a6",
};

const STATUS_LABELS: Record<string, string> = {
  prospect: "潜在客户", contacted: "已联系", quoted: "已报价", won: "已成交", repurchase: "复购",
};

const formatBillions = (val: number) => {
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
};

const formatMillionTons = (val: number) => {
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
  return val.toFixed(0);
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.company.stats.useQuery();
  const { data: countryStats, isLoading: countryLoading } = trpc.company.countryStats.useQuery();
  const { data: latestReport } = trpc.weeklyReport.latest.useQuery(undefined, { enabled: isAuthenticated });
  const { data: reminders } = trpc.reminder.upcoming.useQuery({ days: 7 }, { enabled: isAuthenticated });
  const { data: annualSummary } = trpc.trade.annualSummary.useQuery();

  const continentData = countryStats
    ? Object.entries(
        countryStats.reduce((acc: Record<string, number>, c: any) => {
          acc[c.continent] = (acc[c.continent] || 0) + c.count;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value: value as number, fill: CONTINENT_COLORS[name] || "#95a5a6" }))
       .sort((a, b) => b.value - a.value)
    : [];

  const top20Countries = countryStats
    ? [...countryStats].sort((a: any, b: any) => b.count - a.count).slice(0, 20)
    : [];

  // 贸易趋势数据处理
  const tradeTrendData = useMemo(() => {
    if (!annualSummary || annualSummary.length === 0) return [];
    return annualSummary.map((item: any, idx: number) => {
      const totalVal = parseFloat(item.totalValue) || 0;
      const totalQty = parseFloat(item.totalQuantity) || 0;
      const prevVal = idx > 0 ? (parseFloat(annualSummary[idx - 1].totalValue) || 0) : 0;
      const yoyGrowth = idx > 0 && prevVal > 0 ? ((totalVal - prevVal) / prevVal * 100) : 0;
      return {
        year: String(item.year),
        totalValueB: totalVal / 1e9,
        totalQuantityM: totalQty / 1e6,
        avgPrice: parseFloat(item.avgUnitPrice) || 0,
        countries: item.countryCount,
        yoyGrowth: idx > 0 ? yoyGrowth : null,
      };
    });
  }, [annualSummary]);

  // 最新年度和上一年度数据
  const latestYearData = tradeTrendData.length > 0 ? tradeTrendData[tradeTrendData.length - 1] : null;
  const prevYearData = tradeTrendData.length > 1 ? tradeTrendData[tradeTrendData.length - 2] : null;

  // 市场集中度（基于企业数据库）
  const marketConcentration = useMemo(() => {
    if (!countryStats) return { top5: 0, top10: 0, hhi: 0 };
    const sorted = [...countryStats].sort((a: any, b: any) => b.count - a.count);
    const total = sorted.reduce((s: number, c: any) => s + c.count, 0);
    const top5 = sorted.slice(0, 5).reduce((s: number, c: any) => s + c.count, 0);
    const top10 = sorted.slice(0, 10).reduce((s: number, c: any) => s + c.count, 0);
    const hhi = sorted.reduce((s: number, c: any) => {
      const share = (c.count / total) * 100;
      return s + share * share;
    }, 0);
    return {
      top5: total > 0 ? (top5 / total * 100) : 0,
      top10: total > 0 ? (top10 / total * 100) : 0,
      hhi: Math.round(hhi),
    };
  }, [countryStats]);

  if (statsLoading || countryLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">数据概览</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Global Poultry Intelligence Hub</h1>
        <p className="text-muted-foreground mt-1">全球禽肉产业数据中枢 · 实时追踪 {stats?.countries || 0} 个国家 · {stats?.total?.toLocaleString() || 0} 家企业</p>
      </div>

      {/* 第一行：核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">企业数据库规模</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              覆盖 {stats?.continents} 大洲 · {stats?.countries} 个国家
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {latestYearData ? `${latestYearData.year} 全球进口额` : '全球进口额'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {latestYearData ? `$${latestYearData.totalValueB.toFixed(1)}B` : '-'}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {latestYearData?.yoyGrowth != null && (
                <>
                  {latestYearData.yoyGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${latestYearData.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {latestYearData.yoyGrowth >= 0 ? '+' : ''}{latestYearData.yoyGrowth.toFixed(1)}% YoY
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-1">HS 0207</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {latestYearData ? `${latestYearData.year} 全球进口量` : '全球进口量'}
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {latestYearData ? `${latestYearData.totalQuantityM.toFixed(2)}M 吨` : '-'}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {prevYearData && latestYearData && (
                <>
                  {latestYearData.totalQuantityM >= prevYearData.totalQuantityM ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${latestYearData.totalQuantityM >= prevYearData.totalQuantityM ? 'text-green-600' : 'text-red-600'}`}>
                    {latestYearData.totalQuantityM >= prevYearData.totalQuantityM ? '+' : ''}
                    {((latestYearData.totalQuantityM - prevYearData.totalQuantityM) / prevYearData.totalQuantityM * 100).toFixed(1)}% YoY
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-1">禽肉及杂碎</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">中国采购企业</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.chinaImporters}</div>
            <p className="text-xs text-muted-foreground mt-1">
              占比 {stats?.total ? ((stats.chinaImporters / stats.total) * 100).toFixed(1) : 0}% · {industryConfig.homeChinaPurchaseDesc}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 第二行：全球贸易趋势（6年） + 市场集中度 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  全球禽肉进口趋势 (2020-2025)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">HS Code 0207 · 数据来源: USDA FAS / UN Comtrade</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/trade")} className="text-xs">
                详细数据 <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tradeTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={tradeTrendData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${v}B`}
                    label={{ value: '进口额 (USD)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#888' } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}M`}
                    label={{ value: '进口量 (吨)', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#888' } }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === '进口额') return [`$${value.toFixed(1)}B`, name];
                      if (name === '进口量') return [`${value.toFixed(2)}M 吨`, name];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area yAxisId="left" type="monotone" dataKey="totalValueB" name="进口额" fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="totalQuantityM" name="进口量" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                <p>暂无贸易趋势数据</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              市场集中度分析
            </CardTitle>
            <p className="text-xs text-muted-foreground">基于企业数据库分布</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 集中度指标 */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Top 5 国家占比</span>
                  <span className="font-semibold">{marketConcentration.top5.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${marketConcentration.top5}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Top 10 国家占比</span>
                  <span className="font-semibold">{marketConcentration.top10.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${marketConcentration.top10}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">HHI 指数</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{marketConcentration.hhi.toLocaleString()}</span>
                    <Badge variant={marketConcentration.hhi < 1500 ? "secondary" : marketConcentration.hhi < 2500 ? "default" : "destructive"} className="text-xs">
                      {marketConcentration.hhi < 1500 ? "分散" : marketConcentration.hhi < 2500 ? "适度集中" : "高度集中"}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  赫芬达尔-赫希曼指数 (HHI) 衡量市场集中程度
                </p>
              </div>
            </div>

            {/* 年度贸易快照 */}
            {tradeTrendData.length > 0 && (
              <div className="pt-3 border-t space-y-2">
                <h4 className="text-sm font-medium">6年贸易增长</h4>
                <div className="grid grid-cols-2 gap-2">
                  {tradeTrendData.length >= 2 && (() => {
                    const first = tradeTrendData[0];
                    const last = tradeTrendData[tradeTrendData.length - 1];
                    const cagr = Math.pow(last.totalValueB / first.totalValueB, 1 / (tradeTrendData.length - 1)) - 1;
                    const totalGrowth = ((last.totalValueB - first.totalValueB) / first.totalValueB) * 100;
                    return (
                      <>
                        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">累计增长</p>
                          <p className="text-lg font-bold text-green-600">+{totalGrowth.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">{first.year}-{last.year}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">CAGR</p>
                          <p className="text-lg font-bold text-blue-600">{(cagr * 100).toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">年复合增长率</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 第三行：年度贸易数据表 */}
      {tradeTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">全球禽肉贸易年度数据一览</CardTitle>
              <Badge variant="outline" className="text-xs">HS 0207 · 30 个主要进口国</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">年份</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">总进口额 (USD)</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">总进口量 (吨)</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">均价 (USD/kg)</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">同比增长</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">进口国数</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeTrendData.map((item, idx) => (
                    <tr key={item.year} className="border-b hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate("/trade")}>
                      <td className="py-3 px-4 font-medium">
                        {item.year}
                        {idx === tradeTrendData.length - 1 && <Badge variant="secondary" className="ml-2 text-xs">USDA预测</Badge>}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold">{formatBillions(item.totalValueB * 1e9)}</td>
                      <td className="text-right py-3 px-4">{formatMillionTons(item.totalQuantityM * 1e6)} 吨</td>
                      <td className="text-right py-3 px-4">${item.avgPrice.toFixed(2)}/kg</td>
                      <td className="text-right py-3 px-4">
                        {item.yoyGrowth != null ? (
                          <span className={`flex items-center justify-end gap-1 ${item.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.yoyGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {item.yoyGrowth >= 0 ? '+' : ''}{item.yoyGrowth.toFixed(1)}%
                          </span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="text-right py-3 px-4">{item.countries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* V2.5: 最新周报摘要 + 跟进提醒 */}
      {isAuthenticated && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 最新周报摘要 */}
          <Card className="lg:col-span-2 border-t-4 border-t-amber-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">最新市场周报</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/weekly-report")} className="text-xs">
                查看完整报告 <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {latestReport && latestReport.status === 'completed' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{latestReport.weekLabel}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(latestReport.reportDate).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">本周行动指南</h4>
                    <div className="text-sm text-amber-900 dark:text-amber-100 prose prose-sm max-w-none line-clamp-6">
                      <Streamdown>{(latestReport as any).part6_actionItems?.slice(0, 500) || '暂无内容'}</Streamdown>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-2">宏观格局速览</h4>
                    <div className="text-sm text-muted-foreground prose prose-sm max-w-none line-clamp-4">
                      <Streamdown>{(latestReport as any).part1_macroLandscape?.slice(0, 300) || '暂无内容'}</Streamdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">暂无市场周报</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/weekly-report")}>
                    前往生成本周报告
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 跟进提醒 */}
          <Card className="border-t-4 border-t-blue-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">近7日跟进提醒</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/favorites")} className="text-xs">
                管理 <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {reminders && reminders.length > 0 ? (
                <div className="space-y-2">
                  {reminders.slice(0, 6).map((r: any, i: number) => {
                    const daysLeft = Math.ceil((new Date(r.followUpDate).getTime() - Date.now()) / 86400000);
                    return (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate("/favorites")}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.companyName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">{r.country}</Badge>
                            <span className="text-xs text-muted-foreground">{STATUS_LABELS[r.followUpStatus] || r.followUpStatus}</span>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <Badge variant={daysLeft <= 1 ? "destructive" : daysLeft <= 3 ? "default" : "secondary"} className="text-xs">
                            {daysLeft <= 0 ? "今天" : `${daysLeft}天后`}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {reminders.length > 6 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">还有 {reminders.length - 6} 条提醒</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">近7日无跟进提醒</p>
                  <p className="text-xs mt-1">在收藏夹中设置跟进日期即可收到提醒</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 企业分布图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">各大洲企业分布</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={continentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {continentData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} 家`, "企业数"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Top 20 国家企业数量</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top20Countries} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="country" width={75} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`${value} 家`, "企业数"]} />
                <Bar dataKey="count" fill="oklch(0.45 0.15 250)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 各大洲详细统计 */}
      <Card>
        <CardHeader><CardTitle className="text-base">各大洲详细统计</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">大洲</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">企业数量</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">国家数</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">占比</th>
                </tr>
              </thead>
              <tbody>
                {continentData.map((item) => {
                  const countries = countryStats?.filter((c: any) => c.continent === item.name).length || 0;
                  const pct = stats?.total ? ((item.value / stats.total) * 100).toFixed(1) : "0";
                  return (
                    <tr key={item.name} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.fill }} />
                        {item.name}
                      </td>
                      <td className="text-right py-3 px-4 font-medium">{item.value.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">{countries}</td>
                      <td className="text-right py-3 px-4 text-muted-foreground">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 数据来源 */}
      <div className="text-xs text-muted-foreground text-center py-2 space-y-0.5">
        <p>企业数据来源: 全球禽肉产业链公开数据整理 · 贸易数据来源: USDA Foreign Agricultural Service, OEC (UN Comtrade)</p>
        <p>HS Code 0207 (禽肉及可食用杂碎) · 2025年数据为 USDA 预测值 · 数据仅供参考</p>
      </div>
    </div>
  );
}
