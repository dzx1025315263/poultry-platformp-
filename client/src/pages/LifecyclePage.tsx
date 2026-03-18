import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { getLoginUrl } from "@/const";
import { Users, Plus, Trash2, ArrowDown, Star, Filter, X } from "lucide-react";

const STAGES = [
  { key: "prospect", label: "潜在客户", color: "#3b82f6", bgClass: "bg-blue-50 border-blue-200", textClass: "text-blue-700" },
  { key: "contacted", label: "已联系", color: "#eab308", bgClass: "bg-yellow-50 border-yellow-200", textClass: "text-yellow-700" },
  { key: "quoted", label: "已报价", color: "#f97316", bgClass: "bg-orange-50 border-orange-200", textClass: "text-orange-700" },
  { key: "won", label: "已成交", color: "#22c55e", bgClass: "bg-green-50 border-green-200", textClass: "text-green-700" },
  { key: "repurchase", label: "复购", color: "#a855f7", bgClass: "bg-purple-50 border-purple-200", textClass: "text-purple-700" },
] as const;

const CREDIT_FILTERS = [
  { value: "all", label: "全部评级", min: undefined, max: undefined },
  { value: "excellent", label: "优秀 (80+)", min: 80, max: undefined },
  { value: "good", label: "良好 (60-79)", min: 60, max: 79 },
  { value: "average", label: "一般 (40-59)", min: 40, max: 59 },
  { value: "low", label: "较低 (<40)", min: undefined, max: 39 },
  { value: "unrated", label: "未评级", min: -1, max: -1 },
];

