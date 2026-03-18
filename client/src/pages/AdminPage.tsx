import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Pencil, Trash2, History, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editItem, setEditItem] = useState<any>(null);
  const [newItem, setNewItem] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const utils = trpc.useUtils();

  const { data: companies, isLoading } = trpc.company.search.useQuery({ query: search || undefined, page, pageSize: 20 });
  const { data: logs } = trpc.admin.auditLogs.useQuery({ page: 1, pageSize: 50 });
  const updateCompany = trpc.admin.updateCompany.useMutation({ onSuccess: () => { utils.company.search.invalidate(); setEditItem(null); toast.success("已更新"); } });
  const deleteCompany = trpc.admin.deleteCompany.useMutation({ onSuccess: () => { utils.company.search.invalidate(); toast.success("已删除"); } });
  const createCompany = trpc.admin.createCompany.useMutation({ onSuccess: () => { utils.company.search.invalidate(); setNewItem(false); setForm({}); toast.success("已创建"); } });

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "editor")) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">无权访问</h2>
        <p className="text-muted-foreground">仅超级管理员和数据编辑员可访问管理后台</p>
      </div>
    );
  }

  const fields = ["companyName", "country", "continent", "coreRole", "purchasePreference", "companyProfile", "mainProducts", "websiteSocial", "contactInfo", "hasPurchasedFromChina"];
  const fieldLabels: Record<string, string> = {
    companyName: "公司名称", country: "国家", continent: "大洲", coreRole: "核心角色",
    purchasePreference: "采购倾向", companyProfile: "公司简介", mainProducts: "主营产品",
    websiteSocial: "网站/社媒", contactInfo: "联系方式", hasPurchasedFromChina: "中国采购",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">管理后台</h1><p className="text-muted-foreground mt-1">企业数据管理、审计日志</p></div>
        <Dialog open={newItem} onOpenChange={setNewItem}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />新增企业</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>新增企业</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {fields.map(f => (
                <div key={f} className="space-y-1"><Label className="text-xs">{fieldLabels[f]}</Label>
                  {f === "companyProfile" ? <Textarea value={form[f] || ""} onChange={e => setForm(p => ({...p, [f]: e.target.value}))} rows={3} /> :
                    <Input value={form[f] || ""} onChange={e => setForm(p => ({...p, [f]: e.target.value}))} />}
                </div>
              ))}
              <Button onClick={() => createCompany.mutate({ data: form })} className="w-full">创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Tabs defaultValue="data">
        <TabsList><TabsTrigger value="data"><Pencil className="h-4 w-4 mr-1" />数据管理</TabsTrigger><TabsTrigger value="logs"><History className="h-4 w-4 mr-1" />操作日志</TabsTrigger></TabsList>
        <TabsContent value="data" className="mt-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索企业..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
          </div>
          <Card><ScrollArea className="h-[500px]"><Table>
            <TableHeader><TableRow>
              <TableHead className="w-[40px]">#</TableHead><TableHead>公司名称</TableHead><TableHead>国家</TableHead><TableHead>角色</TableHead><TableHead className="w-[100px]"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? Array.from({length:10}).map((_,i) => <TableRow key={i}><TableCell colSpan={5}><div className="h-8 bg-muted animate-pulse rounded" /></TableCell></TableRow>) :
                companies?.data.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs text-muted-foreground">{c.id}</TableCell>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{c.companyName}</TableCell>
                    <TableCell className="text-sm">{c.country}</TableCell>
                    <TableCell>{c.coreRole && <Badge variant="secondary" className="text-xs">{c.coreRole}</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog open={editItem?.id === c.id} onOpenChange={o => { if (!o) setEditItem(null); }}>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditItem(c)}><Pencil className="h-3 w-3" /></Button></DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>编辑企业</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                              {fields.map(f => (
                                <div key={f} className="space-y-1"><Label className="text-xs">{fieldLabels[f]}</Label>
                                  {f === "companyProfile" ? <Textarea value={editItem?.[f] || ""} onChange={e => setEditItem((p: any) => ({...p, [f]: e.target.value}))} rows={3} /> :
                                    <Input value={editItem?.[f] || ""} onChange={e => setEditItem((p: any) => ({...p, [f]: e.target.value}))} />}
                                </div>
                              ))}
                              <Button onClick={() => editItem && updateCompany.mutate({ id: editItem.id, data: Object.fromEntries(fields.map(f => [f, editItem[f] || ""])) })} className="w-full">保存修改</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { if (confirm("确定删除？")) deleteCompany.mutate({ id: c.id }); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table></ScrollArea></Card>
          {companies && companies.total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
              <span className="text-sm text-muted-foreground py-1">第 {page} 页 / 共 {Math.ceil(companies.total / 20)} 页</span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(companies.total / 20)} onClick={() => setPage(p => p + 1)}>下一页</Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <Card><CardHeader><CardTitle className="text-base">操作日志</CardTitle></CardHeader><CardContent>
            <ScrollArea className="h-[400px]"><Table>
              <TableHeader><TableRow>
                <TableHead>时间</TableHead><TableHead>用户</TableHead><TableHead>操作</TableHead><TableHead>目标</TableHead><TableHead>详情</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {!logs?.data?.length ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无操作日志</TableCell></TableRow> :
                  logs.data.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{new Date(l.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{l.userId}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{l.action}</Badge></TableCell>
                      <TableCell className="text-sm">{l.targetTable}#{l.targetId}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{l.details}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table></ScrollArea>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
