import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Newspaper, TrendingUp, TrendingDown, AlertTriangle, Shield, Globe, Building2,
  ArrowRight, Clock, MapPin, Factory, BarChart3, FileText, Minus, ChevronRight,
  Flame, Snowflake, DollarSign, Activity, BookOpen, Users, Map, Zap,
  MessageCircle, Lock
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  Cell
} from "recharts";
import { useLocation } from "wouter";
import { useState } from "react";
import { usePageView } from "@/hooks/usePageView";
import { Eye } from "lucide-react";

// 风险类型配置
const RISK_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  disease: { label: "疫病风险", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30" },
  trade_policy: { label: "贸易政策", icon: Shield, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  exchange_rate: { label: "汇率波动", icon: DollarSign, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
  supply_chain: { label: "供应链", icon: Factory, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  weather: { label: "极端天气", icon: Snowflake, color: "text-cyan-600", bgColor: "bg-cyan-50 dark:bg-cyan-950/30" },
};

// 严重程度配置
const SEVERITY_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  critical: { label: "紧急", color: "text-red-700 bg-red-100 dark:bg-red-900/40", dotColor: "bg-red-500" },
  high: { label: "高", color: "text-orange-700 bg-orange-100 dark:bg-orange-900/40", dotColor: "bg-orange-500" },
  medium: { label: "中", color: "text-yellow-700 bg-yellow-100 dark:bg-yellow-900/40", dotColor: "bg-yellow-500" },
  low: { label: "低", color: "text-green-700 bg-green-100 dark:bg-green-900/40", dotColor: "bg-green-500" },
};

// 影响等级配置
const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: "重大影响", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  medium: { label: "中等影响", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  low: { label: "一般", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
};

// 产区颜色
const REGION_COLORS: Record<string, string> = {
  "USA": "#3b82f6",
  "China": "#ef4444",
  "Brazil": "#22c55e",
  "EU": "#8b5cf6",
  "Thailand": "#f59e0b",
  "Turkey": "#06b6d4",
};

function ContactCTABanner({ onContact }: { onContact: () => void }) {
  return (
    <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
      <CardContent className="py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/ugg-logo-sm.png" alt="UGG" className="h-10 w-10 object-contain" />
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Universal Gourmand Group
          </h3>
        </div>
        <p className="text-muted-foreground max-w-lg mx-auto mb-6">
          获取完整的全球禽业企业数据库访问权限，包含 2,300+ 家企业的详细信息、联系方式和采购历史。
          加入我们的专业社群，获取每周独家行业分析报告。
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button
            onClick={onContact}
            className="h-11 px-8 text-base gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <MessageCircle className="h-4 w-4" />
            联系我们获取完整数据
          </Button>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> 2,315+ 企业</span>
            <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> 111 国家</span>
            <span className="flex items-center gap-1"><Map className="h-4 w-4" /> 377 城市</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketInsightsPage() {
  const { user } = useAuth();
  const isGuest = !user;
  const [, navigate] = useLocation();
  const [showContactModal, setShowContactModal] = useState(false);

  const isAdmin = user?.role === 'admin';

  // 页面浏览上报
  usePageView('/');

  const { data: dashboard, isLoading } = trpc.marketInsights.dashboard.useQuery();
  const { data: companyStats } = trpc.company.stats.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  // 管理员统计数据
  const { data: siteStats } = trpc.analytics.siteStats.useQuery(undefined, {
    enabled: !!isAdmin,
    retry: false,
    refetchInterval: 60000, // 每分钟刷新
  });

  // 使用 dashboard 中的 stats（公开数据）
  const stats = dashboard?.stats;

  // 价格数据按产区分组
  const pricesByRegion = dashboard?.prices?.reduce((acc: Record<string, any[]>, p: any) => {
    if (!acc[p.region]) acc[p.region] = [];
    acc[p.region].push(p);
    return acc;
  }, {}) || {};

  // 价格柱状图数据（取白羽肉鸡/broiler 价格）
  const priceChartData = dashboard?.prices
    ?.filter((p: any) => p.product === 'broiler' || p.product === 'whole_chicken')
    ?.map((p: any) => ({
      region: p.region,
      price: parseFloat(p.price) || 0,
      changePct: parseFloat(p.changePct) || 0,
      fill: REGION_COLORS[p.region] || '#94a3b8',
    })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <img src="/ugg-logo-sm.png" alt="UGG" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-2xl font-bold">Market Insights</h1>
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="h-28" /></Card>
          ))}
        </div>
      </div>
    );
  }

  const headlines = dashboard?.headlines || [];
  const prices = dashboard?.prices || [];
  const risks = dashboard?.risks || [];
  const articles = dashboard?.articles || [];
  const week = dashboard?.week || '';

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <img src="/ugg-logo-sm.png" alt="UGG" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Global Poultry Market Insights
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              全球禽肉市场周度洞察 · {week ? `第 ${week.split('-W')[1]} 周` : '最新一期'} · 由 UGG Research Team 出品
            </p>
          </div>
        </div>
        {week && (
          <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1">
            <Clock className="h-3 w-3" />
            {week} · 每周三更新
          </Badge>
        )}
      </div>

      {/* ─── 管理员访问统计 ─── */}
      {isAdmin && siteStats && (
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-medium text-muted-foreground">管理员数据面板</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">今日浏览量</span>
                    <span className="ml-2 font-bold text-lg">{siteStats.todayViews}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({siteStats.todayUniqueVisitors} 独立访客)</span>
                  </div>
                  <div className="h-6 w-px bg-border" />
                  <div>
                    <span className="text-muted-foreground text-xs">累计浏览量</span>
                    <span className="ml-2 font-bold text-lg">{siteStats.totalViews.toLocaleString()}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({siteStats.totalUniqueVisitors} 独立访客)</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Eye className="h-2.5 w-2.5" />
                实时
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 数据亮点卡片 ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">企业数据库</span>
              <Building2 className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats?.total?.toLocaleString() || '2,315'}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              覆盖 {stats?.countries || 111} 个国家
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">本周头条</span>
              <Newspaper className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">{headlines.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {headlines.filter((h: any) => h.impactLevel === 'high').length} 条重大影响
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">风险预警</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold">{risks.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {risks.filter((r: any) => r.severity === 'critical' || r.severity === 'high').length} 条高风险
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">产区监控</span>
              <Factory className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">6</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              美/中/巴/欧/泰/土
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── 行业头条 + 风险雷达 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 行业头条 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-blue-600" />
                本周行业头条
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">{week}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {headlines.length > 0 ? headlines.map((h: any, idx: number) => {
              const impact = IMPACT_CONFIG[h.impactLevel] || IMPACT_CONFIG.medium;
              return (
                <div key={h.id || idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 shrink-0 mt-0.5">
                    <span className="text-sm font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-medium leading-snug">{h.title}</h4>
                    </div>
                    {h.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{h.summary}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={`text-[10px] px-1.5 py-0 h-5 ${impact.color}`}>{impact.label}</Badge>
                      {h.category && (
                        <span className="text-[10px] text-muted-foreground">{h.category}</span>
                      )}
                      {h.source && (
                        <span className="text-[10px] text-muted-foreground">· {h.source}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-muted-foreground">
                <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">本周头条即将更新</p>
                <p className="text-xs mt-1">每周三发布最新行业动态</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 风险雷达 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              风险雷达
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {risks.length > 0 ? risks.slice(0, 6).map((r: any, idx: number) => {
              const riskConfig = RISK_TYPE_CONFIG[r.riskType] || RISK_TYPE_CONFIG.disease;
              const sevConfig = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.medium;
              const RiskIcon = riskConfig.icon;
              return (
                <div key={r.id || idx} className={`p-3 rounded-lg ${riskConfig.bgColor} border border-transparent`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 ${riskConfig.color}`}>
                      <RiskIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h5 className="text-xs font-medium leading-snug line-clamp-1">{r.title}</h5>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0 rounded-full ${sevConfig.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sevConfig.dotColor}`} />
                          {sevConfig.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{riskConfig.label}</span>
                      </div>
                      {r.affectedRegions && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {r.affectedRegions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-6 text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无活跃风险预警</p>
                <p className="text-xs mt-1">持续监控疫病、贸易政策、汇率等风险</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── 全球价格概览 ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                全球六大产区价格概览
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">白羽肉鸡出厂价格对比 · 单位: USD/kg</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/production-regions")}>
              查看详细产区分析 <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {prices.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 价格柱状图 */}
              <div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={priceChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}/kg`, '价格']}
                      labelFormatter={(label: string) => `产区: ${label}`}
                    />
                    <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                      {priceChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* 价格表格 */}
              <div className="space-y-2">
                {Object.entries(pricesByRegion).map(([region, items]: [string, any]) => (
                  <div key={region} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 border border-muted">
                    <div className="flex items-center gap-2.5">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: REGION_COLORS[region] || '#94a3b8' }} />
                      <span className="text-sm font-medium">{region}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {items.slice(0, 2).map((item: any, idx: number) => (
                        <div key={idx} className="text-right">
                          <div className="text-xs text-muted-foreground">{item.product}</div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold">${parseFloat(item.price).toFixed(2)}</span>
                            {item.changeDirection === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                            {item.changeDirection === 'down' && <TrendingDown className="h-3 w-3 text-green-500" />}
                            {item.changeDirection === 'stable' && <Minus className="h-3 w-3 text-gray-400" />}
                            {item.changePct && (
                              <span className={`text-[10px] ${
                                item.changeDirection === 'up' ? 'text-red-500' :
                                item.changeDirection === 'down' ? 'text-green-500' : 'text-gray-400'
                              }`}>
                                {item.changeDirection === 'up' ? '+' : ''}{parseFloat(item.changePct).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">价格数据即将更新</p>
              <p className="text-xs mt-1">每周三更新六大产区最新出厂价格</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 深度分析文章 ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            深度分析
          </h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/weekly-report")}>
            查看完整周报 <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article: any) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-5 pb-4">
                  {article.tags && (
                    <div className="flex items-center gap-1.5 mb-2">
                      {article.tags.split(',').slice(0, 3).map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">{tag.trim()}</Badge>
                      ))}
                    </div>
                  )}
                  <h3 className="text-sm font-semibold leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{article.subtitle}</p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {article.author || 'UGG Research Team'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readingTime || 5} min read
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">深度分析文章即将发布</p>
              <p className="text-xs mt-1">每周发布 1-2 篇行业深度分析报告</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── 快速导航 ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate("/production-regions")}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Factory className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">主产区分析</h4>
                <p className="text-[11px] text-muted-foreground">6大产区深度数据</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">价格、饲料、疫病、政策、龙头企业全覆盖</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate("/trade")}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">贸易数据</h4>
                <p className="text-[11px] text-muted-foreground">全球禽肉进出口</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">HS 0207 · 覆盖 2020-2025 六年数据</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer group relative" onClick={() => navigate("/map")}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Map className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">企业地图</h4>
                <p className="text-[11px] text-muted-foreground">全球企业分布</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.total?.toLocaleString() || '2,315'} 家企业 · {stats?.countries || 111} 个国家
            </p>
            {isGuest && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <Lock className="h-2.5 w-2.5" /> 部分数据
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate("/weekly-reports")}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">每周分析</h4>
                <p className="text-[11px] text-muted-foreground">AI 生成周报</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">宏观格局、价格核准、物流预警、行动指南</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Contact CTA Banner (for guests) ─── */}
      {isGuest && (
        <ContactCTABanner onContact={() => setShowContactModal(true)} />
      )}

      {/* ─── Footer ─── */}
      <div className="text-center py-4 border-t">
        <p className="text-xs text-muted-foreground">
          Universal Gourmand Group · Global Poultry Intelligence Platform · Data updated weekly on Wednesdays
        </p>
      </div>
    </div>
  );
}
