import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { CheckCircle2, Circle, Clock, Plus, Trash2, ListTodo, AlertTriangle, ArrowUp, Minus } from "lucide-react";

const priorityConfig: Record<string, { label: string; color: string; icon: typeof ArrowUp }> = {
  urgent: { label: "紧急", color: "text-red-600 bg-red-50 border-red-200", icon: AlertTriangle },
  high: { label: "高", color: "text-orange-600 bg-orange-50 border-orange-200", icon: ArrowUp },
  medium: { label: "中", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Minus },
  low: { label: "低", color: "text-gray-500 bg-gray-50 border-gray-200", icon: Minus },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "待处理", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "进行中", color: "bg-blue-100 text-blue-800" },
  done: { label: "已完成", color: "bg-green-100 text-green-800" },
};

export default function TodoPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [addDialog, setAddDialog] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: "", description: "", priority: "medium" as string });

  const utils = trpc.useUtils();
  const { data: pendingItems } = trpc.todo.list.useQuery({ status: "pending" }, { enabled: isAuthenticated });
  const { data: inProgressItems } = trpc.todo.list.useQuery({ status: "in_progress" }, { enabled: isAuthenticated });
  const { data: doneItems } = trpc.todo.list.useQuery({ status: "done" }, { enabled: isAuthenticated });

  const addMutation = trpc.todo.add.useMutation({
    onSuccess: () => {
      toast.success("待办事项已添加");
      setAddDialog(false);
      setNewTodo({ title: "", description: "", priority: "medium" });
      utils.todo.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.todo.update.useMutation({
    onSuccess: () => {
      utils.todo.list.invalidate();
    },
  });

  const completeMutation = trpc.todo.complete.useMutation({
    onSuccess: () => {
      toast.success("已完成");
      utils.todo.list.invalidate();
    },
  });

  const deleteMutation = trpc.todo.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
      utils.todo.list.invalidate();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <ListTodo className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先登录</h2>
        <p className="text-muted-foreground">登录后可使用待办事项功能</p>
        <Button onClick={() => window.location.href = getLoginUrl()}>登录</Button>
      </div>
    );
  }

  const renderTodoItem = (item: any) => {
    const priority = priorityConfig[item.priority] || priorityConfig.medium;
    const status = statusConfig[item.status] || statusConfig.pending;
    const PriorityIcon = priority.icon;

    return (
      <div key={item.id} className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
        {/* 完成/未完成按钮 */}
        <button
          className="mt-0.5 shrink-0"
          onClick={() => {
            if (item.status === 'done') {
              updateMutation.mutate({ id: item.id, status: 'pending', completedAt: null });
            } else {
              completeMutation.mutate({ id: item.id });
            }
          }}
        >
          {item.status === 'done' ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : item.status === 'in_progress' ? (
            <Clock className="h-5 w-5 text-blue-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
          )}
        </button>

        {/* 内容 */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${item.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {item.title}
            </span>
            <Badge variant="outline" className={`text-[10px] ${priority.color}`}>
              <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />
              {priority.label}
            </Badge>
            {item.source && (
              <Badge variant="secondary" className="text-[10px]">{item.source}</Badge>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>创建: {new Date(item.createdAt).toLocaleString('zh-CN')}</span>
            {item.dueDate && (
              <span className="text-orange-600">截止: {new Date(item.dueDate).toLocaleDateString('zh-CN')}</span>
            )}
            {item.completedAt && (
              <span className="text-green-600">完成: {new Date(item.completedAt).toLocaleString('zh-CN')}</span>
            )}
          </div>
        </div>

        {/* 操作 */}
        <div className="flex items-center gap-1 shrink-0">
          {item.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => updateMutation.mutate({ id: item.id, status: 'in_progress' })}
            >
              <Clock className="h-3 w-3 mr-1" />
              开始
            </Button>
          )}
          {item.status === 'in_progress' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => completeMutation.mutate({ id: item.id })}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              完成
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => deleteMutation.mutate({ id: item.id })}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  const pendingCount = pendingItems?.length || 0;
  const inProgressCount = inProgressItems?.length || 0;
  const doneCount = doneItems?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-primary" />
            待办事项
          </h1>
          <p className="text-muted-foreground mt-1">
            管理您的工作任务和飞书通知提醒
          </p>
        </div>
        <Button onClick={() => setAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          新建待办
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-sm" onClick={() => setActiveTab("pending")}>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">待处理</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-sm" onClick={() => setActiveTab("in_progress")}>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-xs text-muted-foreground">进行中</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-sm" onClick={() => setActiveTab("done")}>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-green-600">{doneCount}</div>
            <div className="text-xs text-muted-foreground">已完成</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1">
            待处理 {pendingCount > 0 && <Badge variant="secondary" className="text-[10px]">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-1">
            进行中 {inProgressCount > 0 && <Badge variant="secondary" className="text-[10px]">{inProgressCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="done" className="gap-1">
            已完成 {doneCount > 0 && <Badge variant="secondary" className="text-[10px]">{doneCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-2">
          {pendingCount === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Circle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>暂无待处理事项</p>
              </CardContent>
            </Card>
          ) : (
            pendingItems?.map(renderTodoItem)
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="mt-4 space-y-2">
          {inProgressCount === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>暂无进行中事项</p>
              </CardContent>
            </Card>
          ) : (
            inProgressItems?.map(renderTodoItem)
          )}
        </TabsContent>

        <TabsContent value="done" className="mt-4 space-y-2">
          {doneCount === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>暂无已完成事项</p>
              </CardContent>
            </Card>
          ) : (
            doneItems?.map(renderTodoItem)
          )}
        </TabsContent>
      </Tabs>

      {/* 新建待办对话框 */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建待办事项</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">标题</label>
              <Input
                placeholder="待办事项标题"
                value={newTodo.title}
                onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">描述（可选）</label>
              <Textarea
                placeholder="详细描述..."
                value={newTodo.description}
                onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">优先级</label>
              <Select value={newTodo.priority} onValueChange={(v) => setNewTodo(prev => ({ ...prev, priority: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">紧急</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>取消</Button>
            <Button
              onClick={() => addMutation.mutate({
                title: newTodo.title,
                description: newTodo.description || undefined,
                priority: newTodo.priority as any,
              })}
              disabled={!newTodo.title.trim() || addMutation.isPending}
            >
              {addMutation.isPending ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
