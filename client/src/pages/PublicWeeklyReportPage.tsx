import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe, TrendingUp, Ship, Users, Shield, Zap,
  Calendar, FileText, ChevronLeft, ArrowLeft,
  BookOpen, AlertTriangle, Download, Clock, Newspaper
} from "lucide-react";
import { Streamdown } from "streamdown";
import { industryConfig } from "@shared/industry-config";

const PART_CONFIG = [
  { key: "part1_macroLandscape", label: "全球宏观与贸易格局", labelEn: "Global Macro & Trade Landscape", icon: Globe, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", borderColor: "border-blue-200 dark:border-blue-800" },
  { key: "part2_priceVerification", label: "核心产区价格核准", labelEn: "Price Verification by Region", icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", borderColor: "border-emerald-200 dark:border-emerald-800" },
  { key: "part3_logisticsAlerts", label: "需求端——中东与北非", labelEn: "Demand: Middle East & North Africa", icon: Ship, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30", borderColor: "border-orange-200 dark:border-orange-800" },
  { key: "part4_keyAccountGuide", label: "需求端——亚洲与其他", labelEn: "Demand: Asia & Others", icon: Users, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30", borderColor: "border-purple-200 dark:border-purple-800" },
  { key: "part5_riskControl", label: "商业实战与风控模型", labelEn: "Business Strategy & Risk Control", icon: Shield, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30", borderColor: "border-red-200 dark:border-red-800" },
  { key: "part6_actionItems", label: "本周行动指南", labelEn: "Weekly Action Items", icon: Zap, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30", borderColor: "border-amber-200 dark:border-amber-800" },
];

function exportReportText(report: any) {
  const parts = PART_CONFIG.map(p => ({
    title: p.label,
    content: report[p.key],
  }));
  const dateStr = new Date(report.reportDate).toLocaleDateString('zh-CN');
  let text = `全球肉鸡外贸终极深度研报\n${report.weekLabel} | ${dateStr}\n${'='.repeat(60)}\n\n`;
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

function ReportListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

function ReportDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-6 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 mt-6 rounded-xl" />
    </div>
  );
}

/** 周报列表视图 */
function ReportList({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: reportList, isLoading } = trpc.marketInsights.weeklyReports.useQuery({ page: 1, pageSize: 20 });

  if (isLoading) return <ReportListSkeleton />;

  const reports = reportList?.data || [];

  if (reports.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">暂无周报</h3>
          <p className="text-sm text-muted-foreground">每周三发布全球禽肉行业深度分析报告</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.filter((r: any) => r.status === 'completed').map((report: any) => {
        const dateStr = new Date(report.reportDate).toLocaleDateString('zh-CN', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        // 提取第一部分的前150个字符作为摘要
        const summary = report.part1_macroLandscape
          ? report.part1_macroLandscape.replace(/^#+\s.+\n/gm, '').replace(/\*\*/g, '').trim().substring(0, 200) + '...'
          : '点击查看完整报告';

        return (
          <Card
            key={report.id}
            className="hover:shadow-md transition-all cursor-pointer group border hover:border-primary/30"
            onClick={() => onSelect(report.id)}
          >
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* 左侧周标识 */}
                <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center border">
                  <span className="text-xs text-muted-foreground font-medium">
                    {report.weekLabel.split('-')[0]}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {report.weekLabel.split('-W')[1]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">WEEK</span>
                </div>

                {/* 右侧内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                      全球肉鸡外贸深度研报 · {report.weekLabel}
                    </h3>
                    <Badge variant="default" className="text-[10px]">已发布</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dateStr}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      6 个章节
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      约 15 分钟阅读
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{summary}</p>

                  {/* 章节标签 */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {PART_CONFIG.map(part => (
                      <span
                        key={part.key}
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${part.bgColor} ${part.color}`}
                      >
                        <part.icon className="h-2.5 w-2.5" />
                        {part.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/** 周报详情视图 */
function ReportDetail({ reportId, onBack }: { reportId: number; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("part1_macroLandscape");
  const { data: report, isLoading } = trpc.marketInsights.weeklyReportById.useQuery({ id: reportId });

  if (isLoading) return <ReportDetailSkeleton />;
  if (!report) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">报告未找到</p>
          <Button variant="ghost" className="mt-4" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> 返回列表
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activePart = PART_CONFIG.find(p => p.key === activeTab);
  const content = (report as any)[activeTab] || "暂无内容";
  const dateStr = new Date(report.reportDate).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-5">
      {/* 返回 + 标题 */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> 返回周报列表
          </Button>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            全球肉鸡外贸深度研报 · {report.weekLabel}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {dateStr} · UGG Research Team · 数据来源：USDA, UNCTAD, Poultry World, 海关总署
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportReportText(report)}>
          <Download className="h-3.5 w-3.5" />
          导出
        </Button>
      </div>

      {/* 6部分导航卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {PART_CONFIG.map(part => {
          const isActive = activeTab === part.key;
          const hasContent = !!(report as any)[part.key];
          return (
            <button
              key={part.key}
              onClick={() => setActiveTab(part.key)}
              className={`text-left rounded-xl p-3 border transition-all ${
                isActive
                  ? `ring-2 ring-primary shadow-md ${part.bgColor} ${part.borderColor}`
                  : `hover:shadow-sm ${part.bgColor} opacity-60 hover:opacity-100 border-transparent`
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <part.icon className={`h-3.5 w-3.5 ${part.color}`} />
                <span className="font-medium text-xs leading-tight">{part.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">{part.labelEn}</p>
              {!hasContent && (
                <span className="text-[9px] text-muted-foreground/50 italic">暂无</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 内容区域 */}
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
        <CardContent className="pt-5">
          <div className="prose prose-sm dark:prose-invert max-w-none
            prose-headings:font-bold prose-h2:text-lg prose-h3:text-base
            prose-table:text-xs prose-td:px-2 prose-td:py-1.5
            prose-th:px-2 prose-th:py-1.5 prose-th:bg-muted/50
            prose-strong:text-foreground
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-li:marker:text-primary
          ">
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
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-xs leading-relaxed">
              <Streamdown>{report.references}</Streamdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 底部导航 */}
      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回周报列表
        </Button>
      </div>
    </div>
  );
}

/** 主页面：列表 ↔ 详情 切换 */
export default function PublicWeeklyReportPage() {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* 页面标题 */}
      {!selectedReportId && (
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">每周深度研报</h1>
              <p className="text-muted-foreground text-sm">
                Weekly In-Depth Market Report · 每周三发布 · 由 UGG Research Team 出品
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedReportId ? (
        <ReportDetail reportId={selectedReportId} onBack={() => setSelectedReportId(null)} />
      ) : (
        <ReportList onSelect={(id) => setSelectedReportId(id)} />
      )}
    </div>
  );
}
