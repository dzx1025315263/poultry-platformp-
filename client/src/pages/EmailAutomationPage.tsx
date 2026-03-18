import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { getLoginUrl } from "@/const";
import {
  Mail, Send, Clock, BarChart3, FlaskConical, Zap, Eye, MessageSquare,
  Plus, Trash2, Play, Calendar, TrendingUp, ArrowRight
} from "lucide-react";

export default function EmailAutomationPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("workflow");
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [recipientEmails, setRecipientEmails] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [trackAbTestId, setTrackAbTestId] = useState<number | null>(null);
  const [trackVariant, setTrackVariant] = useState<"A" | "B">("A");
  const [trackEvent, setTrackEvent] = useState<"opened" | "replied">("opened");

  const { data: abTests, refetch: refetchTests } = trpc.abTest.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stats } = trpc.emailAutomation.stats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: history } = trpc.inquiry.emailHistory.useQuery({ page: 1, pageSize: 50 }, { enabled: isAuthenticated });

  const sendWithAbTest = trpc.emailAutomation.sendWithAbTest.useMutation({
    onSuccess: (data) => {
      toast.success(`成功发送 ${data.sent} 封邮件（A组: ${data.variantA}, B组: ${data.variantB}）`);
      setShowSendDialog(false);
      setRecipientEmails("");
      refetchTests();
    },
    onError: (err) => toast.error(err.message),
  });

  const scheduleEmail = trpc.emailAutomation.scheduleEmail.useMutation({
    onSuccess: (data) => {
      toast.success(`邮件已计划于 ${new Date(data.scheduledAt).toLocaleString("zh-CN")} 发送`);
      setScheduleTime("");
    },
    onError: (err) => toast.error(err.message),
  });

  const trackEventMutation = trpc.emailAutomation.trackEvent.useMutation({
    onSuccess: () => {
      toast.success("事件已记录");
      refetchTests();
    },
    onError: (err) => toast.error(err.message),
  });

  const activeTests = useMemo(() => abTests?.filter((t: any) => t.isActive) || [], [abTests]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Mail className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先登录</h2>
        <p className="text-muted-foreground">登录后可使用邮件自动化工作流</p>
        <Button onClick={() => window.location.href = getLoginUrl()}>登录</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Zap className="h-6 w-6 text-amber-500" />
          邮件自动化工作流
        </h1>
        <p className="text-muted-foreground mt-1">
          A/B 测试打通批量发送，定时发送，打开率/回复率自动追踪
        </p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <Mail className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.totalSent || 0}</p>
            <p className="text-xs text-muted-foreground">总发送量</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.recent7d || 0}</p>
            <p className="text-xs text-muted-foreground">近7天发送</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <FlaskConical className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.activeAbTests || 0}</p>
            <p className="text-xs text-muted-foreground">进行中测试</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.totalAbTests || 0}</p>
            <p className="text-xs text-muted-foreground">总测试数</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflow"><Zap className="h-4 w-4 mr-1" />A/B 发送</TabsTrigger>
          <TabsTrigger value="tracking"><Eye className="h-4 w-4 mr-1" />事件追踪</TabsTrigger>
          <TabsTrigger value="history"><Clock className="h-4 w-4 mr-1" />发送历史</TabsTrigger>
        </TabsList>

        {/* A/B 测试发送工作流 */}
        <TabsContent value="workflow" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">A/B 测试批量发送</CardTitle>
                  <CardDescription>选择一个 A/B 测试模板，系统自动将收件人随机分为 A/B 两组发送</CardDescription>
                </div>
                <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" disabled={activeTests.length === 0}>
                      <Send className="h-4 w-4" />
                      发起 A/B 发送
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>A/B 测试批量发送</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>选择 A/B 测试模板</Label>
                        <Select onValueChange={(v) => setSelectedTestId(Number(v))}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择一个测试" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeTests.map((t: any) => (
                              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>收件人邮箱（每行一个，格式：邮箱 或 邮箱,公司名）</Label>
                        <Textarea
                          value={recipientEmails}
                          onChange={(e) => setRecipientEmails(e.target.value)}
                          rows={6}
                          placeholder={"buyer@example.com,ABC Foods\nsales@company.com,XYZ Trading\nimport@firm.com"}
                        />
                        <p className="text-xs text-muted-foreground">
                          系统将自动将收件人交替分配到 A/B 两组
                        </p>
                      </div>

                      {/* 定时发送选项 */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          定时发送（可选）
                        </Label>
                        <Input
                          type="datetime-local"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">留空则立即发送</p>
                      </div>

                      <Button
                        className="w-full gap-2"
                        disabled={!selectedTestId || !recipientEmails.trim() || sendWithAbTest.isPending}
                        onClick={() => {
                          const recipients = recipientEmails.trim().split("\n").filter(Boolean).map(line => {
                            const parts = line.split(",");
                            return { email: parts[0].trim(), companyName: parts[1]?.trim() || "" };
                          });
                          if (recipients.length === 0) { toast.error("请输入至少一个收件人"); return; }

                          if (scheduleTime) {
                            // 定时发送
                            const test = activeTests.find((t: any) => t.id === selectedTestId);
                            scheduleEmail.mutate({
                              recipients: recipients.map(r => r.email).join(", "),
                              subject: test?.variantA_subject || "询盘",
                              body: test?.variantA_body || "",
                              scheduledAt: new Date(scheduleTime).toISOString(),
                              abTestId: selectedTestId!,
                            });
                          } else {
                            sendWithAbTest.mutate({
                              abTestId: selectedTestId!,
                              recipients,
                            });
                          }
                        }}
                      >
                        {sendWithAbTest.isPending ? (
                          <>发送中...</>
                        ) : scheduleTime ? (
                          <><Clock className="h-4 w-4" />定时发送</>
                        ) : (
                          <><Send className="h-4 w-4" />立即发送</>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {activeTests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-8 w-8 mx-auto mb-2" />
                  <p>暂无进行中的 A/B 测试</p>
                  <p className="text-xs mt-1">请先在"A/B 测试"页面创建测试模板</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTests.map((test: any) => {
                    const totalA = test.variantA_sent || 0;
                    const totalB = test.variantB_sent || 0;
                    const openA = test.variantA_opened || 0;
                    const openB = test.variantB_opened || 0;
                    const replyA = test.variantA_replied || 0;
                    const replyB = test.variantB_replied || 0;
                    const openRateA = totalA > 0 ? ((openA / totalA) * 100).toFixed(1) : "0";
                    const openRateB = totalB > 0 ? ((openB / totalB) * 100).toFixed(1) : "0";
                    const replyRateA = totalA > 0 ? ((replyA / totalA) * 100).toFixed(1) : "0";
                    const replyRateB = totalB > 0 ? ((replyB / totalB) * 100).toFixed(1) : "0";

                    return (
                      <div key={test.id} className="p-4 rounded-lg border space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{test.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              创建于 {new Date(test.createdAt).toLocaleDateString("zh-CN")}
                            </p>
                          </div>
                          <Badge>进行中</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* 变体 A */}
                          <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-blue-600 text-xs">变体 A</Badge>
                              <span className="text-xs text-muted-foreground">发送 {totalA}</span>
                            </div>
                            <p className="text-xs truncate font-medium">{test.variantA_subject || "未设置主题"}</p>
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div>
                                <div className="flex items-center justify-center gap-1">
                                  <Eye className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">打开率</span>
                                </div>
                                <p className="font-bold text-sm">{openRateA}%</p>
                              </div>
                              <div>
                                <div className="flex items-center justify-center gap-1">
                                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">回复率</span>
                                </div>
                                <p className="font-bold text-sm">{replyRateA}%</p>
                              </div>
                            </div>
                          </div>

                          {/* 变体 B */}
                          <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-orange-600 text-xs">变体 B</Badge>
                              <span className="text-xs text-muted-foreground">发送 {totalB}</span>
                            </div>
                            <p className="text-xs truncate font-medium">{test.variantB_subject || "未设置主题"}</p>
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div>
                                <div className="flex items-center justify-center gap-1">
                                  <Eye className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">打开率</span>
                                </div>
                                <p className="font-bold text-sm">{openRateB}%</p>
                              </div>
                              <div>
                                <div className="flex items-center justify-center gap-1">
                                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">回复率</span>
                                </div>
                                <p className="font-bold text-sm">{replyRateB}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 工作流说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">工作流程</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Badge variant="outline" className="gap-1"><Plus className="h-3 w-3" />创建 A/B 测试</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="gap-1"><Send className="h-3 w-3" />批量发送邮件</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" />记录打开/回复</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="gap-1"><BarChart3 className="h-3 w-3" />对比分析效果</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 事件追踪 */}
        <TabsContent value="tracking" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">手动记录邮件事件</CardTitle>
              <CardDescription>
                当收到客户回复或确认邮件被打开时，手动记录事件以更新 A/B 测试统计
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>A/B 测试</Label>
                  <Select onValueChange={(v) => setTrackAbTestId(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择测试" />
                    </SelectTrigger>
                    <SelectContent>
                      {(abTests || []).map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>变体</Label>
                  <Select value={trackVariant} onValueChange={(v) => setTrackVariant(v as "A" | "B")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">变体 A</SelectItem>
                      <SelectItem value="B">变体 B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>事件类型</Label>
                  <Select value={trackEvent} onValueChange={(v) => setTrackEvent(v as "opened" | "replied")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opened">邮件被打开</SelectItem>
                      <SelectItem value="replied">收到回复</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                disabled={!trackAbTestId || trackEventMutation.isPending}
                onClick={() => {
                  if (!trackAbTestId) return;
                  trackEventMutation.mutate({ abTestId: trackAbTestId, variant: trackVariant, event: trackEvent });
                }}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                记录事件
              </Button>
            </CardContent>
          </Card>

          {/* 追踪说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">追踪说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. 当客户回复了您的询盘邮件，选择对应的 A/B 测试和变体，记录"收到回复"事件</p>
              <p>2. 如果您使用了邮件追踪工具（如 Mailtrack）确认邮件被打开，记录"邮件被打开"事件</p>
              <p>3. 系统会自动汇总各变体的打开率和回复率，帮助您找到最有效的询盘话术</p>
              <p>4. 建议每个 A/B 测试至少发送 20 封以上邮件后再对比效果，确保统计显著性</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 发送历史 */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">发送历史</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>收件人</TableHead>
                      <TableHead>主题</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!history?.data?.length ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          暂无发送记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.data.map((h: any) => (
                        <TableRow key={h.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(h.sentAt).toLocaleString("zh-CN")}
                          </TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{h.recipients || h.recipientEmail}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{h.subject || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={h.status === "sent" ? "default" : h.status === "scheduled" ? "secondary" : "destructive"}
                              className="text-[10px]"
                            >
                              {h.status === "sent" ? "已发送" : h.status === "scheduled" ? "待发送" : "失败"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {h.internalNote || h.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
