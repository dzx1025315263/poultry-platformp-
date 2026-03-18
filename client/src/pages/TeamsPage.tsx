import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Copy, LogOut, Activity, Star, Mail, UserPlus, Edit, MessageSquare } from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const ACTION_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  add_favorite: { icon: Star, label: "添加收藏", color: "text-yellow-500" },
  remove_favorite: { icon: Star, label: "移除收藏", color: "text-gray-400" },
  update_status: { icon: Edit, label: "更新跟进状态", color: "text-blue-500" },
  send_email: { icon: Mail, label: "发送邮件", color: "text-green-500" },
  bulk_email: { icon: Mail, label: "批量发邮件", color: "text-emerald-500" },
  add_contact: { icon: UserPlus, label: "添加联系人", color: "text-purple-500" },
  import_contacts: { icon: UserPlus, label: "批量导入联系人", color: "text-indigo-500" },
  add_note: { icon: MessageSquare, label: "添加备注", color: "text-orange-500" },
};

export default function TeamsPage() {
  const { isAuthenticated } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [activeTab, setActiveTab] = useState("teams");
  const utils = trpc.useUtils();
  const { data: teams, isLoading } = trpc.team.list.useQuery(undefined, { enabled: isAuthenticated });
  const createTeam = trpc.team.create.useMutation({ onSuccess: () => { utils.team.list.invalidate(); setShowCreate(false); setTeamName(""); toast.success("团队创建成功"); } });
  const joinTeam = trpc.team.join.useMutation({ onSuccess: () => { utils.team.list.invalidate(); setShowJoin(false); setInviteCode(""); toast.success("加入团队成功"); } });
  const leaveTeam = trpc.team.leave.useMutation({ onSuccess: () => { utils.team.list.invalidate(); toast.success("已退出团队"); } });
  const firstTeamId = teams?.[0]?.team?.id;
  const { data: activities, isLoading: activitiesLoading } = trpc.teamActivity.list.useQuery(
    { teamId: firstTeamId!, limit: 50 },
    { enabled: isAuthenticated && !!firstTeamId }
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Users className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">登录后解锁团队功能</h2>
        <p className="text-muted-foreground">创建团队、邀请成员、共享企业数据</p>
        <Button onClick={() => { window.location.href = getLoginUrl(); }}>登录</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">团队管理</h1><p className="text-muted-foreground mt-1">创建或加入团队，协作管理客户</p></div>
        <div className="flex gap-2">
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />创建团队</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>创建新团队</DialogTitle></DialogHeader>
              <Input placeholder="团队名称" value={teamName} onChange={e => setTeamName(e.target.value)} />
              <Button onClick={() => teamName.trim() && createTeam.mutate({ name: teamName })} disabled={!teamName.trim()}>创建</Button>
            </DialogContent>
          </Dialog>
          <Dialog open={showJoin} onOpenChange={setShowJoin}>
            <DialogTrigger asChild><Button variant="outline" size="sm">加入团队</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>通过邀请码加入</DialogTitle></DialogHeader>
              <Input placeholder="输入邀请码" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
              <Button onClick={() => inviteCode.trim() && joinTeam.mutate({ inviteCode })} disabled={!inviteCode.trim()}>加入</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="teams" className="gap-1"><Users className="h-3.5 w-3.5" />我的团队</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1"><Activity className="h-3.5 w-3.5" />团队动态</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">{Array.from({length:2}).map((_,i) => <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>)}</div>
          ) : !teams?.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">您还没有加入任何团队，创建或加入一个吧！</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {teams.map((t: any) => (
                <Card key={t.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />{t.name}
                      <Badge variant="outline" className="text-xs">{t.memberCount || 0} 人</Badge>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => { navigator.clipboard.writeText(t.inviteCode); toast.success("邀请码已复制"); }}>
                        <Copy className="h-3 w-3 mr-1" />{t.inviteCode}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => leaveTeam.mutate({ teamId: t.id })}>
                        <LogOut className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">创建于 {new Date(t.createdAt).toLocaleDateString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                团队活动动态
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
              ) : !activities?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>暂无团队活动记录</p>
                  <p className="text-xs mt-1">当团队成员添加收藏、更新状态、发送邮件时，活动将显示在这里</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activities.map((a: any) => {
                    const config = ACTION_CONFIG[a.actionType] || { icon: Activity, label: a.actionType, color: "text-gray-500" };
                    const Icon = config.icon;
                    const timeAgo = getTimeAgo(a.createdAt);
                    return (
                      <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`mt-0.5 p-1.5 rounded-full bg-muted ${config.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{a.userName}</span>
                            <span className="text-muted-foreground"> {config.label} </span>
                            {a.targetName && <span className="font-medium">{a.targetName}</span>}
                          </p>
                          {a.details && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.details}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getTimeAgo(dateStr: string | number): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}
