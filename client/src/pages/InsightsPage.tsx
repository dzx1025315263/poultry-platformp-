import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, Target, Globe } from "lucide-react";

const INSIGHTS = [
  { region: "中东", icon: "🇸🇦", color: "border-l-amber-500", items: [
    { type: "warning", title: "沙特禁令影响", desc: "沙特阿拉伯对部分国家禽肉进口实施禁令，中国企业需关注清真认证和检疫标准变化" },
    { type: "opportunity", title: "阿联酋转口贸易枢纽", desc: "迪拜作为中东最大冷链物流中心，是进入中东市场的理想跳板" },
    { type: "trend", title: "清真认证必备", desc: "中东市场100%要求清真认证，建议优先获取GCC国家认可的认证机构资质" },
  ]},
  { region: "亚洲", icon: "🇻🇳", color: "border-l-blue-500", items: [
    { type: "trend", title: "东南亚需求快速增长", desc: "菲律宾、越南、泰国禽肉进口量连续3年增长，中国冻鸡爪、鸡翅在该地区有强劲需求" },
    { type: "opportunity", title: "日韩高端市场", desc: "日本、韩国对高品质禽肉需求大，但检疫标准极严，需要HACCP和ISO22000认证" },
    { type: "warning", title: "印度市场壁垒", desc: "印度国内禽肉产能充足，进口需求主要集中在特定部位和加工产品" },
  ]},
  { region: "非洲", icon: "🇳🇬", color: "border-l-green-500", items: [
    { type: "opportunity", title: "巨大增量市场", desc: "非洲人口增长和城市化驱动禽肉需求持续上升，尼日利亚、加纳、南非是重点市场" },
    { type: "trend", title: "价格敏感度高", desc: "非洲市场对价格极度敏感，中国禽肉的价格优势是核心竞争力" },
    { type: "warning", title: "支付风险", desc: "部分非洲国家外汇储备不足，建议采用信用证或前置付款方式" },
  ]},
  { region: "欧洲", icon: "🇪🇺", color: "border-l-indigo-500", items: [
    { type: "trend", title: "波兰产能扩张", desc: "波兰已成为欧盟最大禽肉生产国，对中国企业既是竞争者也是潜在合作伙伴" },
    { type: "warning", title: "EU标准壁垒", desc: "欧盟食品安全标准极为严格，中国企业直接出口欧盟难度大，可考虑与欧洲企业合作加工" },
    { type: "opportunity", title: "英国脱欧机会", desc: "英国脱欧后独立贸易政策，对中国禽肉进口可能更加开放" },
  ]},
  { region: "南美洲", icon: "🇧🇷", color: "border-l-red-500", items: [
    { type: "warning", title: "巴西竞争压力", desc: "巴西是全球最大禽肉出口国，与中国在多个市场直接竞争" },
    { type: "opportunity", title: "合作而非竞争", desc: "可与巴西企业探索供应链合作，互补产品线和市场覆盖" },
    { type: "trend", title: "智利、秘鲁新兴市场", desc: "南美其他国家禽肉进口需求增长，是值得关注的新兴市场" },
  ]},
];

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">市场洞察</h1>
        <p className="text-muted-foreground mt-1">五大区域战略分析摘要，基于AI行业专家分析</p>
      </div>
      <div className="space-y-6">
        {INSIGHTS.map(region => (
          <Card key={region.region} className={`border-l-4 ${region.color}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{region.icon}</span>{region.region}市场分析
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {region.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="shrink-0 mt-0.5">
                    {item.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    {item.type === "opportunity" && <Target className="h-4 w-4 text-green-500" />}
                    {item.type === "trend" && <TrendingUp className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.type === "warning" ? "风险" : item.type === "opportunity" ? "机会" : "趋势"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
