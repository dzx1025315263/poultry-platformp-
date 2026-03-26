import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { industryConfig } from "@shared/industry-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Lock, MessageCircle, Globe, Building2, Users, Shield } from "lucide-react";
import { useState } from "react";

/* ─── Contact Us CTA Modal ─── */
function ContactCTA({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white text-center">
          <img src="/ugg-logo-sm.png" alt="UGG" className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-4 object-contain p-1" />
          <h2 className="text-xl font-bold">获取完整企业数据</h2>
          <p className="text-blue-100 mt-2 text-sm">
            Universal Gourmand Group 拥有全球 2,300+ 家禽业企业的详细档案
          </p>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">覆盖 111 个国家和地区</p>
                <p className="text-xs text-muted-foreground mt-0.5">涵盖全球主要禽肉生产和消费市场</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">完整企业名称与联系方式</p>
                <p className="text-xs text-muted-foreground mt-0.5">包括企业简介、核心业务、采购历史等详细档案</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">定制化数据服务</p>
                <p className="text-xs text-muted-foreground mt-0.5">根据您的需求提供精准的企业匹配和市场分析</p>
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

export default function ReportPage() {
  const { user } = useAuth();
  const isGuest = !user;
  const [showContactCTA, setShowContactCTA] = useState(false);

  const { data: stats } = trpc.company.stats.useQuery();
  const [sel, setSel] = useState("all");
  const { data: companies, isLoading } = trpc.company.search.useQuery({ continent: sel === "all" ? undefined : sel, page: 1, pageSize: 5000 });
  const continents = stats?.continentDistribution || [];

  return (
    <div className="space-y-6">
      <ContactCTA open={showContactCTA} onClose={() => setShowContactCTA(false)} />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">报告全文</h1>
          <p className="text-muted-foreground mt-1">{industryConfig.reportPageSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {isGuest && (
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => setShowContactCTA(true)}
            >
              <MessageCircle className="h-4 w-4" />
              联系我们
            </Button>
          )}
          {!isGuest && (
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />打印/导出PDF
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-primary">{stats?.total?.toLocaleString() || "—"}</div><div className="text-sm text-muted-foreground mt-1">企业总数</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-blue-600">{stats?.countries || "—"}</div><div className="text-sm text-muted-foreground mt-1">覆盖国家</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-green-600">{stats?.continents || "—"}</div><div className="text-sm text-muted-foreground mt-1">覆盖大洲</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-amber-600">{stats?.chinaImporters || "—"}</div><div className="text-sm text-muted-foreground mt-1">已在中国采购</div></CardContent></Card>
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
                您可以查看企业的核心角色、主营产品和国家分布等信息
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100" onClick={() => setShowContactCTA(true)}>
            了解更多
          </Button>
        </div>
      )}

      {/* Company table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">企业名录</CardTitle>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部大洲</SelectItem>
              {continents.map((c: any) => <SelectItem key={c.continent} value={c.continent}>{c.continent} ({c.count})</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-3">共 {companies?.total || 0} 家企业</div>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>公司名称</TableHead>
                <TableHead>国家</TableHead>
                <TableHead>大洲</TableHead>
                <TableHead>核心角色</TableHead>
                <TableHead>主营产品</TableHead>
                <TableHead>中国采购</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {isLoading ? Array.from({length:20}).map((_,i) => <TableRow key={i}><TableCell colSpan={7}><div className="h-6 bg-muted animate-pulse rounded" /></TableCell></TableRow>) :
                  companies?.data.map((c: any, i: number) => (
                    <TableRow key={c.id} className={isGuest ? "group" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{i+1}</TableCell>
                      <TableCell className="font-medium text-sm max-w-[180px]">
                        {isGuest ? (
                          <div className="flex items-center gap-1">
                            <span className="truncate select-none" style={{ filter: "blur(4px)", WebkitUserSelect: "none" }}>{c.companyName}</span>
                            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                          </div>
                        ) : (
                          <span className="truncate">{c.companyName}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{c.country}</TableCell>
                      <TableCell className="text-sm">{c.continent}</TableCell>
                      <TableCell>{c.coreRole && <Badge variant="secondary" className="text-xs">{c.coreRole}</Badge>}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{c.mainProducts}</TableCell>
                      <TableCell>{c.hasPurchasedFromChina === "是" && <Badge className="text-xs bg-green-600">是</Badge>}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Guest CTA at bottom of table */}
          {isGuest && (companies?.total || 0) > 0 && (
            <div className="mt-4 p-5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 text-center">
              <img src="/ugg-logo-sm.png" alt="UGG" className="w-12 h-12 mx-auto mb-3 object-contain" />
              <p className="text-base font-semibold text-blue-800 dark:text-blue-200">
                解锁全部 {companies?.total?.toLocaleString()} 家企业的完整信息
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
        </CardContent>
      </Card>
    </div>
  );
}
