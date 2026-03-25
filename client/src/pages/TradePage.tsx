import { trpc } from "@/lib/trpc";
import { industryConfig } from "@shared/industry-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Globe, DollarSign, Package, Search,
  Activity, ArrowUpDown, Info
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ComposedChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

const REGION_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

export default function TradePage() {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("importValueUsd");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: tradeData, isLoading } = trpc.trade.poultryImports.useQuery({ year: selectedYear });
  const { data: allTrends } = trpc.trade.trends.useQuery({});
  const { data: annualSummary } = trpc.trade.annualSummary.useQuery();

  // 排序和筛选
  const filteredData = useMemo(() => {
    if (!tradeData) return [];
    let data = [...tradeData];
    if (searchQuery) {
      data = data.filter((d: any) =>
        d.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.countryCode || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    data.sort((a: any, b: any) => {
      const aVal = parseFloat(a[sortField] || '0') || 0;
      const bVal = parseFloat(b[sortField] || '0') || 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return data;
  }, [tradeData, searchQuery, sortField, sortDir]);

  // 汇总统计
  const totalImportValue = useMemo(() => {
    if (!tradeData) return 0;
    return tradeData.reduce((sum: number, d: any) => sum + (parseFloat(d.importValueUsd) || 0), 0);
  }, [tradeData]);

  const totalQuantity = useMemo(() => {
    if (!tradeData) return 0;
    return tradeData.reduce((sum: number, d: any) => sum + (parseFloat(d.importQuantityTons) || 0), 0);
  }, [tradeData]);

  const avgUnitPrice = useMemo(() => {
    if (!tradeData || tradeData.length === 0) return 0;
    const prices = tradeData.filter((d: any) => parseFloat(d.unitPriceUsd) > 0);
    if (prices.length === 0) return 0;
    return prices.reduce((sum: number, d: any) => sum + parseFloat(d.unitPriceUsd), 0) / prices.length;
  }, [tradeData]);

  // 加权平均单价
  const weightedAvgPrice = useMemo(() => {
    if (!totalImportValue || !totalQuantity) return 0;
    return totalImportValue / (totalQuantity * 1000); // USD per kg
  }, [totalImportValue, totalQuantity]);

  // Top 5 进口国
  const topCountries = useMemo(() => {
    if (!tradeData) return [];
    return [...tradeData]
      .sort((a: any, b: any) => (parseFloat(b.importValueUsd) || 0) - (parseFloat(a.importValueUsd) || 0))
      .slice(0, 5);
  }, [tradeData]);

  // Top 10 市场份额饼图数据
  const marketShareData = useMemo(() => {
    if (!tradeData || totalImportValue === 0) return [];
    const sorted = [...tradeData].sort((a: any, b: any) => (parseFloat(b.importValueUsd) || 0) - (parseFloat(a.importValueUsd) || 0));
    const top10 = sorted.slice(0, 10);
    const othersValue = sorted.slice(10).reduce((s: number, d: any) => s + (parseFloat(d.importValueUsd) || 0), 0);
    const result = top10.map((d: any, i: number) => ({
      name: d.country,
      value: parseFloat(d.importValueUsd) || 0,
      share: ((parseFloat(d.importValueUsd) || 0) / totalImportValue * 100),
      fill: REGION_COLORS[i],
    }));
    if (othersValue > 0) {
      result.push({ name: '其他', value: othersValue, share: othersValue / totalImportValue * 100, fill: '#94a3b8' });
    }
    return result;
  }, [tradeData, totalImportValue]);

  // 年度趋势数据（全球汇总）
  const annualTrendData = useMemo(() => {
    if (!annualSummary) return [];
    return annualSummary.map((item: any, idx: number) => {
      const val = parseFloat(item.totalValue) || 0;
      const qty = parseFloat(item.totalQuantity) || 0;
      const prevVal = idx > 0 ? (parseFloat(annualSummary[idx - 1].totalValue) || 0) : 0;
      return {
        year: String(item.year),
        totalValueB: val / 1e9,
        totalQuantityM: qty / 1e6,
        avgPrice: parseFloat(item.avgUnitPrice) || 0,
        weightedPrice: qty > 0 ? val / (qty * 1000) : 0,
        yoyGrowth: idx > 0 && prevVal > 0 ? ((val - prevVal) / prevVal * 100) : null,
      };
    });
  }, [annualSummary]);

  // Top 5 国家多年趋势
  const top5MultiYearData = useMemo(() => {
    if (!allTrends || !tradeData) return [];
    const top5Names = [...tradeData]
      .sort((a: any, b: any) => (parseFloat(b.importValueUsd) || 0) - (parseFloat(a.importValueUsd) || 0))
      .slice(0, 5)
      .map((d: any) => d.country);

    const yearMap: Record<string, any> = {};
    allTrends.forEach((item: any) => {
      if (!top5Names.includes(item.country)) return;
      if (!yearMap[item.year]) yearMap[item.year] = { year: String(item.year) };
      yearMap[item.year][item.country] = (parseFloat(item.importValueUsd) || 0) / 1e6;
    });
    return Object.values(yearMap).sort((a: any, b: any) => a.year.localeCompare(b.year));
  }, [allTrends, tradeData]);

  const top5Names = useMemo(() => {
    if (!tradeData) return [];
    return [...tradeData]
      .sort((a: any, b: any) => (parseFloat(b.importValueUsd) || 0) - (parseFloat(a.importValueUsd) || 0))
      .slice(0, 5)
      .map((d: any) => d.country);
  }, [tradeData]);

  // 单价趋势（全球加权平均）
  const priceTrendData = useMemo(() => {
    if (!annualSummary) return [];
    return annualSummary.map((item: any) => {
      const val = parseFloat(item.totalValue) || 0;
      const qty = parseFloat(item.totalQuantity) || 0;
      return {
        year: String(item.year),
        weightedPrice: qty > 0 ? val / (qty * 1000) : 0,
        avgPrice: parseFloat(item.avgUnitPrice) || 0,
      };
    });
  }, [annualSummary]);

  // 同比变化排行
  const yoyRanking = useMemo(() => {
    if (!tradeData) return { gainers: [], losers: [] };
    const withYoy = tradeData
      .map((d: any) => ({ ...d, yoyNum: parseFloat(d.yoyChange) || 0 }))
      .filter((d: any) => d.yoyChange && d.yoyChange !== 'N/A');
    const gainers = [...withYoy].sort((a, b) => b.yoyNum - a.yoyNum).slice(0, 5);
    const losers = [...withYoy].sort((a, b) => a.yoyNum - b.yoyNum).slice(0, 5);
    return { gainers, losers };
  }, [tradeData]);

  const formatValue = (val: string | number | null) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (!num || isNaN(num)) return "-";
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatTons = (val: string | number | null) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (!num || isNaN(num)) return "-";
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M 吨`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K 吨`;
    return `${num.toFixed(0)} 吨`;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">全球禽肉贸易数据中心</h1>
        <p className="text-muted-foreground mt-1">
          HS Code 0207 (禽肉及可食用杂碎) · 覆盖 30 个主要进口国 · 2020-2025 六年数据
        </p>
      </div>

      {/* 年份选择 + 搜索 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">统计年份：</span>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => (
                <SelectItem key={y} value={String(y)}>
                  {y}年{y === 2025 ? ' (预测)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索国家或代码..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>总进口额</span>
            </div>
            <div className="text-2xl font-bold mt-1">{formatValue(totalImportValue)}</div>
            <p className="text-xs text-muted-foreground">{selectedYear}年</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>总进口量</span>
            </div>
            <div className="text-2xl font-bold mt-1">{formatTons(totalQuantity)}</div>
            <p className="text-xs text-muted-foreground">{selectedYear}年</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>加权均价</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {weightedAvgPrice > 0 ? `$${weightedAvgPrice.toFixed(2)}/kg` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">按贸易量加权</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>简均价</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {avgUnitPrice > 0 ? `$${avgUnitPrice.toFixed(2)}/kg` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">各国算术平均</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>进口国数</span>
            </div>
            <div className="text-2xl font-bold mt-1">{tradeData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{selectedYear}年</p>
          </CardContent>
        </Card>
      </div>

      {/* 分析图表区域 - Tabs */}
      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trend">全球趋势</TabsTrigger>
          <TabsTrigger value="country">国家对比</TabsTrigger>
          <TabsTrigger value="share">市场份额</TabsTrigger>
          <TabsTrigger value="price">价格分析</TabsTrigger>
        </TabsList>

        {/* Tab 1: 全球趋势 */}
        <TabsContent value="trend" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">全球禽肉进口额与进口量趋势</CardTitle>
                <CardDescription>2020-2025 · 双轴对比</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={annualTrendData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}B`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}M`} />
                    <Tooltip formatter={(value: number, name: string) => {
                      if (name === '进口额') return [`$${value.toFixed(2)}B`, name];
                      if (name === '进口量') return [`${value.toFixed(2)}M 吨`, name];
                      return [value, name];
                    }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area yAxisId="left" type="monotone" dataKey="totalValueB" name="进口额" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5, fill: '#10b981' }} />
                    <Line yAxisId="right" type="monotone" dataKey="totalQuantityM" name="进口量" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5, fill: '#3b82f6' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">年度同比增长率</CardTitle>
                <CardDescription>进口额 YoY 变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={annualTrendData.filter((d: any) => d.yoyGrowth !== null)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '同比增长']} />
                    <Bar dataKey="yoyGrowth" name="同比增长" radius={[4, 4, 0, 0]}>
                      {annualTrendData.filter((d: any) => d.yoyGrowth !== null).map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.yoyGrowth >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 年度数据表 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">年度汇总数据</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">年份</th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">总进口额</th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">总进口量</th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">加权均价</th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">YoY</th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">国家数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualTrendData.map((item: any, idx: number) => (
                      <tr key={item.year} className="border-b hover:bg-muted/50">
                        <td className="py-2.5 px-3 font-medium">
                          {item.year}
                          {idx === annualTrendData.length - 1 && <Badge variant="secondary" className="ml-2 text-xs">预测</Badge>}
                        </td>
                        <td className="text-right py-2.5 px-3 font-semibold">${item.totalValueB.toFixed(2)}B</td>
                        <td className="text-right py-2.5 px-3">{item.totalQuantityM.toFixed(2)}M 吨</td>
                        <td className="text-right py-2.5 px-3">${item.weightedPrice.toFixed(2)}/kg</td>
                        <td className="text-right py-2.5 px-3">
                          {item.yoyGrowth != null ? (
                            <span className={item.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {item.yoyGrowth >= 0 ? '+' : ''}{item.yoyGrowth.toFixed(1)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="text-right py-2.5 px-3">{annualSummary?.[idx]?.countryCount || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 国家对比 */}
        <TabsContent value="country" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 5 进口国 · 六年趋势对比</CardTitle>
                <CardDescription>按进口金额排名 (百万美元)</CardDescription>
              </CardHeader>
              <CardContent>
                {top5MultiYearData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={top5MultiYearData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}M`} />
                      <Tooltip formatter={(value: number, name: string) => [`$${value.toFixed(0)}M`, name]} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {top5Names.map((name, i) => (
                        <Line key={name} type="monotone" dataKey={name} stroke={REGION_COLORS[i]} strokeWidth={2} dot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">加载中...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedYear}年 Top 10 进口国柱状图</CardTitle>
                <CardDescription>按进口金额排名</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={[...filteredData].slice(0, 10).map((d: any) => ({
                      country: d.country,
                      value: (parseFloat(d.importValueUsd) || 0) / 1e6,
                      quantity: (parseFloat(d.importQuantityTons) || 0) / 1e3,
                    }))}
                    layout="vertical"
                    margin={{ left: 100, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}M`} />
                    <YAxis type="category" dataKey="country" width={95} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number, name: string) => {
                      if (name === '进口额') return [`$${value.toFixed(0)}M`, name];
                      if (name === '进口量') return [`${value.toFixed(0)}K 吨`, name];
                      return [value, name];
                    }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="value" name="进口额" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 涨跌排行 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  {selectedYear}年增长最快的市场
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {yoyRanking.gainers.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs">{idx + 1}</Badge>
                        <span className="text-sm font-medium">{item.country}</span>
                        <span className="text-xs text-muted-foreground">({item.countryCode})</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">+{item.yoyNum.toFixed(1)}%</span>
                    </div>
                  ))}
                  {yoyRanking.gainers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  {selectedYear}年下降最多的市场
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {yoyRanking.losers.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs">{idx + 1}</Badge>
                        <span className="text-sm font-medium">{item.country}</span>
                        <span className="text-xs text-muted-foreground">({item.countryCode})</span>
                      </div>
                      <span className="text-sm font-semibold text-red-600">{item.yoyNum.toFixed(1)}%</span>
                    </div>
                  ))}
                  {yoyRanking.losers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: 市场份额 */}
        <TabsContent value="share" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedYear}年 市场份额分布</CardTitle>
                <CardDescription>按进口金额计算 · Top 10 + 其他</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart>
                    <Pie
                      data={marketShareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={130}
                      paddingAngle={1}
                      dataKey="value"
                      label={({ name, share }) => share > 3 ? `${name} ${share.toFixed(1)}%` : ''}
                      labelLine={false}
                    >
                      {marketShareData.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatValue(value), '进口额']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">市场份额排名</CardTitle>
                <CardDescription>{selectedYear}年 · 按进口金额</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[380px]">
                  <div className="space-y-2">
                    {marketShareData.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.fill }} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{formatValue(item.value)}</span>
                            <span className="font-semibold w-16 text-right">{item.share.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-5">
                          <div className="h-full rounded-full transition-all" style={{ width: `${item.share}%`, backgroundColor: item.fill }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* 集中度指标 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">市场集中度指标</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const sorted = marketShareData.filter(d => d.name !== '其他');
                  const top3 = sorted.slice(0, 3).reduce((s, d) => s + d.share, 0);
                  const top5 = sorted.slice(0, 5).reduce((s, d) => s + d.share, 0);
                  const top10 = sorted.slice(0, 10).reduce((s, d) => s + d.share, 0);
                  const hhi = sorted.reduce((s, d) => s + d.share * d.share, 0);
                  return (
                    <>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground">CR3 (前三集中度)</p>
                        <p className="text-2xl font-bold mt-1">{top3.toFixed(1)}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground">CR5 (前五集中度)</p>
                        <p className="text-2xl font-bold mt-1">{top5.toFixed(1)}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground">CR10 (前十集中度)</p>
                        <p className="text-2xl font-bold mt-1">{top10.toFixed(1)}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground">HHI 指数</p>
                        <p className="text-2xl font-bold mt-1">{hhi.toFixed(0)}</p>
                        <Badge variant={hhi < 1500 ? "secondary" : hhi < 2500 ? "default" : "destructive"} className="text-xs mt-1">
                          {hhi < 1500 ? "竞争性市场" : hhi < 2500 ? "适度集中" : "高度集中"}
                        </Badge>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: 价格分析 */}
        <TabsContent value="price" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">全球禽肉进口均价趋势</CardTitle>
                <CardDescription>加权平均价 vs 简单平均价 (USD/kg)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={priceTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} domain={['auto', 'auto']} />
                    <Tooltip formatter={(value: number, name: string) => [`$${value.toFixed(2)}/kg`, name]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="weightedPrice" name="加权均价" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="avgPrice" name="简均价" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedYear}年 各国单价分布</CardTitle>
                <CardDescription>按单价从高到低排列 (USD/kg)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={[...filteredData]
                      .filter((d: any) => parseFloat(d.unitPriceUsd) > 0)
                      .sort((a: any, b: any) => parseFloat(b.unitPriceUsd) - parseFloat(a.unitPriceUsd))
                      .slice(0, 15)
                      .map((d: any) => ({
                        country: d.country,
                        price: parseFloat(d.unitPriceUsd) || 0,
                      }))}
                    layout="vertical"
                    margin={{ left: 100, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="country" width={95} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}/kg`, '单价']} />
                    <Bar dataKey="price" name="单价" radius={[0, 4, 4, 0]}>
                      {[...filteredData]
                        .filter((d: any) => parseFloat(d.unitPriceUsd) > 0)
                        .sort((a: any, b: any) => parseFloat(b.unitPriceUsd) - parseFloat(a.unitPriceUsd))
                        .slice(0, 15)
                        .map((_: any, i: number) => (
                          <Cell key={i} fill={i < 5 ? '#ef4444' : i < 10 ? '#f59e0b' : '#10b981'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 价格洞察 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                价格洞察
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">高价市场 (&gt;$3/kg)</h4>
                  <p className="text-red-900 dark:text-red-100">
                    {filteredData.filter((d: any) => parseFloat(d.unitPriceUsd) > 3).map((d: any) => d.country).join('、') || '无'}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-2">高端市场，偏好精加工产品和特定部位，利润空间大但准入门槛高</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">中价市场 ($2-3/kg)</h4>
                  <p className="text-amber-900 dark:text-amber-100">
                    {filteredData.filter((d: any) => { const p = parseFloat(d.unitPriceUsd); return p >= 2 && p <= 3; }).map((d: any) => d.country).join('、') || '无'}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">主流市场，需求稳定，适合大宗贸易和长期合作</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">低价市场 (&lt;$2/kg)</h4>
                  <p className="text-green-900 dark:text-green-100">
                    {filteredData.filter((d: any) => parseFloat(d.unitPriceUsd) > 0 && parseFloat(d.unitPriceUsd) < 2).map((d: any) => d.country).join('、') || '无'}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">价格敏感市场，以冻整鸡和低价部位为主，量大利薄</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top 5 进口国进度条 */}
      {topCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{`${selectedYear}年 Top 5 ${industryConfig.industryName}进口国`}</CardTitle>
            <CardDescription>按进口金额排名 · 含同比变化与市场份额</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCountries.map((item: any, idx: number) => {
                const maxVal = parseFloat(topCountries[0]?.importValueUsd || '0') || 1;
                const pct = ((parseFloat(item.importValueUsd || '0') || 0) / maxVal) * 100;
                const share = totalImportValue > 0 ? ((parseFloat(item.importValueUsd || '0') || 0) / totalImportValue * 100) : 0;
                const yoy = parseFloat(item.yoyChange || '');
                const qty = parseFloat(item.importQuantityTons || '0');
                const price = parseFloat(item.unitPriceUsd || '0');
                return (
                  <div key={item.id || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs font-bold">
                          {idx + 1}
                        </Badge>
                        <span className="font-medium">{item.country}</span>
                        {item.countryCode && <span className="text-xs text-muted-foreground">({item.countryCode})</span>}
                        <Badge variant="secondary" className="text-xs">{share.toFixed(1)}%</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{formatTons(qty)}</span>
                        <span className="text-muted-foreground">${price.toFixed(2)}/kg</span>
                        <span className="font-semibold text-sm">{formatValue(item.importValueUsd)}</span>
                        {!isNaN(yoy) && (
                          <span className={`flex items-center ${yoy >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {yoy >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                            {yoy >= 0 ? "+" : ""}{yoy.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 详细数据表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">详细数据</CardTitle>
          <CardDescription>
            {`${selectedYear}年各国${industryConfig.industryName}进口数据`} · 共 {filteredData.length} 条记录 · 点击表头排序
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? "未找到匹配的国家" : `暂无 ${selectedYear} 年贸易数据`}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">排名</TableHead>
                    <TableHead>国家</TableHead>
                    <TableHead>代码</TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('importValueUsd')}>
                      <div className="flex items-center justify-end gap-1">
                        进口金额 (USD)
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('importQuantityTons')}>
                      <div className="flex items-center justify-end gap-1">
                        进口量 (吨)
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('unitPriceUsd')}>
                      <div className="flex items-center justify-end gap-1">
                        单价 (USD/kg)
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">市场份额</TableHead>
                    <TableHead className="text-right">同比变化</TableHead>
                    <TableHead className="text-right text-xs">数据来源</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item: any, idx: number) => {
                    const yoy = parseFloat(item.yoyChange || '');
                    const share = totalImportValue > 0 ? ((parseFloat(item.importValueUsd) || 0) / totalImportValue * 100) : 0;
                    return (
                      <TableRow key={item.id || idx}>
                        <TableCell className="text-muted-foreground font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.country}</TableCell>
                        <TableCell className="text-muted-foreground">{item.countryCode || "-"}</TableCell>
                        <TableCell className="text-right font-semibold">{formatValue(item.importValueUsd)}</TableCell>
                        <TableCell className="text-right">{formatTons(item.importQuantityTons)}</TableCell>
                        <TableCell className="text-right">
                          {parseFloat(item.unitPriceUsd || '0') > 0 ? `$${parseFloat(item.unitPriceUsd || '0').toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-muted-foreground">{share.toFixed(1)}%</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {!isNaN(yoy) ? (
                            <span className={`flex items-center justify-end gap-1 ${yoy >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {yoy >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {yoy >= 0 ? "+" : ""}{yoy.toFixed(1)}%
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground max-w-[120px] truncate" title={item.source}>
                          {item.source || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* 数据来源说明 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">数据来源与说明</p>
              <p>贸易数据主要来源: USDA Foreign Agricultural Service (FAS) - Livestock and Poultry: World Markets and Trade (Dec 2025 & Oct 2024); Observatory of Economic Complexity (OEC) 基于 UN Comtrade 数据库。</p>
              <p>HS Code 0207 涵盖: 鸡肉、鸭肉、鹅肉、火鸡肉及其可食用杂碎（鲜、冷、冻）。2025年数据为 USDA 预测值，实际数据以年末修正值为准。</p>
              <p>单价计算: 加权均价 = 总进口额 / 总进口量（反映全球实际交易水平）; 简均价 = 各国单价的算术平均（反映国别价格差异）。</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
