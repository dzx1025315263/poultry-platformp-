import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { getLoginUrl } from "@/const";
import { Download, FileSpreadsheet, Heart, Filter, CheckCircle, FileText, Table2 } from "lucide-react";

function escapeCsvField(value: string | null | undefined): string {
  if (!value) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function downloadCsv(rows: string[][], filename: string) {
  const csvContent = "\uFEFF" + rows.map(row => row.map(escapeCsvField).join(",")).join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click();
  document.body.removeChild(link); URL.revokeObjectURL(url);
}

function downloadXlsx(rows: string[][], filename: string) {
  // Generate a simple XML-based spreadsheet (Excel compatible)
  const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles><Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#E2EFDA" ss:Pattern="Solid"/></Style></Styles>\n';
  xml += '<Worksheet ss:Name="数据"><Table>\n';
  rows.forEach((row, ri) => {
    xml += '<Row>';
    row.forEach(cell => {
      const style = ri === 0 ? ' ss:StyleID="header"' : '';
      xml += `<Cell${style}><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
    });
    xml += '</Row>\n';
  });
  xml += '</Table></Worksheet></Workbook>';
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click();
  document.body.removeChild(link); URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const { isAuthenticated } = useAuth();
  const [exportType, setExportType] = useState<"companies" | "favorites">("companies");
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("xlsx");
  const [continent, setContinent] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [chinaOnly, setChinaOnly] = useState(false);
  const [favStatus, setFavStatus] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ count: number; time: string; format: string } | null>(null);

  const { data: stats } = trpc.company.stats.useQuery();
  const { data: countryStats } = trpc.company.countryStats.useQuery();

  const continents = useMemo(() =>
    countryStats ? Array.from(new Set(countryStats.map((c: any) => c.continent))).sort() : [],
    [countryStats]
  );
  const countries = useMemo(() =>
    countryStats
      ? countryStats.filter((c: any) => !continent || continent === "all" || c.continent === continent).map((c: any) => c.country).sort()
      : [],
    [countryStats, continent]
  );

  const exportCompaniesQuery = trpc.export.companies.useQuery(
    {
      continent: continent && continent !== "all" ? continent : undefined,
      country: country && country !== "all" ? country : undefined,
      role: role && role !== "all" ? role : undefined,
      chinaOnly: chinaOnly || undefined,
    },
    { enabled: false }
  );

  const exportFavoritesQuery = trpc.export.favorites.useQuery(
    { status: favStatus && favStatus !== "all" ? favStatus : undefined },
    { enabled: false }
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Download className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先登录</h2>
        <p className="text-muted-foreground">登录后可使用数据导出功能</p>
        <Button onClick={() => window.location.href = getLoginUrl()}>登录</Button>
      </div>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const downloadFn = exportFormat === "xlsx" ? downloadXlsx : downloadCsv;
      const ext = exportFormat === "xlsx" ? ".xls" : ".csv";

      if (exportType === "companies") {
        const result = await exportCompaniesQuery.refetch();
        const data = result.data as any[];
        if (!data?.length) { toast.error("没有符合条件的数据"); setIsExporting(false); return; }

        const headers = ["序号", "公司名称", "国家/地区", "大洲", "核心角色", "采购倾向", "公司简介", "主营产品", "网站/社媒", "联系方式", "是否在中国采购"];
        const rows: string[][] = [headers];
        data.forEach((c: any, i: number) => {
          rows.push([String(i + 1), c.companyName || "", c.country || "", c.continent || "", c.coreRole || "", c.purchasePreference || "", c.companyProfile || "", c.mainProducts || "", c.websiteSocial || "", c.contactInfo || "", c.hasPurchasedFromChina || ""]);
        });

        const filterParts: string[] = [];
        if (continent && continent !== "all") filterParts.push(continent);
        if (country && country !== "all") filterParts.push(country);
        if (role && role !== "all") filterParts.push(role);
        const filterStr = filterParts.length > 0 ? "_" + filterParts.join("_") : "";
        downloadFn(rows, "企业数据" + filterStr + "_" + dateStr + ext);
        setLastExport({ count: data.length, time: new Date().toLocaleTimeString("zh-CN"), format: exportFormat.toUpperCase() });
        toast.success("成功导出 " + data.length + " 家企业数据");
      } else {
        const result = await exportFavoritesQuery.refetch();
        const data = result.data as any[];
        if (!data?.length) { toast.error("收藏夹中没有符合条件的数据"); setIsExporting(false); return; }

        const headers = ["序号", "公司名称", "国家/地区", "大洲", "核心角色", "跟进状态", "备注", "联系方式", "主营产品", "是否在中国采购"];
        const rows: string[][] = [headers];
        data.forEach((item: any, i: number) => {
          const c = item.companies || item;
          const f = item.favorites || item;
          rows.push([String(i + 1), c.companyName || "", c.country || "", c.continent || "", c.coreRole || "", f.followUpStatus || "new", f.notes || "", c.contactInfo || "", c.mainProducts || "", c.hasPurchasedFromChina || ""]);
        });

        const statusStr = favStatus && favStatus !== "all" ? "_" + favStatus : "";
        downloadFn(rows, "收藏夹导出" + statusStr + "_" + dateStr + ext);
        setLastExport({ count: data.length, time: new Date().toLocaleTimeString("zh-CN"), format: exportFormat.toUpperCase() });
        toast.success("成功导出 " + data.length + " 条收藏记录");
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const statusLabels: Record<string, string> = {
    new: "新发现", contacted: "已联系", negotiating: "洽谈中",
    quoted: "已报价", won: "已成交", lost: "已流失",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">数据导出中心</h1>
        <p className="text-muted-foreground">按条件筛选并导出企业数据或收藏夹，支持 Excel 和 CSV 两种格式</p>
      </div>

      {lastExport && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">
                上次导出：<span className="font-medium">{lastExport.count} 条数据</span>（{lastExport.format}格式），时间 {lastExport.time}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={"cursor-pointer transition-all hover:shadow-md " + (exportType === "companies" ? "ring-2 ring-primary shadow-md" : "")}
          onClick={() => setExportType("companies")}>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className={"p-3 rounded-full " + (exportType === "companies" ? "bg-primary/10 text-primary" : "bg-blue-100 text-blue-600")}>
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">导出企业数据</h3>
              <p className="text-sm text-muted-foreground">按大洲、国家、角色等条件筛选导出</p>
              <Badge variant="secondary" className="mt-1 text-xs">共 {stats?.total || 0} 家企业</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className={"cursor-pointer transition-all hover:shadow-md " + (exportType === "favorites" ? "ring-2 ring-primary shadow-md" : "")}
          onClick={() => setExportType("favorites")}>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className={"p-3 rounded-full " + (exportType === "favorites" ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600")}>
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">导出收藏夹</h3>
              <p className="text-sm text-muted-foreground">按跟进状态筛选导出收藏的企业</p>
              <Badge variant="secondary" className="mt-1 text-xs">含跟进状态和备注</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" />导出格式</CardTitle>
          <CardDescription>选择文件格式，Excel格式支持样式和中文，CSV格式兼容性更广</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Card className={"cursor-pointer transition-all " + (exportFormat === "xlsx" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50")}
              onClick={() => setExportFormat("xlsx")}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Table2 className={"h-8 w-8 " + (exportFormat === "xlsx" ? "text-primary" : "text-green-600")} />
                <div>
                  <p className="font-medium text-sm">Excel (.xls)</p>
                  <p className="text-xs text-muted-foreground">带表头样式，推荐使用</p>
                </div>
              </CardContent>
            </Card>
            <Card className={"cursor-pointer transition-all " + (exportFormat === "csv" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50")}
              onClick={() => setExportFormat("csv")}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <FileText className={"h-8 w-8 " + (exportFormat === "csv" ? "text-primary" : "text-blue-600")} />
                <div>
                  <p className="font-medium text-sm">CSV (.csv)</p>
                  <p className="text-xs text-muted-foreground">纯文本，兼容性广</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Filter className="h-5 w-5" />筛选条件</CardTitle>
          <CardDescription>{exportType === "companies" ? "设置企业数据的导出范围，留空则导出全部" : "设置收藏夹的导出范围"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportType === "companies" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>大洲</Label>
                <Select value={continent} onValueChange={setContinent}>
                  <SelectTrigger><SelectValue placeholder="全部大洲" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部大洲</SelectItem>
                    {continents.map((c: any) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>国家</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue placeholder="全部国家" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部国家</SelectItem>
                    {countries.map((c: any) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>核心角色</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue placeholder="全部角色" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部角色</SelectItem>
                    {["全产业链巨头", "进口商/分销商", "贸易商/经纪人", "加工商/制造商", "冷链物流", "养殖/饲料", "零售商/超市", "行业协会/政府"].map(r =>
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 col-span-full">
                <Switch checked={chinaOnly} onCheckedChange={setChinaOnly} />
                <Label>仅导出已在中国采购过的企业</Label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>跟进状态</Label>
                <Select value={favStatus} onValueChange={setFavStatus}>
                  <SelectTrigger><SelectValue placeholder="全部状态" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    {Object.entries(statusLabels).map(([k, v]) =>
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium">导出预览</p>
            <p className="text-sm text-muted-foreground">
              {exportType === "companies"
                ? "数据库共 " + (stats?.total || 0) + " 家企业，覆盖 " + (stats?.countries || 0) + " 个国家"
                : "将导出您收藏夹中的企业数据（含跟进状态和备注）"
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              导出格式：{exportFormat === "xlsx" ? "Excel (.xls)，带表头样式" : "CSV（UTF-8 BOM编码）"}
            </p>
          </div>
          <Button onClick={handleExport} disabled={isExporting} size="lg" className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            {isExporting ? "导出中..." : `导出${exportFormat === "xlsx" ? "Excel" : "CSV"}文件`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
