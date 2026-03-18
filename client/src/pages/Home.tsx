import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, MapPin, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CONTINENT_COLORS: Record<string, string> = {
  "中东": "#e67e22", "非洲": "#8e44ad", "东南亚": "#27ae60", "东亚": "#e74c3c",
  "南亚": "#f39c12", "欧洲": "#2980b9", "北美洲": "#1abc9c", "南美洲": "#d35400",
  "独联体/中亚": "#7f8c8d", "大洋洲": "#16a085", "其他": "#95a5a6",
};

export default function Home() {
  const { data: stats, isLoading: statsLoading } = trpc.company.stats.useQuery();
  const { data: countryStats, isLoading: countryLoading } = trpc.company.countryStats.useQuery();

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
        <p className="text-muted-foreground mt-1">全球禽肉进口商企业数据库实时统计</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">企业总数</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">覆盖全球禽肉产业链</p>
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
            <p className="text-xs text-muted-foreground mt-1">已在中国采购过禽肉</p>
          </CardContent>
        </Card>
      </div>

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
