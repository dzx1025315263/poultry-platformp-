import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo } from "react";
import {
  Factory, Globe, TrendingUp, TrendingDown, AlertTriangle, Newspaper,
  Shield, DollarSign, Package, MapPin, Building2, Award, Minus,
  ChevronRight, Activity, Flame, Snowflake, Thermometer
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from "recharts";

const REGION_COLORS: Record<string, string> = {
  US: "#3b82f6", BR: "#22c55e", EU: "#f59e0b", CN: "#ef4444", TH: "#8b5cf6", TR: "#ec4899"
};

const REGION_FLAGS: Record<string, string> = {
  US: "🇺🇸", BR: "🇧🇷", EU: "🇪🇺", CN: "🇨🇳", TH: "🇹🇭", TR: "🇹🇷"
};

function ImpactBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; label: string }> = {
    critical: { color: "bg-red-600 text-white", label: "严重" },
    high: { color: "bg-orange-500 text-white", label: "高" },
    medium: { color: "bg-yellow-500 text-white", label: "中" },
    low: { color: "bg-green-500 text-white", label: "低" },
  };
  const c = config[level] || config.medium;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.color}`}>{c.label}</span>;
}

function ImportanceBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; label: string }> = {
    breaking: { color: "bg-red-100 text-red-800 border-red-200", label: "突发" },
    important: { color: "bg-amber-100 text-amber-800 border-amber-200", label: "重要" },
    normal: { color: "bg-slate-100 text-slate-700 border-slate-200", label: "常规" },
  };
  const c = config[level] || config.normal;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${c.color}`}>{c.label}</span>;
}

