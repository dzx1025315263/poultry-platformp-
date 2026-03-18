import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, Target } from "lucide-react";
import { industryConfig } from "@shared/industry-config";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">市场洞察</h1>
        <p className="text-muted-foreground mt-1">{industryConfig.regionInsights.length}大区域战略分析摘要，基于AI行业专家分析</p>
      </div>
      <div className="space-y-6">
        {industryConfig.regionInsights.map(region => (
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
