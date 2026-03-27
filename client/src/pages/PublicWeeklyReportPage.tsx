import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import {
  Globe, TrendingUp, Ship, Users, Shield, Zap,
  Calendar, FileText, ChevronLeft, ChevronRight,
  BookOpen, AlertTriangle, Download, ArrowLeft,
  Newspaper, Clock
} from "lucide-react";
import { Streamdown } from "streamdown";

const PART_CONFIG = [
  { key: "part1_macroLandscape", label: "全球宏观与贸易格局", labelEn: "Global Macro & Trade Landscape", icon: Globe, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", borderColor: "border-blue-200 dark:border-blue-800" },
  { key: "part2_priceVerification", label: "核心产区价格核准", labelEn: "Price Verification by Region", icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", borderColor: "border-emerald-200 dark:border-emerald-800" },
  { key: "part3_logisticsAlerts", label: "需求端——中东与北非", labelEn: "Demand: Middle East & North Africa", icon: Ship, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30", borderColor: "border-orange-200 dark:border-orange-800" },
  { key: "part4_keyAccountGuide", label: "需求端——亚洲与其他市场", labelEn: "Demand: Asia & Other Markets", icon: Users, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30", borderColor: "border-purple-200 dark:border-purple-800" },
  { key: "part5_riskControl", label: "商业实战与财务风控", labelEn: "Business Strategy & Risk Control", icon: Shield, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30", borderColor: "border-red-200 dark:border-red-800" },
  { key: "part6_actionItems", label: "本周行动指南", labelEn: "Weekly Action Items", icon: Zap, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30", borderColor: "border-amber-200 dark:border-amber-800" },
];

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-5 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[500px] mt-6 rounded-xl" />
    </div>
  );
}

function exportReportText(report: any) {
  const parts = [
    { title: '全球宏观与贸易格局', content: report.part1_macroLandscape },
    { title: '核心产区价格核准', content: report.part2_priceVerification },
    { title: '需求端——中东与北非', content: report.part3_logisticsAlerts },
    { title: '需求端——亚洲与其他市场', content: report.part4_keyAccountGuide },
    { title: '商业实战与财务风控', content: report.part5_riskControl },
    { title: '本周行动指南', content: report.part6_actionItems },
  ];
  const dateStr = new Date(report.reportDate).toLocaleDateString('zh-CN');
  let text = `全球肉鸡外贸深度研报\n${report.weekLabel} | ${dateStr}\n${'='.repeat(60)}\n\n`;
  parts.forEach((p, i) => {
    text += `\n${'\u2550'.repeat(40)}\n第${i + 1}部分：${p.title}\n${'\u2550'.repeat(40)}\n\n${p.content || '暂无内容'}\n`;
  });
  if (report.references) {
    text += `\n${'\u2550'.repeat(40)}\n参考文献\n${'\u2550'.repeat(40)}\n\n${report.references}\n`;
  }
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `全球禽肉周报_${report.weekLabel}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PublicWeeklyReportPage() {
  const [, navigate] = useLocation();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("part1_macroLandscape");
  const [page, setPage] = useState(1);

  // 使用公开 API
  const { data: reportList, isLoading: listLoading } = trpc.marketInsights.weeklyReports.useQuery({ page, pageSize: 20 });
  const { data: latestReport, isLoading: latestLoading } = trpc.marketInsights.latestWeeklyReport.useQuery();
  const { data: selectedReport, isLoading: detailLoading } = trpc.marketInsights.weeklyReportById.useQuery(
    { id: selectedReportId! },
    { enabled: !!selectedReportId }
  );

  const activeReport = selectedReportId ? selectedReport : latestReport;
  const isLoading = selectedReportId ? detailLoading : latestLoading;

  const activePart = PART_CONFIG.find(p => p.key === activeTab);
  const content = activeReport?.[activeTab as keyof typeof activeReport] as string || "";

  if (isLoading || latestLoading) {
    return (
      <div className="space-y-6 max-w-[1400px]">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">每周深度研报</h1>
            <p className="text-muted-foreground text-sm">加载中...</p>
          </div>
        </div>
        <ReportSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground -ml-2" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-7 w-7 text-primary" />
            全球肉鸡外贸深度研报
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Weekly Global Poultry Trade In-Depth Report · 由 UGG Research Team 出品 · 每周三更新
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activeReport && activeReport.status === 'completed' && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportReportText(activeReport)}>
              <Download className="h-4 w-4" />
              导出报告
            </Button>
          )}
        </div>
      </div>

      {/* ─── 报告列表 ─── */}
      {reportList && reportList.data && reportList.data.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            历史期数：
          </span>
          {reportList.data.map((r: any) => (
            <Button
              key={r.id}
              variant={(!selectedReportId && r.id === latestReport?.id) || selectedReportId === r.id ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => {
                setSelectedReportId(r.id);
                setActiveTab("part1_macroLandscape");
              }}
            >
              <Newspaper className="h-3 w-3" />
              {r.weekLabel}
              {r.id === latestReport?.id && (
                <Badge variant="secondary" className="text-[9px] ml-1 px-1 py-0">最新</Badge>
              )}
            </Button>
          ))}
          {reportList.total > 20 && (
            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">{page}/{Math.ceil(reportList.total / 20)}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= Math.ceil(reportList.total / 20)} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {activeReport ? (
        <>
          {/* ─── 报告头部 ─── */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    {activeReport.weekLabel} · 全球肉鸡外贸终极深度研报
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(activeReport.reportDate).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      约 15 分钟阅读
                    </span>
                    <span>数据来源：USDA, UNCTAD, Poultry World, 海关总署</span>
                  </p>
                </div>
                <Badge variant={activeReport.status === "completed" ? "default" : "secondary"} className="self-start">
                  {activeReport.status === "completed" ? "已发布" : "生成中"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* ─── 6大板块导航卡片 ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PART_CONFIG.map(part => {
              const Icon = part.icon;
              const hasContent = !!(activeReport as any)?.[part.key];
              return (
                <button
                  key={part.key}
                  onClick={() => setActiveTab(part.key)}
                  className={`text-left rounded-xl p-4 border transition-all ${
                    activeTab === part.key
                      ? `ring-2 ring-primary shadow-md ${part.bgColor} ${part.borderColor}`
                      : `hover:shadow-sm ${part.bgColor} opacity-70 hover:opacity-100 border-transparent`
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${part.color}`} />
                    <span className="font-medium text-sm">{part.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{part.labelEn}</p>
                  {!hasContent && (
                    <p className="text-xs text-muted-foreground/60 italic mt-1">暂无内容</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── 正文内容 ─── */}
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
            <CardContent className="pt-6">
              {content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg
                  prose-table:text-sm prose-th:bg-muted/50 prose-th:p-2 prose-td:p-2
                  prose-strong:text-foreground
                  prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg">
                  <Streamdown>{content}</Streamdown>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">该板块内容即将发布</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── 参考文献 ─── */}
          {activeReport.references && (
            <Card className="border-0 shadow-sm bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  参考文献 / References
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                  <Streamdown>{activeReport.references}</Streamdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── 导航按钮 ─── */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" className="gap-2" onClick={() => {
              const idx = PART_CONFIG.findIndex(p => p.key === activeTab);
              if (idx > 0) setActiveTab(PART_CONFIG[idx - 1].key);
            }} disabled={activeTab === PART_CONFIG[0].key}>
              <ChevronLeft className="h-4 w-4" />
              上一章
            </Button>
            <span className="text-xs text-muted-foreground">
              {PART_CONFIG.findIndex(p => p.key === activeTab) + 1} / {PART_CONFIG.length}
            </span>
            <Button variant="ghost" className="gap-2" onClick={() => {
              const idx = PART_CONFIG.findIndex(p => p.key === activeTab);
              if (idx < PART_CONFIG.length - 1) setActiveTab(PART_CONFIG[idx + 1].key);
            }} disabled={activeTab === PART_CONFIG[PART_CONFIG.length - 1].key}>
              下一章
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无深度研报</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              每周三发布全球肉鸡外贸深度研报，涵盖宏观经济、产区价格、需求分析、商业实战等六大板块。
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              返回首页
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Footer ─── */}
      <div className="text-center py-4 border-t">
        <p className="text-xs text-muted-foreground">
          Universal Gourmand Group · Global Poultry Intelligence Platform · Weekly reports published every Wednesday
        </p>
      </div>
    </div>
  );
}