function CategoryBadge({ cat }: { cat: string }) {
  const config: Record<string, { color: string; label: string }> = {
    policy: { color: "bg-blue-100 text-blue-800", label: "政策法规" },
    company: { color: "bg-purple-100 text-purple-800", label: "企业动态" },
    market: { color: "bg-green-100 text-green-800", label: "市场行情" },
    technology: { color: "bg-cyan-100 text-cyan-800", label: "技术工艺" },
    trade: { color: "bg-orange-100 text-orange-800", label: "贸易动态" },
  };
  const c = config[cat] || { color: "bg-gray-100 text-gray-800", label: cat };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.color}`}>{c.label}</span>;
}

function TrendIcon({ trend }: { trend?: string | null }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-green-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

// ==================== 产区概览卡片 ====================
function RegionOverviewCard({ region, isSelected, onClick }: { region: any; isSelected: boolean; onClick: () => void }) {
  const flag = REGION_FLAGS[region.code] || "🌍";
  const color = REGION_COLORS[region.code] || "#6b7280";
  let advantages: string[] = [];
  try { advantages = JSON.parse(region.keyAdvantages || "[]"); } catch { }

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected ? "ring-2 ring-offset-2" : "hover:scale-[1.01]"}`}
      style={isSelected ? { borderColor: color, ringColor: color } : {}}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{flag}</span>
            <div>
              <h3 className="font-bold text-base">{region.name}</h3>
              <p className="text-xs text-muted-foreground">{region.nameEn}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>
              产量#{region.globalProductionRank} / 出口#{region.globalExportRank}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted/50 rounded p-2">
            <p className="text-xs text-muted-foreground">年产量</p>
            <p className="font-bold text-sm">{region.annualProductionMt} 万吨</p>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <p className="text-xs text-muted-foreground">年出口量</p>
            <p className="font-bold text-sm">{region.annualExportMt} 万吨</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {region.halalCertification && (
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">清真认证</Badge>
          )}
          {region.heatTreatmentCapability && (
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
              <Thermometer className="h-3 w-3 mr-1" />73°C 热处理
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {advantages.slice(0, 3).map((a: string, i: number) => (
            <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">{a}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== 产区详情面板 ====================
function RegionDetailPanel({ regionCode }: { regionCode: string }) {
  const { data: region } = trpc.productionRegions.getByCode.useQuery({ code: regionCode });
  const { data: prices } = trpc.productionRegions.marketPrices.useQuery({ regionCode });
  const { data: alerts } = trpc.productionRegions.diseaseAlerts.useQuery({ regionCode });
  const { data: news } = trpc.productionRegions.industryNews.useQuery({ regionCode });
  const [newsCategory, setNewsCategory] = useState("all");

  const filteredNews = useMemo(() => {
    if (!news) return [];
    if (newsCategory === "all") return news;
    return news.filter((n: any) => n.category === newsCategory);
  }, [news, newsCategory]);

  // 按产品类型分组价格数据 (must be before any early return to respect hooks rules)
  const priceByProduct = useMemo(() => {
    if (!prices || prices.length === 0) return {};
    const map: Record<string, any[]> = {};
    prices.forEach((p: any) => {
      const key = p.productLabel || p.productType;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [prices]);

  // 最新价格（每个产品取最新一条）
  const latestPrices = useMemo(() => {
    return Object.entries(priceByProduct).map(([label, items]) => {
      const sorted = [...items].sort((a: any, b: any) => String(b.date || '').localeCompare(String(a.date || '')));
      const latest = sorted[0];
      return {
        label,
        price: latest.price,
        unit: latest.unit,
        priceUsd: latest.priceUsd,
        trend: latest.trend,
        changePercent: latest.changePercent,
        date: String(latest.date || ''),
        source: latest.source,
      };
    });
  }, [priceByProduct]);

  // 价格趋势图数据
  const priceTrendData = useMemo(() => {
    if (!prices || prices.length === 0) return [];
    const dateMap: Record<string, any> = {};
    prices.forEach((p: any) => {
      const dateStr = String(p.date || '');
      if (!dateMap[dateStr]) dateMap[dateStr] = { date: dateStr };
      dateMap[dateStr][p.productLabel || p.productType] = parseFloat(p.priceUsd || p.price);
    });
    return Object.values(dateMap).sort((a: any, b: any) => String(a.date || '').localeCompare(String(b.date || '')));
  }, [prices]);

  const productTypes = useMemo(() => Object.keys(priceByProduct), [priceByProduct]);
  const chartColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  // Early return for loading state - AFTER all hooks
  if (!region) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const flag = REGION_FLAGS[regionCode] || "🌍";
  const color = REGION_COLORS[regionCode] || "#6b7280";

  let producingAreas: { name: string; description: string }[] = [];
  let topCompanies: { name: string; description: string }[] = [];
  let dataSources: { name: string; url?: string }[] = [];
  try { producingAreas = JSON.parse(region.mainProducingAreas || "[]"); } catch { }
  try { topCompanies = JSON.parse(region.topCompanies || "[]"); } catch { }
  try { dataSources = JSON.parse(region.dataSources || "[]"); } catch { }

  return (
    <div className="space-y-6">
      {/* 产区头部 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-4xl">{flag}</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{region.name} 禽肉产业分析</h2>
              <p className="text-muted-foreground">{region.nameEn} Poultry Industry Analysis</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge style={{ backgroundColor: color, color: "white" }}>
                  全球产量第 {region.globalProductionRank} 位
                </Badge>
                <Badge variant="outline">
                  全球出口第 {region.globalExportRank} 位
                </Badge>
                <Badge variant="outline">
                  {region.dataYear} 年数据
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{region.statusDescription}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Package className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-xs text-muted-foreground">年产量</p>
              <p className="font-bold text-lg">{region.annualProductionMt}</p>
              <p className="text-xs text-muted-foreground">万吨</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Globe className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-xs text-muted-foreground">年出口量</p>
              <p className="font-bold text-lg">{region.annualExportMt}</p>
              <p className="text-xs text-muted-foreground">万吨</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Shield className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-xs text-muted-foreground">清真认证</p>
              <p className="font-bold text-lg">{region.halalCertification ? "✅" : "❌"}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Thermometer className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-xs text-muted-foreground">73°C 热处理</p>
              <p className="font-bold text-lg">{region.heatTreatmentCapability ? "✅" : "❌"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 内容 Tabs */}
      <Tabs defaultValue="prices" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prices" className="text-xs sm:text-sm">
            <DollarSign className="h-4 w-4 mr-1" />价格行情
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 mr-1" />疫病预警
          </TabsTrigger>
          <TabsTrigger value="news" className="text-xs sm:text-sm">
            <Newspaper className="h-4 w-4 mr-1" />产业动态
          </TabsTrigger>
          <TabsTrigger value="structure" className="text-xs sm:text-sm">
            <Building2 className="h-4 w-4 mr-1" />产业结构
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs sm:text-sm">
            <Globe className="h-4 w-4 mr-1" />数据来源
          </TabsTrigger>
        </TabsList>

        {/* 价格行情 Tab */}
        <TabsContent value="prices" className="space-y-4">
          {/* 最新价格卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {latestPrices.map((p: any, i: number) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground truncate">{p.label}</span>
                    <TrendIcon trend={p.trend} />
                  </div>
                  <p className="text-xl font-bold">{parseFloat(p.price).toFixed(2)}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{p.unit}</span>
                    {p.changePercent && (
                      <span className={`text-xs font-medium ${parseFloat(p.changePercent) > 0 ? "text-red-500" : "text-green-600"}`}>
                        {parseFloat(p.changePercent) > 0 ? "+" : ""}{parseFloat(p.changePercent).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.date} · {p.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 价格趋势图 */}
          {priceTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">价格走势（USD 换算）</CardTitle>
                <CardDescription>各品类价格月度/周度趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={priceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {productTypes.map((pt, i) => (
                      <Line key={pt} type="monotone" dataKey={pt} stroke={chartColors[i % chartColors.length]}
                        strokeWidth={2} dot={{ r: 3 }} name={pt} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 价格明细表 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">价格明细数据</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>品类</TableHead>
                      <TableHead className="text-right">价格</TableHead>
                      <TableHead>单位</TableHead>
                      <TableHead className="text-right">USD 换算</TableHead>
                      <TableHead>趋势</TableHead>
                      <TableHead className="text-right">环比</TableHead>
                      <TableHead>来源</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(prices || []).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">{String(p.date || '')}</TableCell>
                        <TableCell className="text-xs font-medium">{p.productLabel || p.productType}</TableCell>
                        <TableCell className="text-right text-xs font-mono">{parseFloat(p.price).toFixed(2)}</TableCell>
                        <TableCell className="text-xs">{p.unit}</TableCell>
                        <TableCell className="text-right text-xs font-mono">{p.priceUsd ? `$${parseFloat(p.priceUsd).toFixed(2)}` : "-"}</TableCell>
                        <TableCell><TrendIcon trend={p.trend} /></TableCell>
                        <TableCell className="text-right text-xs">
                          {p.changePercent ? (
                            <span className={parseFloat(p.changePercent) > 0 ? "text-red-500" : "text-green-600"}>
                              {parseFloat(p.changePercent) > 0 ? "+" : ""}{parseFloat(p.changePercent).toFixed(1)}%
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 疫病预警 Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {(!alerts || alerts.length === 0) ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">当前无疫病预警</p>
                <p className="text-sm">该产区近期未报告重大禽类疫病事件</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((a: any) => (
                <Card key={a.id} className={`border-l-4 ${
                  a.impactLevel === "critical" ? "border-l-red-600" :
                  a.impactLevel === "high" ? "border-l-orange-500" :
                  a.impactLevel === "medium" ? "border-l-yellow-500" : "border-l-green-500"
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-5 w-5 ${
                          a.impactLevel === "critical" ? "text-red-600" :
                          a.impactLevel === "high" ? "text-orange-500" : "text-yellow-500"
                        }`} />
                        <span className="font-bold">{a.diseaseType}</span>
                        <ImpactBadge level={a.impactLevel} />
                      </div>
                      <span className="text-xs text-muted-foreground">{String(a.date || '')}</span>
                    </div>
                    {a.location && (
                      <div className="flex items-center gap-1 mb-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />{a.location}
                      </div>
                    )}
                    <p className="text-sm mb-2">{a.description}</p>
                    {a.tradeImpact && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 rounded p-2 mt-2">
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">贸易影响</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">{a.tradeImpact}</p>
                      </div>
                    )}
                    {a.affectedBirds && (
                      <p className="text-xs text-muted-foreground mt-1">受影响禽只：{a.affectedBirds}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">来源：{a.source}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 产业动态 Tab */}
        <TabsContent value="news" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {["all", "policy", "company", "market", "technology", "trade"].map(cat => (
              <button
                key={cat}
                onClick={() => setNewsCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  newsCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat === "all" ? "全部" : cat === "policy" ? "政策法规" : cat === "company" ? "企业动态" :
                 cat === "market" ? "市场行情" : cat === "technology" ? "技术工艺" : "贸易动态"}
              </button>
            ))}
          </div>

          {filteredNews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Newspaper className="h-12 w-12 mx-auto mb-3" />
                <p>暂无该分类的产业动态</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNews.map((n: any) => (
                <Card key={n.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ImportanceBadge level={n.importance} />
                        <CategoryBadge cat={n.category} />
                        <span className="text-xs text-muted-foreground">{String(n.date || '')}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mb-2">{n.title}</h4>
                    {n.summary && <p className="text-sm text-muted-foreground mb-2">{n.summary}</p>}
                    {n.content && (
                      <details className="mt-2">
                        <summary className="text-xs text-primary cursor-pointer hover:underline">展开详情</summary>
                        <p className="text-sm mt-2 whitespace-pre-line">{n.content}</p>
                      </details>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">来源：{n.source}</p>
                      {n.sourceUrl && (
                        <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1">
                          原文链接 <ChevronRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 产业结构 Tab */}
        <TabsContent value="structure" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 主产区 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />主要产区分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {producingAreas.map((area, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <h4 className="font-bold text-sm">{area.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{area.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 龙头企业 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />龙头企业
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCompanies.map((comp, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        <h4 className="font-bold text-sm">{comp.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{comp.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 数据来源 Tab */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">数据来源与参考</CardTitle>
              <CardDescription>本产区分析数据来自以下权威机构和平台</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dataSources.map((src, i) => (
                  <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{src.name}</span>
                    </div>
                    {src.url && (
                      <a href={src.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline">
                        访问网站 →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== 全球疫病预警面板 ====================
function GlobalAlertsPanel() {
  const { data: alerts } = trpc.productionRegions.globalAlerts.useQuery({});

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 text-green-500" />
          <p className="font-medium">全球禽类疫病态势平稳</p>
          <p className="text-sm">近期无重大疫病预警</p>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = alerts.filter((a: any) => a.impactLevel === "critical").length;
  const highCount = alerts.filter((a: any) => a.impactLevel === "high").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-3 text-center">
            <Flame className="h-5 w-5 mx-auto mb-1 text-red-600" />
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            <p className="text-xs text-red-600/70">严重预警</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-bold text-orange-500">{highCount}</p>
            <p className="text-xs text-orange-500/70">高风险预警</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Activity className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{alerts.length}</p>
            <p className="text-xs text-muted-foreground">总预警数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Globe className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className="text-2xl font-bold">{new Set(alerts.map((a: any) => a.regionCode)).size}</p>
            <p className="text-xs text-muted-foreground">涉及产区</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {alerts.map((a: any) => (
          <Card key={a.id} className={`border-l-4 ${
            a.impactLevel === "critical" ? "border-l-red-600" :
            a.impactLevel === "high" ? "border-l-orange-500" :
            a.impactLevel === "medium" ? "border-l-yellow-500" : "border-l-green-500"
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{REGION_FLAGS[a.regionCode] || "🌍"}</span>
                  <span className="font-bold">{a.diseaseType}</span>
                  <ImpactBadge level={a.impactLevel} />
                </div>
                <span className="text-xs text-muted-foreground">{String(a.date || '')}</span>
              </div>
              {a.location && (
                <p className="text-sm text-muted-foreground mb-1"><MapPin className="h-3 w-3 inline mr-1" />{a.location}</p>
              )}
              <p className="text-sm">{a.description}</p>
              {a.tradeImpact && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded p-2 mt-2">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">贸易影响</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">{a.tradeImpact}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ==================== 产区对比面板 ====================
function RegionComparePanel({ regions }: { regions: any[] }) {
  if (!regions || regions.length === 0) return null;

  const radarData = regions.map(r => ({
    region: r.name,
    产量: parseFloat(r.annualProductionMt) / 100,
    出口: parseFloat(r.annualExportMt) / 100,
    清真: r.halalCertification ? 100 : 0,
    热处理: r.heatTreatmentCapability ? 100 : 0,
  }));

  const barData = regions.map(r => ({
    name: r.name,
    产量: parseFloat(r.annualProductionMt),
    出口: parseFloat(r.annualExportMt),
    fill: REGION_COLORS[r.code] || "#6b7280"
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 产量对比 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">产量与出口量对比（万吨）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="产量" fill="#3b82f6" />
                <Bar dataKey="出口" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 能力对比表 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">核心能力对比</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>产区</TableHead>
                  <TableHead className="text-right">产量(万吨)</TableHead>
                  <TableHead className="text-right">出口(万吨)</TableHead>
                  <TableHead className="text-center">清真</TableHead>
                  <TableHead className="text-center">73°C</TableHead>
                  <TableHead>产量排名</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map(r => (
                  <TableRow key={r.code}>
                    <TableCell className="font-medium">
                      <span className="mr-1">{REGION_FLAGS[r.code]}</span>{r.name}
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.annualProductionMt}</TableCell>
                    <TableCell className="text-right font-mono">{r.annualExportMt}</TableCell>
                    <TableCell className="text-center">{r.halalCertification ? "✅" : "❌"}</TableCell>
                    <TableCell className="text-center">{r.heatTreatmentCapability ? "✅" : "❌"}</TableCell>
                    <TableCell>#{r.globalProductionRank}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== 主页面 ====================
export default function ProductionRegionsPage() {
  const { data: regions, isLoading } = trpc.productionRegions.list.useQuery();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Factory className="h-7 w-7" />
          全球核心产区分析
        </h1>
        <p className="text-muted-foreground mt-1">
          Global Key Production Regions Analysis — 覆盖中国、美国、巴西、欧盟、泰国、土耳其六大核心禽肉产区
        </p>
      </div>

      {/* 主 Tab */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="overview">产区总览</TabsTrigger>
          <TabsTrigger value="alerts">全球疫病预警</TabsTrigger>
          <TabsTrigger value="compare">产区对比</TabsTrigger>
        </TabsList>

        {/* 产区总览 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 产区卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(regions || []).map((r: any) => (
              <RegionOverviewCard
                key={r.code}
                region={r}
                isSelected={selectedRegion === r.code}
                onClick={() => setSelectedRegion(selectedRegion === r.code ? null : r.code)}
              />
            ))}
          </div>

          {/* 选中产区的详情 */}
          {selectedRegion && <RegionDetailPanel regionCode={selectedRegion} />}
        </TabsContent>

        {/* 全球疫病预警 */}
        <TabsContent value="alerts">
          <GlobalAlertsPanel />
        </TabsContent>

        {/* 产区对比 */}
        <TabsContent value="compare">
          <RegionComparePanel regions={regions || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
