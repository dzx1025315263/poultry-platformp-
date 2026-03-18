import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { Bell, CheckCircle, XCircle, Send, Settings, AlertTriangle } from "lucide-react";

export default function FeishuSettingsPage() {
  const { isAuthenticated, user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testing, setTesting] = useState(false);

  const { data: webhookInfo, isLoading } = trpc.feishu.getWebhookUrl.useQuery(undefined, { enabled: isAuthenticated });
  const setUrlMutation = trpc.feishu.setWebhookUrl.useMutation({
    onSuccess: () => {
      toast.success("Webhook URL 已保存");
      setWebhookUrl("");
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">飞书通知设置</h1>
        <p className="text-muted-foreground mt-1">配置飞书群机器人 Webhook，接收实时业务通知</p>
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
                <Badge variant="outline" className="text-xs">{webhookInfo.url}</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={testing}
                onClick={() => { setTesting(true); testMutation.mutate(); }}
              >
                <Send className="h-4 w-4 mr-1" />
                {testing ? "发送中..." : "发送测试消息"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">未配置 Webhook URL</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 配置表单 */}
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">设置 Webhook URL</CardTitle>
            <CardDescription>
              在飞书群中添加"自定义机器人"，复制 Webhook 地址粘贴到下方
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
              <p className="text-xs text-muted-foreground">
                路径：飞书群 → 设置 → 群机器人 → 添加机器人 → 自定义机器人 → 复制 Webhook 地址
              </p>
            </div>
            <Button
              disabled={!webhookUrl || setUrlMutation.isPending}
              onClick={() => setUrlMutation.mutate({ url: webhookUrl })}
            >
              {setUrlMutation.isPending ? "保存中..." : "保存配置"}
            </Button>
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
          <CardDescription>以下操作会自动推送飞书群消息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              { icon: "📌", title: "收藏夹新增", desc: "团队成员将企业添加到收藏夹时通知" },
              { icon: "🗑️", title: "收藏夹移除", desc: "团队成员从收藏夹移除企业时通知" },
              { icon: "🔄", title: "跟进状态更新", desc: "客户跟进状态发生变更时通知（如：已联系→已报价）" },
              { icon: "📥", title: "联系人导入", desc: "批量导入企业联系人时通知" },
              { icon: "📧", title: "邮件发送", desc: "通过A/B测试工作流发送邮件时通知" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
