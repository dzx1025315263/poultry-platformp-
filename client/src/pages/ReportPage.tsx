import { trpc } from "@/lib/trpc";
import { industryConfig } from "@shared/industry-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from "lucide-react";
import { useState } from "react";

export default function ReportPage() {
  const { data: stats } = trpc.company.stats.useQuery();
  const [sel, setSel] = useState("all");
  const { data: companies, isLoading } = trpc.company.search.useQuery({ continent: sel === "all" ? undefined : sel, page: 1, pageSize: 5000 });
  const continents = stats?.continentDistribution || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">报告全文</h1>
          <p className="text-muted-foreground mt-1">{industryConfig.reportPageSubtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />打印/导出PDF</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-primary">{stats?.total?.toLocaleString() || "—"}</div><div className="text-sm text-muted-foreground mt-1">企业总数</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-blue-600">{stats?.countries || "—"}</div><div className="text-sm text-muted-foreground mt-1">覆盖国家</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-green-600">{stats?.continents || "—"}</div><div className="text-sm text-muted-foreground mt-1">覆盖大洲</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-amber-600">{stats?.chinaImporters || "—"}</div><div className="text-sm text-muted-foreground mt-1">已在中国采购</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">企业名录</CardTitle>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部大洲</SelectItem>
              {continents.map((c: any) => <SelectItem key={c.continent} value={c.continent}>{c.continent} ({c.count})</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-3">共 {companies?.total || 0} 家企业</div>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-[40px]">#</TableHead><TableHead>公司名称</TableHead><TableHead>国家</TableHead><TableHead>大洲</TableHead><TableHead>核心角色</TableHead><TableHead>主营产品</TableHead><TableHead>中国采购</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {isLoading ? Array.from({length:20}).map((_,i) => <TableRow key={i}><TableCell colSpan={7}><div className="h-6 bg-muted animate-pulse rounded" /></TableCell></TableRow>) :
                  companies?.data.map((c: any, i: number) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs text-muted-foreground">{i+1}</TableCell>
                      <TableCell className="font-medium text-sm max-w-[180px] truncate">{c.companyName}</TableCell>
                      <TableCell className="text-sm">{c.country}</TableCell>
                      <TableCell className="text-sm">{c.continent}</TableCell>
                      <TableCell>{c.coreRole && <Badge variant="secondary" className="text-xs">{c.coreRole}</Badge>}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{c.mainProducts}</TableCell>
                      <TableCell>{c.hasPurchasedFromChina === "是" && <Badge className="text-xs bg-green-600">是</Badge>}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
