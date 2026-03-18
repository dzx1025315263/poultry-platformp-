import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { Database, Plus, Shield, Clock, HardDrive } from "lucide-react";

export default function BackupPage() {
  const { user, isAuthenticated } = useAuth();

  const { data: backups, isLoading, refetch } = trpc.backup.list.useQuery(
    { page: 1, pageSize: 20 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const createMutation = trpc.backup.create.useMutation({
    onSuccess: (data) => { refetch(); toast.success(`备份成功，共 ${data.recordCount} 条记录`); },
    onError: () => toast.error("备份失败"),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Database className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先登录</h2>
        <p className="text-muted-foreground">登录后可使用数据备份功能</p>
        <Button onClick={() => window.location.href = getLoginUrl()}>登录</Button>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">权限不足</h2>
        <p className="text-muted-foreground">仅管理员可访问数据备份功能</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">数据备份管理</h1>
          <p className="text-muted-foreground">定期备份企业数据，防止误操作导致数据丢失</p>
        </div>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="gap-2">
          <Plus className="h-4 w-4" />
          {createMutation.isPending ? "备份中..." : "立即备份"}
        </Button>
      </div>

      {/* Backup Tips */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">数据安全提示</p>
              <p className="text-sm text-blue-600">建议每周至少备份一次，重要数据变更后立即备份。备份记录包含所有企业数据的快照。</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" />备份历史</CardTitle>
          <CardDescription>所有备份记录按时间倒序排列</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !backups?.data?.length ? (
            <div className="text-center py-8">
              <HardDrive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无备份记录</p>
              <p className="text-sm text-muted-foreground">点击"立即备份"创建第一个备份</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.data.map((backup: any) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100 text-green-600">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{backup.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(backup.createdAt).toLocaleString("zh-CN")} · {backup.recordCount} 条记录
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={backup.backupType === "manual" ? "default" : "secondary"}>
                      {backup.backupType === "manual" ? "手动" : "自动"}
                    </Badge>
                    <Badge variant="outline" className="text-green-600">成功</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
