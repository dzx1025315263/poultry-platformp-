import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Copy, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function TeamsPage() {
  const { isAuthenticated } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const utils = trpc.useUtils();
  const { data: teams, isLoading } = trpc.team.list.useQuery(undefined, { enabled: isAuthenticated });
  const createTeam = trpc.team.create.useMutation({ onSuccess: () => { utils.team.list.invalidate(); setShowCreate(false); setTeamName(""); toast.success("团队创建成功"); } });
  const joinTeam = trpc.team.join.useMutation({ onSuccess: () => { utils.team.list.invalidate(); setShowJoin(false); setInviteCode(""); toast.success("加入团队成功"); } });
  const leaveTeam = trpc.team.leave.useMutation({ onSuccess: () => { utils.team.list.invalidate(); toast.success("已退出团队"); } });

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
    </div>
  );
}
