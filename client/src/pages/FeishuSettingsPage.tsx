import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { Bell, CheckCircle, XCircle, Send, Settings, AlertTriangle, ListTodo, ExternalLink, Copy, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function FeishuSettingsPage() {
  const { isAuthenticated, user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();
  const { data: webhookInfo, isLoading } = trpc.feishu.getWebhookUrl.useQuery(undefined, { enabled: isAuthenticated });
  const setUrlMutation = trpc.feishu.setWebhookUrl.useMutation({
    onSuccess: () => {
      toast.success("Webhook URL 已保存");
      setWebhookUrl("");
      utils.feishu.getWebhookUrl.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const testMutation = trpc.feishu.testNotification.useMutation({
    onSuccess: (data) => {
      if (data.success) toast.success("测试消息已发送到飞书群");
      else toast.error("发送失败，请检查 Webhook URL 是否正确");
      setTesting(false);
    },
    onError: (err) => { toast.error(err.message); setTesting(false); },
  });

  // 稍后处理：创建待办事项
  const addTodo = trpc.todo.add.useMutation({
    onSuccess: () => {
      toast.success("已添加到待办事项", {
        action: { label: "查看待办", onClick: () => navigate("/todo") },
      });
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Bell className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先登录</h2>
        <Button onClick={() => window.location.href = getLoginUrl()}>登录</Button>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            飞书通知设置
          </h1>
          <p className="text-muted-foreground mt-1">配置飞书群机器人 Webhook，接收实时业务通知</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/todo")} className="gap-1">
          <ListTodo className="h-4 w-4" />
          待办事项
        </Button>
      </div>

      {/* 当前状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Webhook 配置状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              加载中...
            </div>
          ) : webhookInfo?.configured ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700">已配置</span>
                <Badge variant="outline" className="text-xs font-mono max-w-md truncate">{webhookInfo.url}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={testing}
                  onClick={() => { setTesting(true); testMutation.mutate(); }}
                >
                  <Send className="h-4 w-4 mr-1" />
                  {testing ? "发送中..." : "发送测试消息"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    addTodo.mutate({
                      title: "验证飞书通知推送是否正常工作",
                      description: "在收藏夹中添加/移除企业，检查飞书群是否收到通知消息",
                      source: "飞书通知",
                      priority: "medium",
                    });
                  }}
                  disabled={addTodo.isPending}
                >
                  <ListTodo className="h-4 w-4 mr-1" />
                  稍后处理
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">未配置 Webhook URL</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  addTodo.mutate({
                    title: "配置飞书群机器人 Webhook",
                    description: "在飞书群中创建自定义机器人，获取 Webhook URL 并配置到平台中，以接收收藏夹变更和跟进状态更新的实时通知",
                    source: "飞书通知",
                    priority: "high",
                  });
                }}
                disabled={addTodo.isPending}
              >
                <ListTodo className="h-4 w-4 mr-1" />
                稍后处理
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 配置引导 - 步骤说明 */}
      <Card className="border-blue-200 bg-blue-50/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-blue-600" />
            如何创建飞书群机器人
          </CardTitle>
          <CardDescription>按照以下步骤获取 Webhook 地址</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <div className="w-0.5 flex-1 bg-blue-200 mt-1" />
              </div>
              <div className="pb-6">
                <p className="font-medium">打开飞书群聊</p>
                <p className="text-sm text-muted-foreground mt-1">
                  打开您希望接收通知的飞书群聊（建议创建一个专门的"禽业数据通知"群）
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <div className="w-0.5 flex-1 bg-blue-200 mt-1" />
              </div>
              <div className="pb-6">
                <p className="font-medium">进入群设置</p>
                <p className="text-sm text-muted-foreground mt-1">
                  点击群聊右上角的 <strong>「...」</strong> 按钮 → 选择 <strong>「设置」</strong> → 找到 <strong>「群机器人」</strong> 选项
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <div className="w-0.5 flex-1 bg-blue-200 mt-1" />
              </div>
              <div className="pb-6">
                <p className="font-medium">添加自定义机器人</p>
                <p className="text-sm text-muted-foreground mt-1">
                  点击 <strong>「添加机器人」</strong> → 选择 <strong>「自定义机器人」</strong> → 输入机器人名称（如"禽业数据助手"）→ 点击 <strong>「添加」</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">4</div>
                <div className="w-0.5 flex-1 bg-blue-200 mt-1" />
              </div>
              <div className="pb-6">
                <p className="font-medium">复制 Webhook 地址</p>
                <p className="text-sm text-muted-foreground mt-1">
                  创建成功后会显示 Webhook 地址，格式为：
                </p>
                <div className="mt-2 flex items-center gap-2 p-2 rounded bg-muted font-mono text-xs">
                  <span className="truncate">https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-6 w-6 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText("https://open.feishu.cn/open-apis/bot/v2/hook/");
                      toast.info("URL 前缀已复制");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">5</div>
              </div>
              <div>
                <p className="font-medium">粘贴到下方配置表单</p>
                <p className="text-sm text-muted-foreground mt-1">
                  将复制的 Webhook 地址粘贴到下方输入框中，点击"保存配置"即可完成
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置表单 */}
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">设置 Webhook URL</CardTitle>
            <CardDescription>
              粘贴从飞书群机器人获取的 Webhook 地址
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>飞书 Webhook URL</Label>
              <Input
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx"
                type="url"
              />
            </div>
            <div className="flex gap-2">
              <Button
                disabled={!webhookUrl || setUrlMutation.isPending}
                onClick={() => setUrlMutation.mutate({ url: webhookUrl })}
              >
                {setUrlMutation.isPending ? "保存中..." : "保存配置"}
              </Button>
              {!webhookUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    addTodo.mutate({
                      title: "获取飞书群机器人 Webhook URL",
                      description: "按照飞书通知页面的步骤指引，在飞书群中创建自定义机器人并获取 Webhook 地址",
                      source: "飞书通知",
                      priority: "medium",
                    });
                  }}
                  disabled={addTodo.isPending}
                >
                  <ListTodo className="h-3 w-3 mr-1" />
                  稍后配置
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>仅管理员可修改 Webhook 配置</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 通知类型说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">通知触发场景</CardTitle>
          <CardDescription>以下操作会自动推送飞书群消息，每条通知都附带"稍后处理"提示</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              { icon: "📌", title: "收藏夹新增", desc: "团队成员将企业添加到收藏夹时通知", action: "可快速查看企业详情并分配跟进人" },
              { icon: "🗑️", title: "收藏夹移除", desc: "团队成员从收藏夹移除企业时通知", action: "可了解移除原因并决定是否恢复" },
              { icon: "🔄", title: "跟进状态更新", desc: "客户跟进状态发生变更时通知", action: "如：已联系→已报价，可及时跟进下一步" },
              { icon: "📥", title: "联系人导入", desc: "批量导入企业联系人时通知", action: "可查看导入结果并开始联系新联系人" },
              { icon: "📧", title: "邮件发送", desc: "通过邮件自动化工作流发送邮件时通知", action: "可追踪邮件发送进度和回复情况" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <span className="text-lg shrink-0">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    {item.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">常见问题</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger className="text-sm">收不到飞书通知怎么办？</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ol className="list-decimal list-inside space-y-1">
                  <li>确认 Webhook URL 已正确配置（点击"发送测试消息"验证）</li>
                  <li>检查飞书群中机器人是否正常运行（未被禁用或删除）</li>
                  <li>确认飞书群未开启消息免打扰</li>
                  <li>如果更换了机器人，需要重新配置新的 Webhook URL</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger className="text-sm">一个 Webhook 可以多个群共用吗？</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                不可以。每个飞书群机器人有独立的 Webhook URL，当前平台只支持配置一个 Webhook 地址。
                如需通知多个群，建议创建一个专门的通知群并邀请相关人员加入。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger className="text-sm">"稍后处理"功能是什么？</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                当您收到飞书通知但暂时无法处理时，可以在平台的飞书通知页面点击"稍后处理"按钮，
                系统会自动在您的待办事项中创建一条提醒。您可以在"待办事项"页面查看和管理所有待处理的任务。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
