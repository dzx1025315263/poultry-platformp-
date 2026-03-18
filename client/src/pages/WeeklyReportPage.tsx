import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Globe, TrendingUp, Ship, Users, Shield, Zap,
  RefreshCw, Calendar, FileText, ChevronLeft, ChevronRight,
  BookOpen, AlertTriangle, Loader2
} from "lucide-react";
import { Streamdown } from "streamdown";

const PART_CONFIG = [
  { key: "part1_macroLandscape", label: "全球宏观与贸易格局", labelEn: "Global Macro & Trade Landscape", icon: Globe, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  { key: "part2_priceVerification", label: "核心产区价格核准", labelEn: "Price Verification by Region", icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30" },
  { key: "part3_logisticsAlerts", label: "航运费率与物流预警", labelEn: "Shipping & Logistics Alerts", icon: Ship, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30" },
  { key: "part4_keyAccountGuide", label: "大客户开发指南", labelEn: "Key Account Development Guide", icon: Users, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  { key: "part5_riskControl", label: "风控模型与结算建议", labelEn: "Risk Control & Payment Terms", icon: Shield, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30" },
  { key: "part6_actionItems", label: "本周行动指南", labelEn: "Weekly Action Items", icon: Zap, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
];

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[1,2,3,4,5,6].map(i => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 mt-6 rounded-xl" />
    </div>
  );
}

function ReportPartCard({ part, report }: { part: typeof PART_CONFIG[0]; report: any }) {
  const content = report?.[part.key];
  const Icon = part.icon;
  
  return (
    <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow ${part.bgColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${part.color}`} />
          <span>{part.label}</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{part.labelEn}</p>
      </CardHeader>
      <CardContent>
        {content ? (
          <div className="text-sm text-muted-foreground line-clamp-4">
            {content.substring(0, 150)}...
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">暂无内容</p>
        )}
      </CardContent>
    </Card>
  );
}

function ReportDetail({ report }: { report: any }) {
  const [activeTab, setActiveTab] = useState("part1_macroLandscape");
  
  if (!report) return null;
  
  const activePart = PART_CONFIG.find(p => p.key === activeTab);
  const content = report[activeTab] || "暂无内容";
  
  return (
    <div className="space-y-4">
      {/* 6部分概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PART_CONFIG.map(part => (
          <button
            key={part.key}
            onClick={() => setActiveTab(part.key)}
            className={`text-left rounded-xl p-4 border transition-all ${
              activeTab === part.key 
                ? `ring-2 ring-primary shadow-md ${part.bgColor}` 
                : `hover:shadow-sm ${part.bgColor} opacity-70 hover:opacity-100`
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <part.icon className={`h-4 w-4 ${part.color}`} />
              <span className="font-medium text-sm">{part.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{part.labelEn}</p>
          </button>
        ))}
      </div>
      
      {/* 详细内容区域 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            {activePart && <activePart.icon className={`h-6 w-6 ${activePart.color}`} />}
            <div>
              <CardTitle className="text-lg">{activePart?.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{activePart?.labelEn}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Streamdown>{content}</Streamdown>
          </div>
        </CardContent>
      </Card>
      
      {/* 参考文献 */}
      {report.references && (
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              参考文献 / References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
              <Streamdown>{report.references}</Streamdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function WeeklyReportPage() {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  
  const { data: reportList, isLoading: listLoading, refetch: refetchList } = trpc.weeklyReport.list.useQuery({ page, pageSize: 10 });
  const { data: latestReport, isLoading: latestLoading } = trpc.weeklyReport.latest.useQuery();
  const { data: selectedReport, isLoading: detailLoading } = trpc.weeklyReport.get.useQuery(
    { id: selectedReportId! },
    { enabled: !!selectedReportId }
  );
  
  const generateMutation = trpc.weeklyReport.generate.useMutation({
    onSuccess: (result) => {
      if (result.status === "already_exists") {
        toast.info(`${result.weekLabel} 周报已生成，无需重复生成`);
        setSelectedReportId(result.id);
      } else {
        toast.success(`${result.weekLabel} 周报已成功生成`);
        setSelectedReportId(result.id);
      }
      refetchList();
    },
    onError: (err) => {
      toast.error(`生成失败: ${err.message}`);
    },
  });
  
  const activeReport = selectedReportId ? selectedReport : latestReport;
  const isLoading = selectedReportId ? detailLoading : latestLoading;
  
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            每周全球市场分析
          </h1>
          <p className="text-muted-foreground mt-1">
            Weekly Global Broiler Market Intelligence Report
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => generateMutation.mutate({})}
            disabled={generateMutation.isPending}
            className="gap-2"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {generateMutation.isPending ? "AI 生成中..." : "生成本周报告"}
          </Button>
        </div>
      </div>
      
      {/* 报告选择器 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">历史报告：</span>
        </div>
        {listLoading ? (
          <Skeleton className="h-9 w-48" />
        ) : reportList && reportList.data.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={selectedReportId?.toString() || latestReport?.id?.toString() || ""}
              onValueChange={(v) => setSelectedReportId(Number(v))}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="选择报告期数" />
              </SelectTrigger>
              <SelectContent>
                {reportList.data.map((r: any) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{r.weekLabel}</span>
                      <Badge variant={r.status === "completed" ? "default" : r.status === "generating" ? "secondary" : "destructive"} className="text-xs">
                        {r.status === "completed" ? "已完成" : r.status === "generating" ? "生成中" : "失败"}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {reportList.total > 10 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">{page}/{Math.ceil(reportList.total / 10)}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= Math.ceil(reportList.total / 10)} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            暂无历史报告，点击"生成本周报告"开始
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* 报告内容 */}
      {isLoading || generateMutation.isPending ? (
        <div className="space-y-4">
          {generateMutation.isPending && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">AI 正在生成每周市场分析报告...</p>
                  <p className="text-sm text-muted-foreground">
                    正在分析全球禽肉贸易数据、价格走势、航运费率等信息，预计需要 30-60 秒
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          <ReportSkeleton />
        </div>
      ) : activeReport ? (
        <div className="space-y-4">
          {/* 报告头部信息 */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {activeReport.weekLabel} 全球肉鸡行业外贸深度分析
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  报告日期：{new Date(activeReport.reportDate).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                  {" | "}数据来源：World Bank, USDA FAS, Aviagen, JBzyw.com, ABPA
                </p>
              </div>
              <Badge variant={activeReport.status === "completed" ? "default" : "secondary"}>
                {activeReport.status === "completed" ? "已完成" : "生成中"}
              </Badge>
            </CardContent>
          </Card>
          
          {/* 报告详情 */}
          <ReportDetail report={activeReport} />
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无市场分析报告</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              点击"生成本周报告"按钮，AI 将基于全球禽肉贸易数据、价格走势、航运费率等信息，
              自动生成一份包含 6 大板块的专业市场分析报告
            </p>
            <Button onClick={() => generateMutation.mutate({})} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              生成本周报告
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
