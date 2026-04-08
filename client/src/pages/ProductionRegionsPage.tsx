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
  ChevronRight, Activity, Flame, Snowflake, Thermometer, BookOpen,
  FileText, Wheat, Microscope, Stethoscope, Syringe, Bug, Scale,
  ExternalLink, ChevronDown, ChevronUp, Landmark, Users
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area
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

function PolicyTypeBadge({ type }: { type: string }) {
  const config: Record<string, { color: string; label: string }> = {
    trade: { color: "bg-blue-100 text-blue-800", label: "贸易政策" },
    welfare: { color: "bg-green-100 text-green-800", label: "动物福利" },
    food_safety: { color: "bg-red-100 text-red-800", label: "食品安全" },
    veterinary: { color: "bg-purple-100 text-purple-800", label: "兽医法规" },
    environmental: { color: "bg-emerald-100 text-emerald-800", label: "环境政策" },
    subsidy: { color: "bg-amber-100 text-amber-800", label: "补贴政策" },
  };
  const c = config[type] || { color: "bg-gray-100 text-gray-800", label: type };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.color}`}>{c.label}</span>;
}

function TrendIcon({ trend }: { trend?: string | null }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-green-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function PrevalenceBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; label: string }> = {
    endemic: { color: "bg-red-100 text-red-800", label: "地方性流行" },
    sporadic: { color: "bg-yellow-100 text-yellow-800", label: "散发" },
    rare: { color: "bg-green-100 text-green-800", label: "罕见" },
    emerging: { color: "bg-purple-100 text-purple-800", label: "新发" },
  };
  const c = config[level] || config.sporadic;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.color}`}>{c.label}</span>;
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

