import { trpc } from "@/lib/trpc";
import { industryConfig } from "@shared/industry-config";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Globe, MapPin, TrendingUp, Newspaper, CalendarClock, ArrowRight, Bell } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";

const CONTINENT_COLORS: Record<string, string> = {
  "中东": "#e67e22", "非洲": "#8e44ad", "东南亚": "#27ae60", "东亚": "#e74c3c",
  "南亚": "#f39c12", "欧洲": "#2980b9", "北美洲": "#1abc9c", "南美洲": "#d35400",
  "独联体/中亚": "#7f8c8d", "大洋洲": "#16a085", "其他": "#95a5a6",
};

const STATUS_LABELS: Record<string, string> = {
  prospect: "潜在客户", contacted: "已联系", quoted: "已报价", won: "已成交", repurchase: "复购",
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.company.stats.useQuery();
  const { data: countryStats, isLoading: countryLoading } = trpc.company.countryStats.useQuery();
  const { data: latestReport } = trpc.weeklyReport.latest.useQuery(undefined, { enabled: isAuthenticated });
  const { data: reminders } = trpc.reminder.upcoming.useQuery({ days: 7 }, { enabled: isAuthenticated });

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
        <h1 className="text-2xl font-bold tracking-tight">数据概览</h1>
        <p className="text-muted-foreground mt-1">{industryConfig.homeSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">企业总数</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{industryConfig.homeTotalDesc}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">覆盖国家</CardTitle>
            <Globe className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.countries}</div>
            <p className="text-xs text-muted-foreground mt-1">横跨七大洲</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">覆盖大洲</CardTitle>
            <MapPin className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.continents}</div>
            <p className="text-xs text-muted-foreground mt-1">全球市场布局</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">中国采购企业</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.chinaImporters}</div>
            <p className="text-xs text-muted-foreground mt-1">{industryConfig.homeChinaPurchaseDesc}</p>
          </CardContent>
        </Card>
      </div>

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
                  {/* 行动指南摘要 */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">本周行动指南</h4>
                    <div className="text-sm text-amber-900 dark:text-amber-100 prose prose-sm max-w-none line-clamp-6">
                      <Streamdown>{(latestReport as any).part6_actionItems?.slice(0, 500) || '暂无内容'}</Streamdown>
                    </div>
                  </div>
                  {/* 宏观格局摘要 */}
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
    </div>
  );
}
