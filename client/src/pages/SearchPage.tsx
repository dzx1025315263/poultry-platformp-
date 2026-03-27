import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Globe, ExternalLink, ChevronLeft, ChevronRight, SlidersHorizontal, X, Star, Users, Linkedin, Lock, MessageCircle, Building2, Shield } from "lucide-react";
import { useState, useMemo } from "react";
import CompanyDetailDialog from "@/components/CompanyDetailDialog";

const ROLE_TAGS = ["全产业链巨头", "进口商/贸易商", "加工商", "冷链物流", "养殖/饲料", "零售商/超市", "行业协会", "其他"];
const CREDIT_LEVELS = [
  { value: "excellent", label: "优秀 (80+)", min: 80 },
  { value: "good", label: "良好 (60-79)", min: 60 },
  { value: "average", label: "一般 (40-59)", min: 40 },
  { value: "low", label: "较低 (<40)", min: 0 },
];

/* ─── Contact Us CTA Modal ─── */
function ContactCTA({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white text-center">
          <img src="/ugg-logo-sm.png" alt="UGG" className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-4 object-contain p-1" />
          <h2 className="text-xl font-bold">解锁完整企业信息</h2>
          <p className="text-blue-100 mt-2 text-sm">
            获取全球 2,300+ 家禽业企业的完整名称、联系方式和业务详情
          </p>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">完整企业名称与联系方式</p>
                <p className="text-xs text-muted-foreground mt-0.5">包括企业简介、网站、社交媒体等详细信息</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">关键联系人信息</p>
                <p className="text-xs text-muted-foreground mt-0.5">决策者姓名、职位、邮箱和 LinkedIn</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">信用评级与采购历史</p>
                <p className="text-xs text-muted-foreground mt-0.5">企业信用评分、中国采购记录和偏好分析</p>
              </div>
            </div>
          </div>
          <div className="pt-2 space-y-2">
            <Button className="w-full h-11 text-base gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={onClose}>
              <MessageCircle className="h-4 w-4" />
              联系我们获取完整数据
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Universal Gourmand Group — 全球禽业数据协作平台
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { user } = useAuth();
  const isGuest = !user;
  const [showContactCTA, setShowContactCTA] = useState(false);

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

  const handleCardClick = (c: any) => {
    if (isGuest) {
      setShowContactCTA(true);
    } else {
      setSelectedCompany(c);
    }
  };

  return (
    <div className="space-y-4">
      <ContactCTA open={showContactCTA} onClose={() => setShowContactCTA(false)} />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">全局搜索</h1>
          <p className="text-muted-foreground mt-1">跨 2,314 家企业实时搜索，支持多维度筛选。{isGuest ? "登录后可查看完整企业信息。" : "点击企业卡片查看详情、联系人和信用评级。"}</p>
        </div>
        {isGuest && (
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shrink-0"
            onClick={() => setShowContactCTA(true)}
          >
            <MessageCircle className="h-4 w-4" />
            联系我们
          </Button>
        )}
      </div>

      {/* Guest info banner */}
      {isGuest && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/ugg-logo-sm.png" alt="UGG" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                企业名称和详细简介仅对会员可见
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
                您可以查看企业的核心角色、所在地区和主营产品
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100" onClick={() => setShowContactCTA(true)}>
            了解更多
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={isGuest ? "搜索国家、产品、角色..." : "搜索公司名称、国家、产品..."} className="pl-9"
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
            {!isGuest && (
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
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {ROLE_TAGS.map(r => (
              <Badge key={r} variant={role === r ? "default" : "outline"} className="cursor-pointer"
                onClick={() => { setRole(role === r ? "" : r); setPage(1); }}>{r}</Badge>
            ))}
          </div>

          {/* Advanced Filter Panel — only for logged-in users */}
          {!isGuest && (
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
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        {displayData ? `找到 ${displayData.total} 家企业` : displayLoading ? "搜索中..." : ""}
        {!isGuest && activeFilterCount > 0 && <span className="ml-2 text-primary">(已启用 {activeFilterCount} 个高级筛选)</span>}
      </div>

      <div className="space-y-2">
        {displayLoading ? Array.from({ length: 5 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>) : (
          displayData?.data.map((c: any) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCardClick(c)}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isGuest ? (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm select-none" style={{ filter: "blur(4px)", WebkitUserSelect: "none" }}>{c.companyName}</span>
                          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                      ) : (
                        <h3 className="font-semibold text-sm">{c.companyName}</h3>
                      )}
                      {c.coreRole && <Badge variant="secondary" className="text-xs">{c.coreRole}</Badge>}
                      {!isGuest && c.hasPurchasedFromChina === "是" && <Badge className="text-xs bg-green-600">已在中国采购</Badge>}
                      {!isGuest && c.creditScore && (
                        <Badge variant="outline" className="text-xs gap-0.5">
                          <Star className="h-2.5 w-2.5" />
                          {c.creditScore}分
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{c.country}</span>
                      <span>{c.continent}</span>
                      {!isGuest && c.contactCount > 0 && (
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.contactCount}个联系人</span>
                      )}
                    </div>
                    {c.mainProducts && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{c.mainProducts}</p>}
                    {!isGuest && c.companyProfile && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.companyProfile}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!isGuest && c.websiteSocial && (
                      <a href={c.websiteSocial.startsWith("http") ? c.websiteSocial : "https://" + c.websiteSocial}
                        target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                    {isGuest && (
                      <div className="p-1.5 rounded-md text-blue-600">
                        <Lock className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Guest CTA at bottom */}
      {isGuest && (displayData?.total || 0) > 0 && (
        <div className="p-5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 text-center">
          <img src="/ugg-logo-sm.png" alt="UGG" className="w-12 h-12 mx-auto mb-3 object-contain" />
          <p className="text-base font-semibold text-blue-800 dark:text-blue-200">
            解锁全部 {displayData?.total?.toLocaleString()} 家企业的完整信息
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
            包括企业名称、联系方式、业务详情、采购历史等
          </p>
          <Button
            className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={() => setShowContactCTA(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            联系我们获取完整数据
          </Button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">第 {page} / {totalPages} 页</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      {/* Company detail dialog — only for logged-in users */}
      {!isGuest && (
        <CompanyDetailDialog
          company={selectedCompany}
          open={!!selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}