// ==================== 分区域报价面板 ====================
function SubAreaPricesPanel({ regionCode }: { regionCode: string }) {
  const { data: subPrices } = trpc.productionRegions.subAreaPrices.useQuery({ regionCode });

  const grouped = useMemo(() => {
    if (!subPrices || subPrices.length === 0) return {};
    const map: Record<string, any[]> = {};
    subPrices.forEach((p: any) => {
      const key = p.subAreaLocal || p.subArea;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [subPrices]);

  const latestByArea = useMemo(() => {
    return Object.entries(grouped).map(([area, items]) => {
      const broilerItems = items.filter((i: any) => i.productType === 'broiler');
      const latest = broilerItems.sort((a: any, b: any) => String(b.date || '').localeCompare(String(a.date || '')))[0];
      return { area, latest, allProducts: items.filter((i: any) => i.date === (latest?.date || '')) };
    }).filter(x => x.latest);
  }, [grouped]);

  if (!subPrices || subPrices.length === 0) {
    return <div className="text-center text-muted-foreground py-8">暂无分区域报价数据</div>;
  }

  const chartData = latestByArea.map(({ area, latest }) => ({
    name: area.length > 4 ? area.slice(0, 4) + '..' : area,
    fullName: area,
    price: parseFloat(latest?.priceUsd || latest?.price || '0'),
  })).sort((a, b) => b.price - a.price);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />分区域报价对比（USD）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [`$${v}`, '价格']} labelFormatter={(l: any) => {
                const item = chartData.find(d => d.name === l);
                return item?.fullName || l;
              }} />
              <Bar dataKey="price" fill={REGION_COLORS[regionCode] || '#6b7280'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">分区域报价明细</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>地区</TableHead>
                  <TableHead>产品</TableHead>
                  <TableHead className="text-right">价格</TableHead>
                  <TableHead className="text-right">USD</TableHead>
                  <TableHead className="text-center">趋势</TableHead>
                  <TableHead className="text-right">涨跌</TableHead>
                  <TableHead>日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subPrices.slice(0, 30).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-xs">{p.subAreaLocal || p.subArea}</TableCell>
                    <TableCell className="text-xs">{p.productLabel || p.productType}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{p.price} {p.unit}</TableCell>
                    <TableCell className="text-right font-mono text-xs">${p.priceUsd}</TableCell>
                    <TableCell className="text-center"><TrendIcon trend={p.trend} /></TableCell>
                    <TableCell className={`text-right text-xs font-mono ${parseFloat(p.changePercent || '0') > 0 ? 'text-red-500' : parseFloat(p.changePercent || '0') < 0 ? 'text-green-600' : ''}`}>
                      {p.changePercent ? `${parseFloat(p.changePercent) > 0 ? '+' : parseFloat(p.changePercent) < 0 ? '-' : ''}${Math.abs(parseFloat(p.changePercent)).toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{String(p.date || '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 饲料原料价格面板 ====================
function FeedPricesPanel({ regionCode }: { regionCode: string }) {
  const { data: feedPrices } = trpc.productionRegions.feedPrices.useQuery({ regionCode });

  const latestFeed = useMemo(() => {
    if (!feedPrices || feedPrices.length === 0) return [];
    const map: Record<string, any> = {};
    feedPrices.forEach((f: any) => {
      const key = f.feedType;
      if (!map[key] || String(f.date || '') > String(map[key].date || '')) {
        map[key] = f;
      }
    });
    return Object.values(map);
  }, [feedPrices]);

  const trendData = useMemo(() => {
    if (!feedPrices || feedPrices.length === 0) return [];
    const dateMap: Record<string, any> = {};
    feedPrices.forEach((f: any) => {
      const d = String(f.date || '');
      if (!dateMap[d]) dateMap[d] = { date: d };
      dateMap[d][f.feedLabel || f.feedType] = parseFloat(f.priceUsd || f.price);
    });
    return Object.values(dateMap).sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)));
  }, [feedPrices]);

  const feedTypes = useMemo(() => {
    if (!feedPrices) return [];
    return [...new Set(feedPrices.map((f: any) => f.feedLabel || f.feedType))];
  }, [feedPrices]);

  if (!feedPrices || feedPrices.length === 0) {
    return <div className="text-center text-muted-foreground py-8">暂无饲料原料价格数据</div>;
  }

  const feedColors = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {latestFeed.map((f: any, i: number) => (
          <Card key={f.id} className="border-l-4" style={{ borderLeftColor: feedColors[i % feedColors.length] }}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <Wheat className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-medium">{f.feedLabel || f.feedType}</span>
              </div>
              <p className="font-bold text-lg">${f.priceUsd || f.price}</p>
              <p className="text-xs text-muted-foreground">{f.price} {f.unit}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon trend={f.trend} />
                <span className={`text-xs font-mono ${parseFloat(f.changePercent || '0') > 0 ? 'text-red-500' : parseFloat(f.changePercent || '0') < 0 ? 'text-green-600' : ''}`}>
                  {f.changePercent ? `${parseFloat(f.changePercent) > 0 ? '+' : parseFloat(f.changePercent) < 0 ? '-' : ''}${Math.abs(parseFloat(f.changePercent)).toFixed(1)}%` : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trendData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wheat className="h-4 w-4" />饲料原料价格趋势（USD）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {feedTypes.map((ft: string, i: number) => (
                  <Line key={ft} type="monotone" dataKey={ft} stroke={feedColors[i % feedColors.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== 疫病防控知识库面板 ====================
function DiseaseLibraryPanel({ regionCode }: { regionCode: string }) {
  const { data: diseases } = trpc.productionRegions.diseaseLibrary.useQuery({ regionCode });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => {
    if (!diseases) return [];
    return [...new Set(diseases.map((d: any) => d.diseaseCategory))];
  }, [diseases]);

  const filtered = useMemo(() => {
    if (!diseases) return [];
    if (categoryFilter === "all") return diseases;
    return diseases.filter((d: any) => d.diseaseCategory === categoryFilter);
  }, [diseases, categoryFilter]);

  const categoryLabels: Record<string, string> = {
    viral: "病毒性疾病", bacterial: "细菌性疾病", respiratory: "呼吸道疾病",
    parasitic: "寄生虫病", digestive: "消化道疾病", immune: "免疫抑制病",
  };

  const categoryIcons: Record<string, any> = {
    viral: Bug, bacterial: Microscope, respiratory: Stethoscope,
    parasitic: Bug, digestive: Stethoscope, immune: Syringe,
  };

  if (!diseases || diseases.length === 0) {
    return <div className="text-center text-muted-foreground py-8">暂无疫病知识库数据</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant={categoryFilter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setCategoryFilter("all")}>
          全部 ({diseases.length})
        </Badge>
        {categories.map((cat: string) => {
          const count = diseases.filter((d: any) => d.diseaseCategory === cat).length;
          return (
            <Badge key={cat} variant={categoryFilter === cat ? "default" : "outline"} className="cursor-pointer" onClick={() => setCategoryFilter(cat)}>
              {categoryLabels[cat] || cat} ({count})
            </Badge>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((d: any) => {
          const isExpanded = expandedId === d.id;
          const IconComp = categoryIcons[d.diseaseCategory] || Bug;
          return (
            <Card key={d.id} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <IconComp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{d.diseaseName}</h4>
                      <p className="text-xs text-muted-foreground">{d.diseaseNameEn}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{categoryLabels[d.diseaseCategory] || d.diseaseCategory}</Badge>
                        <PrevalenceBadge level={d.prevalenceLevel} />
                        {d.regionCode ? (
                          <span className="text-xs text-muted-foreground">{REGION_FLAGS[d.regionCode]} 产区特有</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">🌍 全球通用</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {d.pathogen && (
                      <div>
                        <h5 className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1"><Microscope className="h-3 w-3" />病原体</h5>
                        <p className="text-sm">{d.pathogen}</p>
                      </div>
                    )}
                    {d.symptoms && (
                      <div>
                        <h5 className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1"><Stethoscope className="h-3 w-3" />临床症状</h5>
                        <p className="text-sm">{d.symptoms}</p>
                      </div>
                    )}
                    {d.pathologicalChanges && (
                      <div>
                        <h5 className="text-xs font-bold text-muted-foreground mb-1">病理变化</h5>
                        <p className="text-sm">{d.pathologicalChanges}</p>
                      </div>
                    )}
                    {d.diagnosis && (
                      <div>
                        <h5 className="text-xs font-bold text-muted-foreground mb-1">诊断方法</h5>
                        <p className="text-sm">{d.diagnosis}</p>
                      </div>
                    )}
                    {d.prevention && (
                      <div>
                        <h5 className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1"><Shield className="h-3 w-3" />预防措施</h5>
                        <p className="text-sm">{d.prevention}</p>
                      </div>
                    )}
                    {d.treatment && (
                      <div>
                        <h5 className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1"><Syringe className="h-3 w-3" />治疗方案</h5>
                        <p className="text-sm">{d.treatment}</p>
                      </div>
                    )}
                    {d.vaccineInfo && (
                      <div className="md:col-span-2">
                        <h5 className="text-xs font-bold text-muted-foreground mb-1">疫苗信息</h5>
                        <p className="text-sm">{d.vaccineInfo}</p>
                      </div>
                    )}
                    {d.economicImpact && (
                      <div className="md:col-span-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                        <h5 className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-1"><DollarSign className="h-3 w-3" />经济影响</h5>
                        <p className="text-sm text-amber-700 dark:text-amber-300">{d.economicImpact}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ==================== 政策法规面板 ====================
function PoliciesPanel({ regionCode }: { regionCode: string }) {
  const { data: policies } = trpc.productionRegions.policies.useQuery({ regionCode });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!policies || policies.length === 0) {
    return <div className="text-center text-muted-foreground py-8">暂无政策法规数据</div>;
  }

  return (
    <div className="space-y-3">
      {policies.map((p: any) => {
        const isExpanded = expandedId === p.id;
        return (
          <Card key={p.id} className={`overflow-hidden border-l-4 ${
            p.status === 'active' ? 'border-l-green-500' : p.status === 'pending' ? 'border-l-amber-500' : 'border-l-gray-400'
          }`}>
            <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <PolicyTypeBadge type={p.policyType} />
                    <Badge variant="outline" className="text-xs">
                      {p.status === 'active' ? '生效中' : p.status === 'pending' ? '待生效' : '已过期'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{String(p.date || '')}</span>
                  </div>
                  <h4 className="font-bold text-sm">{p.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.summary}</p>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 ml-2 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />}
              </div>
            </div>
            {isExpanded && (
              <div className="px-4 pb-4 border-t space-y-3">
                {p.content && (
                  <div className="mt-3">
                    <h5 className="text-xs font-bold text-muted-foreground mb-1">详细内容</h5>
                    <p className="text-sm">{p.content}</p>
                  </div>
                )}
                {p.impactOnTrade && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                    <h5 className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-1"><Globe className="h-3 w-3" />贸易影响分析</h5>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{p.impactOnTrade}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {p.effectiveDate && <span>生效日期: {p.effectiveDate}</span>}
                  {p.source && <span>来源: {p.source}</span>}
                  {p.sourceUrl && (
                    <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />原文链接
                    </a>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ==================== 龙头企业档案面板 ====================
function CompanyProfilesPanel({ regionCode }: { regionCode: string }) {
  const { data: companies } = trpc.productionRegions.companyProfiles.useQuery({ regionCode });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!companies || companies.length === 0) {
    return <div className="text-center text-muted-foreground py-8">暂无企业档案数据</div>;
  }

  return (
    <div className="space-y-4">
      {companies.map((c: any) => {
        const isExpanded = expandedId === c.id;
        let exportMarkets: string[] = [];
        let certifications: string[] = [];
        let recentNews: string[] = [];
        try { exportMarkets = JSON.parse(c.exportMarkets || '[]'); } catch {}
        try { certifications = JSON.parse(c.certifications || '[]'); } catch {}
        try { recentNews = JSON.parse(c.recentNews || '[]'); } catch {}

        return (
          <Card key={c.id} className="overflow-hidden">
            <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{c.companyName}</h4>
                    {c.companyNameLocal && <p className="text-xs text-muted-foreground">{c.companyNameLocal}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {c.companyType === 'integrator' ? '全产业链' : c.companyType === 'processor' ? '加工商' : c.companyType === 'breeder' ? '育种商' : '出口商'}
                      </Badge>
                      {c.annualCapacityMt && <span className="text-xs text-muted-foreground">年产能 {c.annualCapacityMt} 万吨</span>}
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
            {isExpanded && (
              <div className="px-4 pb-4 border-t space-y-3 mt-3">
                <p className="text-sm">{c.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {c.annualRevenue && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">年营收</p>
                      <p className="font-bold text-sm">{c.annualRevenue}</p>
                    </div>
                  )}
                  {c.employeeCount && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />员工数</p>
                      <p className="font-bold text-sm">{parseInt(c.employeeCount).toLocaleString()}</p>
                    </div>
                  )}
                  {c.annualCapacityMt && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">年产能</p>
                      <p className="font-bold text-sm">{c.annualCapacityMt} 万吨</p>
                    </div>
                  )}
                </div>
                {certifications.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground mb-1">认证资质</h5>
                    <div className="flex flex-wrap gap-1">
                      {certifications.map((cert: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {exportMarkets.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground mb-1">出口市场</h5>
                    <div className="flex flex-wrap gap-1">
                      {exportMarkets.map((m: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {recentNews.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground mb-1">最新动态</h5>
                    <ul className="space-y-1">
                      {recentNews.map((n: string, i: number) => (
                        <li key={i} className="text-xs flex items-start gap-1">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />访问官网
                  </a>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ==================== 产区详情面板（升级版） ====================
function RegionDetailPanel({ regionCode }: { regionCode: string }) {
  const { data: region } = trpc.productionRegions.getByCode.useQuery({ code: regionCode });
  const { data: prices } = trpc.productionRegions.marketPrices.useQuery({ regionCode });
  const { data: alerts } = trpc.productionRegions.diseaseAlerts.useQuery({ regionCode });
  const { data: news } = trpc.productionRegions.industryNews.useQuery({ regionCode });
  const [newsCategory, setNewsCategory] = useState("all");
  const [detailTab, setDetailTab] = useState("prices");

  const filteredNews = useMemo(() => {
    if (!news) return [];
    if (newsCategory === "all") return news;
    return news.filter((n: any) => n.category === newsCategory);
  }, [news, newsCategory]);

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
                <Badge variant="outline">全球出口第 {region.globalExportRank} 位</Badge>
                <Badge variant="outline">{region.dataYear} 年数据</Badge>
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
              {region.halalCertification ? <Shield className="h-5 w-5 mx-auto mb-1 text-emerald-500" /> : <Shield className="h-5 w-5 mx-auto mb-1 text-gray-300" />}
              <p className="text-xs text-muted-foreground">清真认证</p>
              <p className="font-bold text-lg">{region.halalCertification ? "✓" : "—"}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Thermometer className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-xs text-muted-foreground">73°C 热处理</p>
              <p className="font-bold text-lg">{region.heatTreatmentCapability ? "✓" : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详情 Tabs - 升级版 */}
      <Tabs value={detailTab} onValueChange={setDetailTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="prices" className="text-xs"><DollarSign className="h-3 w-3 mr-1" />价格行情</TabsTrigger>
          <TabsTrigger value="subarea" className="text-xs"><MapPin className="h-3 w-3 mr-1" />分区域报价</TabsTrigger>
          <TabsTrigger value="feed" className="text-xs"><Wheat className="h-3 w-3 mr-1" />饲料原料</TabsTrigger>
          <TabsTrigger value="diseases" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />疫病预警</TabsTrigger>
          <TabsTrigger value="library" className="text-xs"><BookOpen className="h-3 w-3 mr-1" />疫病图谱</TabsTrigger>
          <TabsTrigger value="news" className="text-xs"><Newspaper className="h-3 w-3 mr-1" />产业动态</TabsTrigger>
          <TabsTrigger value="policies" className="text-xs"><Landmark className="h-3 w-3 mr-1" />政策法规</TabsTrigger>
          <TabsTrigger value="companies" className="text-xs"><Building2 className="h-3 w-3 mr-1" />龙头企业</TabsTrigger>
          <TabsTrigger value="structure" className="text-xs"><Factory className="h-3 w-3 mr-1" />产业结构</TabsTrigger>
          <TabsTrigger value="sources" className="text-xs"><Globe className="h-3 w-3 mr-1" />数据来源</TabsTrigger>
        </TabsList>

        {/* 价格行情 Tab */}
        <TabsContent value="prices" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {latestPrices.map((p, i) => (
              <Card key={i} className="border-l-4" style={{ borderLeftColor: chartColors[i % chartColors.length] }}>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{p.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-lg">{p.price}</span>
                    <span className="text-xs text-muted-foreground">{p.unit}</span>
                  </div>
                  {p.priceUsd && <p className="text-xs text-muted-foreground">≈ ${p.priceUsd} USD</p>}
                  <div className="flex items-center gap-1 mt-1">
                    <TrendIcon trend={p.trend} />
                    <span className={`text-xs font-mono ${parseFloat(p.changePercent || '0') > 0 ? 'text-red-500' : parseFloat(p.changePercent || '0') < 0 ? 'text-green-600' : ''}`}>
                      {p.changePercent ? `${parseFloat(p.changePercent) > 0 ? '+' : parseFloat(p.changePercent) < 0 ? '-' : ''}${Math.abs(parseFloat(p.changePercent)).toFixed(1)}%` : '-'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {priceTrendData.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">价格趋势（USD）</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={priceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    {productTypes.map((pt, i) => (
                      <Area key={pt} type="monotone" dataKey={pt} stroke={chartColors[i % chartColors.length]} fill={chartColors[i % chartColors.length]} fillOpacity={0.1} strokeWidth={2} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">价格明细</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品</TableHead>
                      <TableHead className="text-right">价格</TableHead>
                      <TableHead className="text-right">USD</TableHead>
                      <TableHead className="text-center">趋势</TableHead>
                      <TableHead className="text-right">涨跌</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>来源</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(prices || []).slice(0, 20).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-xs">{p.productLabel || p.productType}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{p.price} {p.unit}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{p.priceUsd ? `$${p.priceUsd}` : '-'}</TableCell>
                        <TableCell className="text-center"><TrendIcon trend={p.trend} /></TableCell>
                        <TableCell className={`text-right text-xs font-mono ${parseFloat(p.changePercent || '0') > 0 ? 'text-red-500' : parseFloat(p.changePercent || '0') < 0 ? 'text-green-600' : ''}`}>
                          {p.changePercent ? `${parseFloat(p.changePercent) > 0 ? '+' : parseFloat(p.changePercent) < 0 ? '-' : ''}${Math.abs(parseFloat(p.changePercent)).toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{String(p.date || '')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 分区域报价 Tab */}
        <TabsContent value="subarea">
          <SubAreaPricesPanel regionCode={regionCode} />
        </TabsContent>

        {/* 饲料原料 Tab */}
        <TabsContent value="feed">
          <FeedPricesPanel regionCode={regionCode} />
        </TabsContent>

        {/* 疫病预警 Tab */}
        <TabsContent value="diseases" className="space-y-3">
          {(!alerts || alerts.length === 0) ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">该产区近期无重大疫病预警</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((a: any) => (
              <Card key={a.id} className={`border-l-4 ${
                a.impactLevel === "critical" ? "border-l-red-600" :
                a.impactLevel === "high" ? "border-l-orange-500" :
                a.impactLevel === "medium" ? "border-l-yellow-500" : "border-l-green-500"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{a.diseaseType}</span>
                      <ImpactBadge level={a.impactLevel} />
                    </div>
                    <span className="text-xs text-muted-foreground">{String(a.date || '')}</span>
                  </div>
                  {a.location && <p className="text-sm text-muted-foreground mb-1"><MapPin className="h-3 w-3 inline mr-1" />{a.location}</p>}
                  {a.affectedBirds && <p className="text-xs text-muted-foreground mb-1">受影响禽只: {parseInt(a.affectedBirds).toLocaleString()}</p>}
                  <p className="text-sm">{a.description}</p>
                  {a.tradeImpact && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded p-2 mt-2">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">贸易影响</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">{a.tradeImpact}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* 疫病图谱 Tab */}
        <TabsContent value="library">
          <DiseaseLibraryPanel regionCode={regionCode} />
        </TabsContent>

        {/* 产业动态 Tab */}
        <TabsContent value="news" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["all", "policy", "company", "market", "technology", "trade"].map(cat => (
              <Badge key={cat} variant={newsCategory === cat ? "default" : "outline"} className="cursor-pointer" onClick={() => setNewsCategory(cat)}>
                {cat === "all" ? "全部" : { policy: "政策法规", company: "企业动态", market: "市场行情", technology: "技术工艺", trade: "贸易动态" }[cat]}
              </Badge>
            ))}
          </div>
          {filteredNews.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">暂无相关产业动态</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredNews.map((n: any) => (
                <Card key={n.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CategoryBadge cat={n.category} />
                        <ImportanceBadge level={n.importance} />
                      </div>
                      <span className="text-xs text-muted-foreground">{String(n.date || '')}</span>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{n.title}</h4>
                    <p className="text-xs text-muted-foreground">{n.summary}</p>
                    {n.source && <p className="text-xs text-muted-foreground mt-2">来源: {n.source}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 政策法规 Tab */}
        <TabsContent value="policies">
          <PoliciesPanel regionCode={regionCode} />
        </TabsContent>

        {/* 龙头企业 Tab */}
        <TabsContent value="companies">
          <CompanyProfilesPanel regionCode={regionCode} />
        </TabsContent>

        {/* 产业结构 Tab */}
        <TabsContent value="structure" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />主产区分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {producingAreas.map((area, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm">{area.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{area.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />龙头企业</CardTitle>
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
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />访问网站
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
              {a.location && <p className="text-sm text-muted-foreground mb-1"><MapPin className="h-3 w-3 inline mr-1" />{a.location}</p>}
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

  const barData = regions.map(r => ({
    name: r.name,
    产量: parseFloat(r.annualProductionMt),
    出口: parseFloat(r.annualExportMt),
    fill: REGION_COLORS[r.code] || "#6b7280"
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">产量与出口量对比（万吨）</CardTitle></CardHeader>
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
        <Card>
          <CardHeader><CardTitle className="text-base">核心能力对比</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>产区</TableHead>
                  <TableHead className="text-right">产量(万吨)</TableHead>
                  <TableHead className="text-right">出口(万吨)</TableHead>
                  <TableHead className="text-center">清真</TableHead>
                  <TableHead className="text-center">73°C</TableHead>
                  <TableHead>排名</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map(r => (
                  <TableRow key={r.code}>
                    <TableCell className="font-medium"><span className="mr-1">{REGION_FLAGS[r.code]}</span>{r.name}</TableCell>
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Factory className="h-7 w-7" />
          全球核心产区分析
        </h1>
        <p className="text-muted-foreground mt-1">
          Global Key Production Regions Analysis — 覆盖中国、美国、巴西、欧盟、泰国、土耳其六大核心禽肉产区
        </p>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="overview">产区总览</TabsTrigger>
          <TabsTrigger value="alerts">全球疫病预警</TabsTrigger>
          <TabsTrigger value="compare">产区对比</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
          {selectedRegion && <RegionDetailPanel regionCode={selectedRegion} />}
        </TabsContent>

        <TabsContent value="alerts">
          <GlobalAlertsPanel />
        </TabsContent>

        <TabsContent value="compare">
          <RegionComparePanel regions={regions || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
