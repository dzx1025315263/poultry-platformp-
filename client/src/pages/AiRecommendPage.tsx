import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { Sparkles, Building2, MapPin, Star, RefreshCw, Heart, ExternalLink, Zap, Brain, ThumbsDown, Undo2, AlertCircle } from "lucide-react";

export default function AiRecommendPage() {
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [profileSummary, setProfileSummary] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [excludeDialog, setExcludeDialog] = useState<{ open: boolean; companyId: number; companyName: string }>({ open: false, companyId: 0, companyName: "" });
  const [excludeReason, setExcludeReason] = useState("");
  const [activeTab, setActiveTab] = useState("recommend");

  const utils = trpc.useUtils();
  const addFavorite = trpc.favorite.add.useMutation({
    onSuccess: () => { utils.favorite.ids.invalidate(); toast.success("已添加到收藏夹"); },
  });
  const { data: favIds } = trpc.favorite.ids.useQuery(undefined, { enabled: isAuthenticated });

  // V2.3: 不感兴趣排除列表
  const { data: exclusions, refetch: refetchExclusions } = trpc.aiRecommend.getExclusions.useQuery(undefined, { enabled: isAuthenticated });
  const excludeMutation = trpc.aiRecommend.exclude.useMutation({
    onSuccess: () => {
      toast.success("已标记为不感兴趣，下次推荐将排除此企业");
      setExcludeDialog({ open: false, companyId: 0, companyName: "" });
      setExcludeReason("");
      // 从当前推荐列表中移除
      setRecommendations(prev => prev.filter(r => r.companyId !== excludeDialog.companyId));
      refetchExclusions();
    },
    onError: (err) => toast.error(err.message),
  });
  const removeExclusionMutation = trpc.aiRecommend.removeExclusion.useMutation({
    onSuccess: () => {
      toast.success("已恢复，下次推荐将重新包含此企业");
      refetchExclusions();
    },
    onError: (err) => toast.error(err.message),
  });

  const recommendMutation = trpc.aiRecommend.getRecommendations.useMutation({
    onSuccess: (data) => {
      setRecommendations(data.recommendations || []);
      setProfileSummary(data.profileSummary || "");
      setStatusMessage(data.message || "");
      if (data.recommendations?.length === 0) {
        toast.info(data.message || "暂无推荐结果");
      } else {
        toast.success(`AI 推荐了 ${data.recommendations?.length || 0} 家潜在客户`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Sparkles className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先登录</h2>
        <p className="text-muted-foreground">登录后可使用AI智能客户推荐功能</p>
        <Button onClick={() => window.location.href = getLoginUrl()}>登录</Button>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "高度匹配";
    if (score >= 60) return "较好匹配";
    if (score >= 40) return "一般匹配";
    return "低匹配";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            AI 智能客户推荐
          </h1>
          <p className="text-muted-foreground mt-1">
            基于已成交客户画像，AI 自动匹配高潜力目标企业
          </p>
        </div>
        <Button
          onClick={() => recommendMutation.mutate({ limit: 15 })}
          disabled={recommendMutation.isPending}
          className="gap-2"
          size="lg"
        >
          {recommendMutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              AI 分析中...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              开始推荐
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recommend">推荐结果</TabsTrigger>
          <TabsTrigger value="excluded" className="gap-1">
            不感兴趣
            {exclusions && exclusions.length > 0 && (
              <Badge variant="secondary" className="text-[10px] ml-1">{exclusions.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommend" className="space-y-4 mt-4">
          {/* 工作原理 */}
          {recommendations.length === 0 && !recommendMutation.isPending && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-4">
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 w-40">
                      <Star className="h-8 w-8 text-amber-500" />
                      <span className="text-sm font-medium">已成交客户</span>
                      <span className="text-xs text-muted-foreground">分析成交画像</span>
                    </div>
                    <div className="flex items-center"><Zap className="h-6 w-6 text-primary" /></div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 w-40">
                      <Brain className="h-8 w-8 text-purple-500" />
                      <span className="text-sm font-medium">AI 匹配</span>
                      <span className="text-xs text-muted-foreground">智能评分排序</span>
                    </div>
                    <div className="flex items-center"><Zap className="h-6 w-6 text-primary" /></div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 w-40">
                      <Building2 className="h-8 w-8 text-green-500" />
                      <span className="text-sm font-medium">推荐客户</span>
                      <span className="text-xs text-muted-foreground">高潜力目标</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    请先在"生命周期看板"中将客户标记为"已成交"或"复购"状态，或在"收藏夹 CRM"中将跟进状态设为"已成交"，
                    然后点击"开始推荐"按钮，AI 将基于这些客户画像为您推荐最可能成交的新客户。
                  </p>
                  {exclusions && exclusions.length > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      已排除 {exclusions.length} 家标记为"不感兴趣"的企业
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 加载中 */}
          {recommendMutation.isPending && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Brain className="h-12 w-12 text-primary animate-pulse" />
                    <Sparkles className="h-5 w-5 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <p className="font-medium">AI 正在分析客户画像并匹配潜在客户...</p>
                  <p className="text-sm text-muted-foreground">这可能需要 10-20 秒，请耐心等待</p>
                  <Progress value={undefined} className="w-64 h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 状态消息 */}
          {statusMessage && !recommendMutation.isPending && (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">{statusMessage}</p>
              </CardContent>
            </Card>
          )}

          {/* 客户画像摘要 */}
          {profileSummary && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  客户画像分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{profileSummary}</p>
              </CardContent>
            </Card>
          )}

          {/* 推荐结果 */}
          {recommendations.length > 0 && (
            <ScrollArea className="h-[calc(100vh-420px)]">
              <div className="space-y-3">
                {recommendations.map((rec: any, index: number) => {
                  const company = rec.company;
                  if (!company) return null;
                  const isFaved = favIds?.includes(company.id);
                  return (
                    <Card key={rec.companyId} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-1 shrink-0 w-12">
                            <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                          </div>
                          <div className={`flex flex-col items-center gap-1 p-3 rounded-lg border shrink-0 w-24 ${getScoreColor(rec.matchScore)}`}>
                            <span className="text-2xl font-bold">{rec.matchScore}</span>
                            <span className="text-[10px] font-medium">{getScoreLabel(rec.matchScore)}</span>
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{company.companyName}</h3>
                              {company.hasPurchasedFromChina === '是' && (
                                <Badge variant="secondary" className="text-[10px] shrink-0">中国采购</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {company.country} · {company.continent}
                              </span>
                              {company.coreRole && (
                                <Badge variant="outline" className="text-[10px]">{company.coreRole}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{rec.reason}</p>
                            {company.mainProducts && (
                              <p className="text-xs text-muted-foreground truncate">主营: {company.mainProducts}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button
                              variant={isFaved ? "secondary" : "default"}
                              size="sm"
                              disabled={isFaved || addFavorite.isPending}
                              onClick={() => addFavorite.mutate({ companyId: company.id })}
                            >
                              <Heart className={`h-3 w-3 mr-1 ${isFaved ? "fill-current" : ""}`} />
                              {isFaved ? "已收藏" : "收藏"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => setExcludeDialog({ open: true, companyId: company.id, companyName: company.companyName })}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              不感兴趣
                            </Button>
                            {company.websiteSocial && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const url = company.websiteSocial.match(/https?:\/\/[^\s,]+/)?.[0];
                                  if (url) window.open(url, '_blank');
                                  else toast.info(company.websiteSocial);
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                官网
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="excluded" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ThumbsDown className="h-4 w-4" />
                不感兴趣列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!exclusions || exclusions.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ThumbsDown className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>暂无标记为不感兴趣的企业</p>
                  <p className="text-xs mt-1">在推荐结果中点击"不感兴趣"可将企业添加到此列表</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exclusions.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{item.company?.companyName}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {item.company?.country} · {item.company?.continent}
                          </span>
                        </div>
                        {item.reason && (
                          <p className="text-xs text-muted-foreground mt-1 ml-6">{item.reason}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1 ml-6">
                          标记时间: {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExclusionMutation.mutate({ companyId: item.companyId })}
                        disabled={removeExclusionMutation.isPending}
                      >
                        <Undo2 className="h-3 w-3 mr-1" />
                        恢复
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 不感兴趣对话框 */}
      <Dialog open={excludeDialog.open} onOpenChange={(open) => { if (!open) setExcludeDialog({ open: false, companyId: 0, companyName: "" }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsDown className="h-4 w-4" />
              标记为不感兴趣
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              确定将 <span className="font-medium text-foreground">{excludeDialog.companyName}</span> 标记为不感兴趣？
              下次AI推荐将不再包含此企业。
            </p>
            <div>
              <label className="text-sm font-medium">原因（可选）</label>
              <Textarea
                placeholder="例如：已通过其他渠道联系过、不符合目标市场..."
                value={excludeReason}
                onChange={(e) => setExcludeReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcludeDialog({ open: false, companyId: 0, companyName: "" })}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => excludeMutation.mutate({ companyId: excludeDialog.companyId, reason: excludeReason || undefined })}
              disabled={excludeMutation.isPending}
            >
              {excludeMutation.isPending ? "处理中..." : "确认标记"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
