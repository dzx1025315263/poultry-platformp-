import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Globe, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

const ROLE_TAGS = ["全产业链巨头", "进口商/贸易商", "加工商", "冷链物流", "养殖/饮料", "零售商/超市", "行业协会", "其他"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("");
  const [role, setRole] = useState("");
  const [chinaOnly, setChinaOnly] = useState(false);
  const [page, setPage] = useState(1);
  const searchInput = useMemo(() => ({
    query: query || undefined, continent: continent || undefined,
    role: role || undefined, chinaOnly: chinaOnly || undefined, page, pageSize: 30,
  }), [query, continent, role, chinaOnly, page]);
  const { data, isLoading } = trpc.company.search.useQuery(searchInput);
  const totalPages = data ? Math.ceil(data.total / 30) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">全局搜索</h1>
        <p className="text-muted-foreground mt-1">跨 2,314 家企业实时搜索，支持多维度筛选</p>
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
              🇨🇳 已在中国采购
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {ROLE_TAGS.map(r => (
              <Badge key={r} variant={role === r ? "default" : "outline"} className="cursor-pointer"
                onClick={() => { setRole(role === r ? "" : r); setPage(1); }}>{r}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="text-sm text-muted-foreground">
        {data ? `找到 ${data.total} 家企业` : isLoading ? "搜索中..." : ""}
      </div>
      <div className="space-y-2">
        {isLoading ? Array.from({ length: 5 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>) : (
          data?.data.map((c: any) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{c.companyName}</h3>
                      {c.coreRole && <Badge variant="secondary" className="text-xs">{c.coreRole}</Badge>}
                      {c.hasPurchasedFromChina === "是" && <Badge className="text-xs bg-green-600">已在中国采购</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{c.country}</span>
                      <span>{c.continent}</span>
                    </div>
                    {c.mainProducts && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{c.mainProducts}</p>}
                    {c.companyProfile && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.companyProfile}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.websiteSocial && (
                      <a href={c.websiteSocial.startsWith("http") ? c.websiteSocial : `https://${c.websiteSocial}`}
                        target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-muted">
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
    </div>
  );
}
