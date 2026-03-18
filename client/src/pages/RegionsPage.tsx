import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const CI: Record<string, string> = {
  "中东":"🇸🇦","非洲":"🇳🇬","东南亚":"🇻🇳","东亚":"🇯🇵","南亚":"🇮🇳",
  "欧洲":"🇪🇺","北美洲":"🇺🇸","南美洲":"🇧🇷","独联体/中亚":"🇷🇺","大洋洲":"🇦🇺","其他":"🌍",
};

export default function RegionsPage() {
  const { data: stats, isLoading } = trpc.company.stats.useQuery();
  const { data: countryStats } = trpc.company.countryStats.useQuery();
  const continentData = stats?.continentDistribution?.map((d: any) => {
    const countries = countryStats?.filter((c: any) => c.continent === d.continent) || [];
    return { ...d, countries: countries.length, icon: CI[d.continent] || "🌍" };
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">地区导航</h1>
        <p className="text-muted-foreground mt-1">7 大洲 × 104 个国家/地区，点击进入查看详细企业数据</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:6}).map((_,i) => <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {continentData.map((d: any) => (
            <Link key={d.continent} href={`/regions/${encodeURIComponent(d.continent)}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-3xl">{d.icon}</span>
                      <h3 className="text-lg font-bold mt-2">{d.continent}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{d.count} 家企业</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{d.countries} 个国家</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