export default function LifecyclePage() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [addingStage, setAddingStage] = useState<string | null>(null);
  const [creditFilter, setCreditFilter] = useState("all");

  const selectedFilter = CREDIT_FILTERS.find(f => f.value === creditFilter) || CREDIT_FILTERS[0];
  const isFiltering = creditFilter !== "all";

  // Use funnelWithCredit when filtering, otherwise use regular funnel
  const { data: funnel, isLoading, refetch } = trpc.lifecycle.funnelWithCredit.useQuery(
    isFiltering && selectedFilter.min !== undefined
      ? { minCreditScore: selectedFilter.min === -1 ? undefined : selectedFilter.min, maxCreditScore: selectedFilter.max === -1 ? undefined : selectedFilter.max }
      : {},
    { enabled: isAuthenticated }
  );

  const addMutation = trpc.lifecycle.add.useMutation({ onSuccess: () => { refetch(); toast.success("已添加到生命周期"); } });
  const removeMutation = trpc.lifecycle.remove.useMutation({ onSuccess: () => { refetch(); toast.success("已移除"); } });

  const { data: searchResults } = trpc.company.search.useQuery(
    { query: searchQuery, pageSize: 8 },
    { enabled: searchQuery.length > 1 }
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先登录</h2>
        <p className="text-muted-foreground">登录后可使用客户生命周期管理功能</p>
        <Button onClick={() => window.location.href = getLoginUrl()}>登录</Button>
      </div>
    );
  }

  const stageData = useMemo(() => {
    if (!funnel) return STAGES.map(s => ({ ...s, items: [], count: 0 }));
    return STAGES.map(s => {
      const stageItems = funnel.items?.filter((f: any) => f.customer_lifecycle.stage === s.key) || [];
      const stageCount = funnel.stages?.find((st: any) => st.stage === s.key)?.cnt || 0;
      return { ...s, items: stageItems, count: Number(stageCount) };
    });
  }, [funnel]);

  const totalClients = stageData.reduce((sum, s) => sum + s.count, 0);
  const wonCount = stageData.find(s => s.key === "won")?.count || 0;
  const repurchaseCount = stageData.find(s => s.key === "repurchase")?.count || 0;
  const conversionRate = totalClients > 0 ? ((wonCount / totalClients) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">客户生命周期看板</h1>
          <p className="text-muted-foreground">可视化管理销售漏斗，追踪客户从潜在到成交的全流程</p>
        </div>

        {/* Credit Rating Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={creditFilter} onValueChange={setCreditFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="按信用评级筛选" />
            </SelectTrigger>
            <SelectContent>
              {CREDIT_FILTERS.map(f => (
                <SelectItem key={f.value} value={f.value}>
                  <span className="flex items-center gap-1.5">
                    {f.value !== "all" && f.value !== "unrated" && <Star className="h-3 w-3" />}
                    {f.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isFiltering && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCreditFilter("all")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isFiltering && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
          <Star className="h-4 w-4" />
          <span>当前筛选：<strong>{selectedFilter.label}</strong> 的客户</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-sm text-muted-foreground">漏斗总客户</div>
            <div className="text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-sm text-muted-foreground">已成交</div>
            <div className="text-2xl font-bold text-green-600">{wonCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-sm text-muted-foreground">转化率</div>
            <div className="text-2xl font-bold text-orange-600">{conversionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-sm text-muted-foreground">复购客户</div>
            <div className="text-2xl font-bold text-purple-600">{repurchaseCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Funnel - Trapezoid Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">销售漏斗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-1 max-w-lg mx-auto">
            {stageData.map((stage, i) => {
              const maxCount = Math.max(...stageData.map(s => s.count), 1);
              const widthPercent = totalClients > 0
                ? Math.max(30, (stage.count / maxCount) * 100)
                : 100 - i * 15;
              const convFromPrev = i > 0 && stageData[i - 1].count > 0
                ? ((stage.count / stageData[i - 1].count) * 100).toFixed(0)
                : null;
              return (
                <div key={stage.key} className="w-full flex flex-col items-center">
                  {i > 0 && convFromPrev && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground py-0.5">
                      <ArrowDown className="h-3 w-3" />
                      <span>{convFromPrev}%</span>
                    </div>
                  )}
                  <div
                    className={"flex items-center justify-between px-4 py-3 rounded-md border transition-all " + stage.bgClass}
                    style={{ width: widthPercent + "%" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className={"text-sm font-medium " + stage.textClass}>{stage.label}</span>
                    </div>
                    <span className={"text-lg font-bold " + stage.textClass}>{stage.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage Columns - Kanban Style */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stageData.map((stage) => (
          <Card key={stage.key} className="min-h-[280px]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <CardTitle className="text-sm">{stage.label}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{stage.count}</Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                  onClick={() => setAddingStage(addingStage === stage.key ? null : stage.key)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {addingStage === stage.key && (
                <div className="space-y-2 p-2 border rounded-md bg-muted/50">
                  <Input placeholder="搜索企业名称..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} className="h-8 text-xs" />
                  {searchResults?.data?.slice(0, 5).map((c: any) => (
                    <button key={c.id} className="w-full text-left text-xs p-1.5 rounded hover:bg-accent truncate"
                      onClick={() => {
                        addMutation.mutate({ companyId: c.id, stage: stage.key as any });
                        setAddingStage(null);
                        setSearchQuery("");
                      }}>
                      {c.companyName}
                    </button>
                  ))}
                </div>
              )}
              {stage.items.map((item: any) => {
                const company = item.companies || {};
                const lifecycle = item.customer_lifecycle || {};
                const creditScore = item.creditScore;
                return (
                  <div key={lifecycle.companyId || item.companyId}
                    className="p-2 border rounded-md bg-background hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {company.companyName || "企业#" + (lifecycle.companyId || "")}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {company.country && (
                            <p className="text-[10px] text-muted-foreground">{company.country}</p>
                          )}
                          {creditScore !== undefined && creditScore !== null && (
                            <Badge variant="outline" className={`text-[9px] h-3.5 px-1 ${
                              creditScore >= 80 ? 'border-green-300 text-green-600' :
                              creditScore >= 60 ? 'border-yellow-300 text-yellow-600' :
                              creditScore >= 40 ? 'border-orange-300 text-orange-600' :
                              'border-red-300 text-red-600'
                            }`}>
                              <Star className="h-2 w-2 mr-0.5" />{creditScore}
                            </Badge>
                          )}
                        </div>
                        {lifecycle.dealValue && (
                          <p className="text-[10px] text-green-600 font-medium">
                            {lifecycle.dealValue}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMutation.mutate({ companyId: lifecycle.companyId || item.companyId })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {stage.items.length === 0 && addingStage !== stage.key && (
                <p className="text-xs text-muted-foreground text-center py-4">暂无客户</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
