import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Globe, DollarSign, Package, Search } from "lucide-react";

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

export default function TradePage() {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tradeData, isLoading } = trpc.trade.poultryImports.useQuery({ year: selectedYear });
  const { data: allTrends } = trpc.trade.trends.useQuery({});

  const filteredData = useMemo(() => {
    if (!tradeData) return [];
    if (!searchQuery) return tradeData;
    return tradeData.filter((d: any) =>
      d.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.countryCode || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tradeData, searchQuery]);

  // Summary stats
  const totalImportValue = useMemo(() => {
    if (!tradeData) return 0;
    return tradeData.reduce((sum: number, d: any) => sum + (parseFloat(d.importValueUsd) || 0), 0);
  }, [tradeData]);

  const totalQuantity = useMemo(() => {
    if (!tradeData) return 0;
    return tradeData.reduce((sum: number, d: any) => sum + (parseFloat(d.importQuantityTons) || 0), 0);
  }, [tradeData]);

  const avgUnitPrice = useMemo(() => {
    if (!tradeData || tradeData.length === 0) return 0;
    const prices = tradeData.filter((d: any) => parseFloat(d.unitPriceUsd) > 0);
    if (prices.length === 0) return 0;
    return prices.reduce((sum: number, d: any) => sum + parseFloat(d.unitPriceUsd), 0) / prices.length;
  }, [tradeData]);

  const topCountries = useMemo(() => {
    if (!tradeData) return [];
    return [...tradeData]
      .sort((a: any, b: any) => (parseFloat(b.importValueUsd) || 0) - (parseFloat(a.importValueUsd) || 0))
      .slice(0, 5);
  }, [tradeData]);

  const formatValue = (val: string | number | null) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (!num || isNaN(num)) return "-";
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatTons = (val: string | number | null) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (!num || isNaN(num)) return "-";
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M 吨`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K 吨`;
    return `${num.toFixed(0)} 吨`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">全球禽肉贸易数据</h1>
        <p className="text-muted-foreground mt-1">
          基于 UN Comtrade 数据，HS Code 0207（禽肉及可食用杂碎）进口统计
        </p>
      </div>

      {/* Year Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">统计年份：</span>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => (
                <SelectItem key={y} value={String(y)}>{y}年</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索国家..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>总进口额</span>
            </div>
            <div className="text-2xl font-bold mt-1">{formatValue(totalImportValue)}</div>
            <p className="text-xs text-muted-foreground">{selectedYear}年</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>总进口量</span>
            </div>
            <div className="text-2xl font-bold mt-1">{formatTons(totalQuantity)}</div>
            <p className="text-xs text-muted-foreground">{selectedYear}年</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>平均单价</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {avgUnitPrice > 0 ? `$${avgUnitPrice.toFixed(0)}/吨` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">{selectedYear}年</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>进口国家数</span>
            </div>
            <div className="text-2xl font-bold mt-1">{tradeData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{selectedYear}年</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Importers */}
      {topCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 5 禽肉进口国</CardTitle>
            <CardDescription>{selectedYear}年 按进口金额排名</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCountries.map((item: any, idx: number) => {
                const maxVal = parseFloat(topCountries[0]?.importValueUsd || '0') || 1;
                const pct = ((parseFloat(item.importValueUsd || '0') || 0) / maxVal) * 100;
                const yoy = parseFloat(item.yoyChange || '');
                return (
                  <div key={item.id || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                          {idx + 1}
                        </Badge>
                        <span className="font-medium">{item.country}</span>
                        {item.countryCode && (
                          <span className="text-xs text-muted-foreground">({item.countryCode})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatValue(item.importValueUsd)}</span>
                        {!isNaN(yoy) && (
                          <span className={`flex items-center text-xs ${yoy >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {yoy >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                            {yoy >= 0 ? "+" : ""}{yoy.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">详细数据</CardTitle>
          <CardDescription>
            {selectedYear}年各国禽肉进口数据 · 共 {filteredData.length} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? "未找到匹配的国家" : `暂无 ${selectedYear} 年贸易数据`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                管理员可在后台导入 UN Comtrade 数据
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排名</TableHead>
                    <TableHead>国家</TableHead>
                    <TableHead>代码</TableHead>
                    <TableHead className="text-right">进口金额 (USD)</TableHead>
                    <TableHead className="text-right">进口量 (吨)</TableHead>
                    <TableHead className="text-right">单价 (USD/吨)</TableHead>
                    <TableHead className="text-right">同比变化</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item: any, idx: number) => {
                    const yoy = parseFloat(item.yoyChange || '');
                    return (
                      <TableRow key={item.id || idx}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.country}</TableCell>
                        <TableCell className="text-muted-foreground">{item.countryCode || "-"}</TableCell>
                        <TableCell className="text-right">{formatValue(item.importValueUsd)}</TableCell>
                        <TableCell className="text-right">{formatTons(item.importQuantityTons)}</TableCell>
                        <TableCell className="text-right">
                          {parseFloat(item.unitPriceUsd || '0') > 0 ? `$${parseFloat(item.unitPriceUsd || '0').toFixed(0)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isNaN(yoy) ? (
                            <span className={`flex items-center justify-end gap-1 ${yoy >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {yoy >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {yoy >= 0 ? "+" : ""}{yoy.toFixed(1)}%
                            </span>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Data Source Note */}
      <div className="text-xs text-muted-foreground text-center py-2">
        数据来源：UN Comtrade Database · HS Code 0207（禽肉及可食用杂碎） · 数据仅供参考
      </div>
    </div>
  );
}
