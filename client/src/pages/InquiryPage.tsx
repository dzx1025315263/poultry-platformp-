import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mail, Settings, History, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function InquiryPage() {
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState({ companyName: "", contactPerson: "", email: "", phone: "", destinationPort: "", emailBody: "" });
  const utils = trpc.useUtils();
  const { data: savedConfig } = trpc.inquiry.getTemplate.useQuery(undefined, { enabled: isAuthenticated });
  const saveConfig = trpc.inquiry.saveTemplate.useMutation({ onSuccess: () => toast.success("配置已保存") });
  const { data: history } = trpc.inquiry.emailHistory.useQuery({ page: 1, pageSize: 50 }, { enabled: isAuthenticated });

  useEffect(() => {
    if (savedConfig) setConfig({
      companyName: savedConfig.companyName || "", contactPerson: savedConfig.contactPerson || "",
      email: savedConfig.email || "", phone: savedConfig.phone || "",
      destinationPort: savedConfig.destinationPort || "", emailBody: savedConfig.emailBody || "",
    });
  }, [savedConfig]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Mail className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">登录后解锁询盘功能</h2>
        <p className="text-muted-foreground">配置询盘模板、发送邮件、查看历史记录</p>
        <Button onClick={() => { window.location.href = getLoginUrl(); }}>登录</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">询盘邮件</h1><p className="text-muted-foreground mt-1">配置询盘模板，管理邮件发送</p></div>
      <Tabs defaultValue="template">
        <TabsList><TabsTrigger value="template"><Settings className="h-4 w-4 mr-1" />模板配置</TabsTrigger><TabsTrigger value="history"><History className="h-4 w-4 mr-1" />发送历史</TabsTrigger></TabsList>
        <TabsContent value="template" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">询盘模板设置</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>公司名称</Label><Input value={config.companyName} onChange={e => setConfig(p => ({...p, companyName: e.target.value}))} placeholder="您的公司名称" /></div>
                <div className="space-y-2"><Label>联系人</Label><Input value={config.contactPerson} onChange={e => setConfig(p => ({...p, contactPerson: e.target.value}))} placeholder="您的姓名" /></div>
                <div className="space-y-2"><Label>邮箱</Label><Input value={config.email} onChange={e => setConfig(p => ({...p, email: e.target.value}))} placeholder="your@email.com" /></div>
                <div className="space-y-2"><Label>电话</Label><Input value={config.phone} onChange={e => setConfig(p => ({...p, phone: e.target.value}))} placeholder="+86 ..." /></div>
                <div className="space-y-2 col-span-2"><Label>目的港</Label><Input value={config.destinationPort} onChange={e => setConfig(p => ({...p, destinationPort: e.target.value}))} placeholder="如：上海港" /></div>
              </div>
              <div className="space-y-2"><Label>询盘邮件正文</Label>
                <Textarea value={config.emailBody} onChange={e => setConfig(p => ({...p, emailBody: e.target.value}))} rows={8}
                  placeholder="Dear {{company_name}},\n\nWe are writing to inquire about...\n\n支持占位符: {{company_name}}, {{country}}, {{product}}" />
                <p className="text-xs text-muted-foreground">支持占位符: {"{{company_name}}"}, {"{{country}}"}, {"{{product}}"}, {"{{contact_person}}"}</p>
              </div>
              <Button onClick={() => saveConfig.mutate(config)}><Save className="h-4 w-4 mr-1" />保存配置</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">发送历史</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>时间</TableHead><TableHead>收件人</TableHead><TableHead>状态</TableHead><TableHead>备注</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {!history?.data?.length ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">暂无发送记录</TableCell></TableRow> :
                      history.data.map((h: any) => (
                        <TableRow key={h.id}>
                          <TableCell className="text-sm">{new Date(h.sentAt).toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{h.recipientEmail}</TableCell>
                          <TableCell><Badge variant={h.status === "sent" ? "default" : "destructive"} className="text-xs">{h.status === "sent" ? "已发送" : "失败"}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{h.notes}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
