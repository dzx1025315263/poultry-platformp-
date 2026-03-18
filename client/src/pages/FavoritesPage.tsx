import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Trash2, MessageSquare, Search, Eye } from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useMobile";
import CompanyDetailDialog from "@/components/CompanyDetailDialog";

const STATUSES = ["未联系", "已联系", "洽谈中", "已报价", "已成交", "已失败"];

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingNote, setEditingNote] = useState<{ id: number; companyId: number; note: string } | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const utils = trpc.useUtils();
  const { data: favorites, isLoading } = trpc.favorite.list.useQuery(undefined, { enabled: isAuthenticated });
  const removeFav = trpc.favorite.remove.useMutation({ onSuccess: () => { utils.favorite.list.invalidate(); toast.success("已取消收藏"); } });
  const updateFav = trpc.favorite.update.useMutation({ onSuccess: () => { utils.favorite.list.invalidate(); toast.success("已更新"); setEditingNote(null); } });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Heart className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">登录后解锁收藏夹功能</h2>
        <p className="text-muted-foreground">收藏企业、跟进状态、团队协作等功能需要登录</p>
        <Button onClick={() => { window.location.href = getLoginUrl(); }}>登录</Button>
      </div>
    );
  }

  const filtered = (favorites || []).filter((f: any) => {
    const company = f.companies || f.company || {};
    const fav = f.favorites || f;
    if (statusFilter !== "all" && fav.followUpStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return company.companyName?.toLowerCase().includes(q) || company.country?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">收藏夹 CRM</h1>
        <p className="text-muted-foreground mt-1">管理收藏企业，跟踪联系进度。点击企业名称查看详情。</p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索收藏企业..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="跟进状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground">共 {filtered.length} 家收藏企业</div>

      {/* Mobile: Card View */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="h-28" /></Card>
            ))
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">暂无收藏企业</CardContent></Card>
          ) : (
            filtered.map((f: any) => {
              const company = f.companies || f.company || {};
              const fav = f.favorites || f;
              return (
                <Card key={fav.id || fav.companyId} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <button className="font-medium text-sm text-left hover:text-primary transition-colors"
                          onClick={() => setSelectedCompany(company)}>
                          {company.companyName || "企业ID:" + fav.companyId}
                        </button>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{company.country}</span>
                          {company.coreRole && <Badge variant="secondary" className="text-[10px] h-4">{company.coreRole}</Badge>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 shrink-0"
                        onClick={() => removeFav.mutate({ companyId: fav.companyId })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={fav.followUpStatus || "未联系"}
                        onValueChange={v => updateFav.mutate({ companyId: fav.companyId, followUpStatus: v })}>
                        <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      {fav.notes && <span className="text-xs text-muted-foreground truncate flex-1">{fav.notes}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        /* Desktop: Table View */
        <Card>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>公司名称</TableHead>
                  <TableHead>国家</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>跟进状态</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><div className="h-8 bg-muted animate-pulse rounded" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无收藏企业</TableCell></TableRow>
                ) : (
                  filtered.map((f: any) => {
                    const company = f.companies || f.company || {};
                    const fav = f.favorites || f;
                    return (
                      <TableRow key={fav.id || fav.companyId}>
                        <TableCell>
                          <button className="font-medium text-sm text-left hover:text-primary transition-colors"
                            onClick={() => setSelectedCompany(company)}>
                            {company.companyName || "企业ID:" + fav.companyId}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm">{company.country}</TableCell>
                        <TableCell>{company.coreRole && <Badge variant="secondary" className="text-xs">{company.coreRole}</Badge>}</TableCell>
                        <TableCell>
                          <Select value={fav.followUpStatus || "未联系"}
                            onValueChange={v => updateFav.mutate({ companyId: fav.companyId, followUpStatus: v })}>
                            <SelectTrigger className="w-[100px] h-7"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <Dialog open={editingNote?.companyId === fav.companyId} onOpenChange={o => !o && setEditingNote(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-xs h-7"
                                onClick={() => setEditingNote({ id: fav.id, companyId: fav.companyId, note: fav.notes || "" })}>
                                {fav.notes ? <span className="truncate max-w-[150px]">{fav.notes}</span> : <MessageSquare className="h-3 w-3" />}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>编辑备注</DialogTitle></DialogHeader>
                              <Textarea value={editingNote?.note || ""}
                                onChange={e => setEditingNote(prev => prev ? { ...prev, note: e.target.value } : null)}
                                placeholder="输入备注..." rows={4} />
                              <Button onClick={() => editingNote && updateFav.mutate({ companyId: editingNote.companyId, notes: editingNote.note })}>
                                保存
                              </Button>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => setSelectedCompany(company)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                              onClick={() => removeFav.mutate({ companyId: fav.companyId })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      <CompanyDetailDialog
        company={selectedCompany}
        open={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
}
