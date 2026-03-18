import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Building2, ExternalLink, Globe } from "lucide-react";
import { useParams, Link } from "wouter";
import { useState, useMemo } from "react";

export default function RegionDetailPage() {
  const params = useParams<{ continent: string }>();
  const continent = decodeURIComponent(params.continent || "");
  const { data: companies, isLoading } = trpc.company.byContinent.useQuery({ continent });
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const countries = useMemo(() => {
    if (!companies) return [];
    const map = new Map<string, number>();
    companies.forEach((c: any) => map.set(c.country, (map.get(c.country) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [companies]);

  const filtered = useMemo(() => {
    if (!companies) return [];
    let list = companies;
    if (selectedCountry) list = list.filter((c: any) => c.country === selectedCountry);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c: any) => c.companyName?.toLowerCase().includes(q) || c.mainProducts?.toLowerCase().includes(q) || c.coreRole?.toLowerCase().includes(q));
    }
    return list;
  }, [companies, selectedCountry, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/regions"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{continent}</h1>
          <p className="text-muted-foreground text-sm">{companies?.length || 0} 家企业，{countries.length} 个国家</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">国家/地区</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="px-3 pb-3 space-y-1">
                <Button variant={!selectedCountry ? "secondary" : "ghost"} size="sm" className="w-full justify-between"
                  onClick={() => setSelectedCountry(null)}>
                  <span>全部</span><Badge variant="outline">{companies?.length || 0}</Badge>
                </Button>
                {countries.map(([country, cnt]) => (
                  <Button key={country} variant={selectedCountry === country ? "secondary" : "ghost"}
                    size="sm" className="w-full justify-between" onClick={() => setSelectedCountry(country)}>
                    <span className="truncate">{country}</span><Badge variant="outline">{cnt}</Badge>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <div className="lg:col-span-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索企业名称、产品、角色..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="text-sm text-muted-foreground">显示 {filtered.length} 家企业</div>
          <Card>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>公司名称</TableHead>
                    <TableHead>国家</TableHead>
                    <TableHead>核心角色</TableHead>
                    <TableHead>主营产品</TableHead>
                    <TableHead>中国采购</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({length:10}).map((_,i) => <TableRow key={i}><TableCell colSpan={7}><div className="h-8 bg-muted animate-pulse rounded" /></TableCell></TableRow>)
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">没有找到企业</TableCell></TableRow>
                  ) : (
                    filtered.map((c: any, i: number) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm max-w-[200px] truncate">{c.companyName}</TableCell>
                        <TableCell className="text-sm">{c.country}</TableCell>
                        <TableCell>{c.coreRole && <Badge variant="secondary" className="text-xs">{c.coreRole}</Badge>}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.mainProducts}</TableCell>
                        <TableCell>{c.hasPurchasedFromChina === "是" && <Badge className="text-xs bg-green-600">是</Badge>}</TableCell>
                        <TableCell>
                          {c.websiteSocial && <a href={c.websiteSocial.startsWith("http") ? c.websiteSocial : `https://${c.websiteSocial}`}
                            target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" /></a>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
