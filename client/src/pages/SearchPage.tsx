import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Globe, ExternalLink, ChevronLeft, ChevronRight, SlidersHorizontal, X, Star, Users, Linkedin } from "lucide-react";
import { useState, useMemo } from "react";
import CompanyDetailDialog from "@/components/CompanyDetailDialog";

const ROLE_TAGS = ["全产业链巨头", "进口商/贸易商", "加工商", "冷链物流", "养殖/饲料", "零售商/超市", "行业协会", "其他"];
const CREDIT_LEVELS = [
  { value: "excellent", label: "优秀 (80+)", min: 80 },
  { value: "good", label: "良好 (60-79)", min: 60 },
  { value: "average", label: "一般 (40-59)", min: 40 },
  { value: "low", label: "较低 (<40)", min: 0 },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("");
  const [role, setRole] = useState("");
  const [chinaOnly, setChinaOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  
  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [creditLevel, setCreditLevel] = useState("");
  const [hasContacts, setHasContacts] = useState(false);
  const [hasLinkedin, setHasLinkedin] = useState(false);
  const [country, setCountry] = useState("");

  const activeFilterCount = [creditLevel, hasContacts, hasLinkedin, country].filter(Boolean).length;

  const searchInput = useMemo(() => ({
    query: query || undefined, continent: continent || undefined,
    role: role || undefined, chinaOnly: chinaOnly || undefined, page, pageSize: 30,
  }), [query, continent, role, chinaOnly, page]);
  const { data, isLoading } = trpc.company.search.useQuery(searchInput);

  // Advanced search (only when advanced filters are active)
  const advancedInput = useMemo(() => ({
    query: query || undefined, continent: continent || undefined,
    role: role || undefined, chinaOnly: chinaOnly || undefined,
    country: country || undefined,
    minCreditScore: creditLevel ? CREDIT_LEVELS.find(l => l.value === creditLevel)?.min : undefined,
    hasContacts: hasContacts || undefined,
    hasLinkedin: hasLinkedin || undefined,
    page, pageSize: 30,
  }), [query, continent, role, chinaOnly, country, creditLevel, hasContacts, hasLinkedin, page]);
  
  const { data: advancedData, isLoading: advancedLoading } = trpc.company.advancedSearch.useQuery(advancedInput, {
    enabled: activeFilterCount > 0,
  });

  const displayData = activeFilterCount > 0 ? advancedData : data;
  const displayLoading = activeFilterCount > 0 ? advancedLoading : isLoading;
  const totalPages = displayData ? Math.ceil(displayData.total / 30) : 0;

  const clearAdvancedFilters = () => {
    setCreditLevel("");
    setHasContacts(false);
    setHasLinkedin(false);
    setCountry("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">全局搜索</h1>
        <p className="text-muted-foreground mt-1">跨 2,314 家企业实时搜索，支持多维度筛选。点击企业卡片查看详情、联系人和信用评级。</p>
      </div>
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索公司名称、国家、产品..." className="pl-9"
                value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
            </div>
            <Select value={continent} onValueChange={v => { setContinent(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="选择大洲" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部大洲</SelectItem>
                {["中东","非洲","东南亚","东亚","南亚","欧洲","北美洲","南美洲","独联体/中亚","大洋洲","其他"].map(c =>
                  <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={chinaOnly ? "default" : "outline"} size="sm"
              onClick={() => { setChinaOnly(!chinaOnly); setPage(1); }}>
              已在中国采购
            </Button>
            <Button variant={showAdvanced ? "default" : "outline"} size="sm" className="gap-1"
              onClick={() => setShowAdvanced(!showAdvanced)}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              高级筛选
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {ROLE_TAGS.map(r => (
              <Badge key={r} variant={role === r ? "default" : "outline"} className="cursor-pointer"
                onClick={() => { setRole(role === r ? "" : r); setPage(1); }}>{r}</Badge>
            ))}
          </div>

          {/* Advanced Filter Panel */}
          <Collapsible open={showAdvanced}>
            <CollapsibleContent>
              <div className="border-t pt-4 mt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <SlidersHorizontal className="h-4 w-4" />
                    高级筛选条件
                  </h4>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={clearAdvancedFilters}>
                      <X className="h-3 w-3" />
                      清除筛选
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Credit Rating Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3" />信用评级
                    </label>
                    <Select value={creditLevel} onValueChange={v => { setCreditLevel(v === "none" ? "" : v); setPage(1); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="不限评级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">不限评级</SelectItem>
                        {CREDIT_LEVELS.map(l => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Country Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" />指定国家
                    </label>
                    <Input placeholder="输入国家名称" className="h-9" value={country}
                      onChange={e => { setCountry(e.target.value); setPage(1); }} />
                  </div>

                  {/* Has Contacts Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />联系人
                    </label>
                    <Button variant={hasContacts ? "default" : "outline"} size="sm" className="w-full h-9 gap-1"
                      onClick={() => { setHasContacts(!hasContacts); setPage(1); }}>
                      <Users className="h-3.5 w-3.5" />
                      {hasContacts ? "仅有联系人" : "不限"}
                    </Button>
                  </div>

                  {/* Has LinkedIn Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Linkedin className="h-3 w-3" />LinkedIn
                    </label>
                    <Button variant={hasLinkedin ? "default" : "outline"} size="sm" className="w-full h-9 gap-1"
                      onClick={() => { setHasLinkedin(!hasLinkedin); setPage(1); }}>
                      <Linkedin className="h-3.5 w-3.5" />
                      {hasLinkedin ? "仅有LinkedIn" : "不限"}
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        {displayData ? `找到 ${displayData.total} 家企业` : displayLoading ? "搜索中..." : ""}
        {activeFilterCount > 0 && <span className="ml-2 text-primary">(已启用 {activeFilterCount} 个高级筛选)</span>}
      </div>

      <div className="space-y-2">
        {displayLoading ? Array.from({ length: 5 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>) : (
          displayData?.data.map((c: any) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCompany(c)}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{c.companyName}</h3>
                      {c.coreRole && <Badge variant="secondary" className="text-xs">{c.coreRole}</Badge>}
                      {c.hasPurchasedFromChina === "是" && <Badge className="text-xs bg-green-600">已在中国采购</Badge>}
                      {c.creditScore && (
                        <Badge variant="outline" className="text-xs gap-0.5">
                          <Star className="h-2.5 w-2.5" />
                          {c.creditScore}分
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{c.country}</span>
                      <span>{c.continent}</span>
                      {c.contactCount > 0 && (
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.contactCount}个联系人</span>
                      )}
                    </div>
                    {c.mainProducts && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{c.mainProducts}</p>}
                    {c.companyProfile && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.companyProfile}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.websiteSocial && (
                      <a href={c.websiteSocial.startsWith("http") ? c.websiteSocial : "https://" + c.websiteSocial}
                        target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">第 {page} / {totalPages} 页</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      <CompanyDetailDialog
        company={selectedCompany}
        open={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
}
