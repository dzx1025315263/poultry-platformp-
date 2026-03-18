import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { FlaskConical, Plus, Trash2, BarChart3, Mail, Eye, MessageSquare, Braces } from "lucide-react";
import TemplateVariableInsert from "@/components/TemplateVariableInsert";
import { detectUsedVariables } from "@shared/emailTemplateVars";

export default function AbTestPage() {
  const { isAuthenticated } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [varA_subject, setVarA_subject] = useState("");
  const [varA_body, setVarA_body] = useState("");
  const [varB_subject, setVarB_subject] = useState("");
  const [varB_body, setVarB_body] = useState("");

  const { data: tests, isLoading, refetch } = trpc.abTest.list.useQuery(undefined, { enabled: isAuthenticated });
  const createMutation = trpc.abTest.create.useMutation({
    onSuccess: () => { refetch(); setShowCreate(false); resetForm(); toast.success("A/B测试已创建"); }
  });
  const deleteMutation = trpc.abTest.delete.useMutation({ onSuccess: () => { refetch(); toast.success("已删除"); } });

  const resetForm = () => { setName(""); setVarA_subject(""); setVarA_body(""); setVarB_subject(""); setVarB_body(""); };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <FlaskConical className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先登录</h2>
        <p className="text-muted-foreground">登录后可使用询盘A/B测试功能</p>
        <Button onClick={() => window.location.href = getLoginUrl()}>登录</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">询盘A/B测试</h1>
          <p className="text-muted-foreground">对比不同邮件模板的效果，持续优化询盘话术</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />创建测试</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建A/B测试</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>测试名称</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如：沙特市场询盘话术对比" />
              </div>

              {/* V2.7: 变量使用提示 */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
                  <Braces className="h-3 w-3" />
                  支持模板变量
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  在主题和正文中使用 {"{{公司名}}"} {"{{联系人}}"} {"{{国家}}"} 等变量，发送时自动替换为实际数据
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-600">变体A</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">邮件主题</Label>
                        <TemplateVariableInsert
                          value={varA_subject}
                          onInsert={setVarA_subject}
                          showPreview={false}
                        />
                      </div>
                      <Input placeholder="邮件主题A" value={varA_subject} onChange={e => setVarA_subject(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">邮件正文</Label>
                        <TemplateVariableInsert
                          value={varA_body}
                          onInsert={setVarA_body}
                        />
                      </div>
                      <Textarea placeholder="邮件正文A&#10;&#10;示例：Dear {{联系人}},&#10;We are a leading supplier...&#10;We noticed {{公司名}} in {{国家}}..." rows={6} value={varA_body} onChange={e => setVarA_body(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-600">变体B</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">邮件主题</Label>
                        <TemplateVariableInsert
                          value={varB_subject}
                          onInsert={setVarB_subject}
                          showPreview={false}
                        />
                      </div>
                      <Input placeholder="邮件主题B" value={varB_subject} onChange={e => setVarB_subject(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">邮件正文</Label>
                        <TemplateVariableInsert
                          value={varB_body}
                          onInsert={setVarB_body}
                        />
                      </div>
                      <Textarea placeholder="邮件正文B&#10;&#10;示例：Hi {{联系人}},&#10;I'm reaching out to {{公司名}}..." rows={6} value={varB_body} onChange={e => setVarB_body(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Button className="w-full" disabled={!name} onClick={() => createMutation.mutate({
                name, variantA_subject: varA_subject, variantA_body: varA_body, variantB_subject: varB_subject, variantB_body: varB_body
              })}>创建测试</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Test List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : !tests?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">暂无A/B测试</h3>
            <p className="text-sm text-muted-foreground mb-4">创建您的第一个询盘邮件A/B测试，对比不同话术的效果</p>
            <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" />创建测试</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test: any) => {
            const aRate = test.variantA_sent > 0 ? ((test.variantA_replied / test.variantA_sent) * 100).toFixed(1) : "0";
            const bRate = test.variantB_sent > 0 ? ((test.variantB_replied / test.variantB_sent) * 100).toFixed(1) : "0";
            const winner = Number(aRate) > Number(bRate) ? "A" : Number(bRate) > Number(aRate) ? "B" : null;
            const varsA = detectUsedVariables((test.variantA_subject || '') + (test.variantA_body || ''));
            const varsB = detectUsedVariables((test.variantB_subject || '') + (test.variantB_body || ''));
            return (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{test.name}</CardTitle>
                      <CardDescription>创建于 {new Date(test.createdAt).toLocaleDateString("zh-CN")}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={test.isActive ? "default" : "secondary"}>{test.isActive ? "进行中" : "已结束"}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: test.id })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border ${winner === "A" ? "border-green-500 bg-green-50" : "border-blue-200 bg-blue-50/50"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-blue-600">变体A</Badge>
                        <div className="flex items-center gap-1">
                          {varsA.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-0.5">
                              <Braces className="h-2.5 w-2.5" />{varsA.length}变量
                            </Badge>
                          )}
                          {winner === "A" && <Badge className="bg-green-500">胜出</Badge>}
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-1 truncate">{test.variantA_subject || "未设置主题"}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /><span className="text-xs">发送</span></div>
                          <p className="font-bold">{test.variantA_sent || 0}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground"><Eye className="h-3 w-3" /><span className="text-xs">打开</span></div>
                          <p className="font-bold">{test.variantA_opened || 0}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground"><MessageSquare className="h-3 w-3" /><span className="text-xs">回复</span></div>
                          <p className="font-bold">{test.variantA_replied || 0}</p>
                        </div>
                      </div>
                      <p className="text-center text-sm mt-2">回复率: <span className="font-bold">{aRate}%</span></p>
                    </div>
                    <div className={`p-4 rounded-lg border ${winner === "B" ? "border-green-500 bg-green-50" : "border-orange-200 bg-orange-50/50"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-orange-600">变体B</Badge>
                        <div className="flex items-center gap-1">
                          {varsB.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-0.5">
                              <Braces className="h-2.5 w-2.5" />{varsB.length}变量
                            </Badge>
                          )}
                          {winner === "B" && <Badge className="bg-green-500">胜出</Badge>}
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-1 truncate">{test.variantB_subject || "未设置主题"}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /><span className="text-xs">发送</span></div>
                          <p className="font-bold">{test.variantB_sent || 0}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground"><Eye className="h-3 w-3" /><span className="text-xs">打开</span></div>
                          <p className="font-bold">{test.variantB_opened || 0}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground"><MessageSquare className="h-3 w-3" /><span className="text-xs">回复</span></div>
                          <p className="font-bold">{test.variantB_replied || 0}</p>
                        </div>
                      </div>
                      <p className="text-center text-sm mt-2">回复率: <span className="font-bold">{bRate}%</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
