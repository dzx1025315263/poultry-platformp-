import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ExternalLink, X, MapPin, Building2, ChevronLeft, Search, Globe, Navigation, Users, Lock, MessageCircle } from "lucide-react";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ─── Country center coords fallback ─── */
const CC: Record<string, [number, number]> = {
  "沙特阿拉伯":[23.89,45.08],"阿联酋":[23.42,53.85],"卡塔尔":[25.35,51.18],
  "科威特":[29.31,47.48],"阿曼":[21.47,55.98],"巴林":[26.07,50.56],
  "伊拉克":[33.22,43.68],"约旦":[30.59,36.24],"黎巴嫩":[33.85,35.86],
  "也门":[15.55,48.52],"叙利亚":[34.80,38.99],"巴勒斯坦":[31.95,35.23],
  "中国":[35.86,104.20],"日本":[36.20,138.25],"韩国":[35.91,127.77],
  "菲律宾":[12.88,121.77],"越南":[14.06,108.28],"泰国":[15.87,100.99],
  "马来西亚":[4.21,101.98],"印度尼西亚":[-0.79,113.92],"新加坡":[1.35,103.82],
  "缅甸":[21.92,95.96],"柬埔寨":[12.57,104.99],"印度":[20.59,78.96],
  "巴基斯坦":[30.38,69.35],"孟加拉国":[23.69,90.36],
  "南非":[-30.56,22.94],"尼日利亚":[9.08,8.68],"加纳":[7.95,-1.02],
  "肯尼亚":[-0.02,37.91],"坦桑尼亚":[-6.37,34.89],"埃及":[26.82,30.80],
  "摩洛哥":[31.79,-7.09],"利比亚":[26.34,17.23],"安哥拉":[-11.20,17.87],
  "莫桑比克":[-18.67,35.53],"刚果(金)":[-4.04,21.76],"刚果（金）":[-4.04,21.76],
  "喀麦隆":[7.37,12.35],"科特迪瓦":[7.54,-5.55],"塞内加尔":[14.50,-14.45],
  "贝宁":[9.31,2.32],"加蓬":[-0.80,11.61],"马达加斯加":[-18.77,46.87],
  "毛里求斯":[-20.35,57.55],"赞比亚":[-13.13,27.85],"津巴布韦":[-19.02,29.15],
  "苏丹":[12.86,30.22],"索马里":[5.15,46.20],"利比里亚":[6.43,-9.43],
  "塞拉利昂":[8.46,-11.78],"几内亚":[9.95,-9.70],"多哥":[8.62,0.82],
  "埃塞俄比亚":[9.15,40.49],"英国":[55.38,-3.44],"荷兰":[52.13,5.29],
  "德国":[51.17,10.45],"法国":[46.23,2.21],"西班牙":[40.46,-3.75],
  "意大利":[41.87,12.57],"波兰":[51.92,19.15],"比利时":[50.50,4.47],
  "丹麦":[56.26,9.50],"瑞典":[60.13,18.64],"爱尔兰":[53.14,-7.69],
  "葡萄牙":[39.40,-8.22],"希腊":[39.07,21.82],"欧盟":[50.85,4.35],
  "巴西":[-14.24,-51.93],"墨西哥":[23.63,-102.55],"哥伦比亚":[4.57,-74.30],
  "智利":[-35.68,-71.54],"秘鲁":[-9.19,-75.02],"阿根廷":[-38.42,-63.62],
  "古巴":[21.52,-77.78],"美国":[37.09,-95.71],"加拿大":[56.13,-106.35],
  "俄罗斯":[61.52,105.32],"乌克兰":[48.38,31.17],"哈萨克斯坦":[48.02,66.92],
  "乌兹别克斯坦":[41.38,64.59],"格鲁吉亚":[42.32,43.36],"亚美尼亚":[40.07,45.04],
  "阿塞拜疆":[40.14,47.58],"白俄罗斯":[53.71,27.95],"澳大利亚":[-25.27,133.78],
  "新西兰":[-40.90,174.89],"土耳其":[38.96,35.24],"伊朗":[32.43,53.69],
  "以色列":[31.05,34.85],"中国香港":[22.32,114.17],"中国台湾":[23.70,120.96],
  "突尼斯":[33.89,9.54],"多米尼加":[18.74,-70.16],"多米尼加共和国":[18.74,-70.16],
  "多米尼克":[15.41,-61.37],"巴拿马":[8.54,-80.78],"哥斯达黎加":[9.75,-83.75],
  "尼加拉瓜":[12.87,-85.21],"匈牙利":[47.16,19.50],"奥地利":[47.52,14.55],
  "罗马尼亚":[45.94,24.97],"保加利亚":[42.73,25.49],"克罗地亚":[45.10,15.20],
  "塞浦路斯":[35.13,33.43],"捷克":[49.82,15.47],"斯洛伐克":[48.67,19.70],
  "斯洛文尼亚":[46.15,14.99],"爱沙尼亚":[58.60,25.01],"拉脱维亚":[56.88,24.60],
  "立陶宛":[55.17,23.88],"瑞士":[46.82,8.23],"乌拉圭":[-32.52,-55.77],
  "玻利维亚":[-16.29,-63.59],"吉布提":[11.83,42.59],"老挝":[19.86,102.50],
  "中非共和国":[6.61,20.94],"中非":[6.61,20.94],"莱索托":[-29.61,28.23],
  "刚果民主共和国":[-4.04,21.76],"博茨瓦纳":[-22.33,24.68],
  "圣多美和普林西比":[0.19,6.61],"纳米比亚":[-22.96,18.49],
  "斯里兰卡":[7.87,80.77],"吉尔吉斯斯坦":[41.20,74.77],
};

type ViewLevel = "global" | "country" | "city";

/* ─── Blur a company name for guests ─── */
function blurName(name: string): string {
  if (!name) return "••••••••";
  // Show first 2 chars, blur the rest
  const visible = name.substring(0, 2);
  const blurred = name.substring(2).replace(/[A-Za-z\u4e00-\u9fff]/g, "•");
  return visible + blurred;
}

/* ─── Contact Us CTA Modal ─── */
function ContactCTA({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold">获取完整企业数据</h2>
          <p className="text-blue-100 mt-2 text-sm">
            我们拥有全球 2,300+ 家禽业企业的详细信息，包括企业名称、联系方式、业务详情等
          </p>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">覆盖 111 个国家和地区</p>
                <p className="text-xs text-muted-foreground mt-0.5">涵盖全球主要禽肉生产和消费市场</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">精确到城市级别的企业定位</p>
                <p className="text-xs text-muted-foreground mt-0.5">377 个城市，每家企业均有详细档案</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">企业联系人与采购历史</p>
                <p className="text-xs text-muted-foreground mt-0.5">了解哪些企业已在中国采购，精准对接</p>
              </div>
            </div>
          </div>
          <div className="pt-2 space-y-2">
            <Button className="w-full h-11 text-base gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={onClose}>
              <MessageCircle className="h-4 w-4" />
              联系我们获取完整数据
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Universal Gourmand Group — 全球禽业数据协作平台
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create circle marker icon for Leaflet ─── */
function createBubbleIcon(count: number, maxCount: number, color: string) {
  const sz = Math.max(28, Math.min(64, 28 + (count / maxCount) * 36));
  const fontSize = Math.max(10, sz / 4);
  return L.divIcon({
    className: "leaflet-marker-custom",
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
    html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${color};border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;"><span style="color:white;font-size:${fontSize}px;font-weight:bold">${count}</span></div>`,
  });
}

function createCityIcon(count: number, maxCount: number, cityName: string) {
  const sz = Math.max(24, Math.min(52, 24 + (count / maxCount) * 28));
  const fontSize = Math.max(9, sz / 4.5);
  return L.divIcon({
    className: "leaflet-marker-custom",
    iconSize: [sz, sz + 18],
    iconAnchor: [sz / 2, sz / 2 + 9],
    html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(34,139,34,0.9);border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
        <span style="color:white;font-size:${fontSize}px;font-weight:bold">${count}</span>
      </div>
      <div style="margin-top:2px;background:rgba(0,0,0,0.75);color:white;padding:1px 6px;border-radius:4px;font-size:10px;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;">${cityName}</div>
    </div>`,
  });
}

function createCompanyIcon(label: string, isChina: boolean) {
  const color = isChina ? "rgba(34,139,34,0.9)" : "rgba(59,130,246,0.9)";
  return L.divIcon({
    className: "leaflet-marker-custom",
    iconSize: [28, 46],
    iconAnchor: [14, 23],
    html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <div style="margin-top:1px;background:rgba(0,0,0,0.8);color:white;padding:1px 5px;border-radius:3px;font-size:9px;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis;">${label}</div>
    </div>`,
  });
}

/* ─── Isolated Leaflet Map Component ─── */
function LeafletMap({
  onCountryClick,
  onCityClick,
  countryStats,
  cityStats,
  cityCompanies,
  viewLevel,
  selectedCountry,
  selectedCity,
  isGuest,
}: {
  onCountryClick: (country: string) => void;
  onCityClick: (city: string, lat: number, lng: number) => void;
  countryStats: any[] | undefined;
  cityStats: any[] | undefined;
  cityCompanies: any[] | undefined;
  viewLevel: ViewLevel;
  selectedCountry: string | null;
  selectedCity: string | null;
  isGuest: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [25, 45], zoom: 3, zoomControl: true, attributionControl: true, minZoom: 2, maxZoom: 18,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markersLayerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (viewLevel === "global" && countryStats) {
      const mx = Math.max(...countryStats.map((s: any) => s.count), 1);
      countryStats.forEach((s: any) => {
        const co = CC[s.country];
        if (!co) return;
        const icon = createBubbleIcon(s.count, mx, "rgba(59,130,246,0.85)");
        const marker = L.marker(co, { icon }).addTo(layer);
        marker.bindTooltip(`${s.country}: ${s.count}家企业`, { direction: "top", offset: [0, -10] });
        marker.on("click", () => onCountryClick(s.country));
      });
      map.setView([25, 45], 3, { animate: true });
    } else if (viewLevel === "country" && selectedCountry && cityStats) {
      const countryCities = cityStats.filter((c: any) => c.country === selectedCountry && c.latitude && c.longitude);
      if (countryCities.length > 0) {
        const mx = Math.max(...countryCities.map((c: any) => c.count), 1);
        const bounds: [number, number][] = [];
        countryCities.forEach((c: any) => {
          const lat = parseFloat(c.latitude);
          const lng = parseFloat(c.longitude);
          if (isNaN(lat) || isNaN(lng)) return;
          bounds.push([lat, lng]);
          const icon = createCityIcon(c.count, mx, c.city || "未知");
          const marker = L.marker([lat, lng], { icon }).addTo(layer);
          marker.bindTooltip(`${c.city}: ${c.count}家企业`, { direction: "top", offset: [0, -10] });
          marker.on("click", () => onCityClick(c.city, lat, lng));
        });
        if (bounds.length > 0) {
          try { map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 }); } catch {}
        }
      } else {
        const center = CC[selectedCountry];
        if (center) map.setView(center, 5, { animate: true });
      }
    } else if (viewLevel === "city" && cityCompanies && cityCompanies.length > 0) {
      const bounds: [number, number][] = [];
      cityCompanies.forEach((c: any) => {
        const lat = parseFloat(c.latitude);
        const lng = parseFloat(c.longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        const jitterLat = lat + (Math.random() - 0.5) * 0.01;
        const jitterLng = lng + (Math.random() - 0.5) * 0.01;
        bounds.push([jitterLat, jitterLng]);
        const isChina = c.hasPurchasedFromChina === "是";
        // For guests, show role instead of company name on map markers
        const markerLabel = isGuest ? (c.coreRole || "企业") : c.companyName?.replace(/\s*[\(（].*?[\)）]\s*/g, "").substring(0, 16);
        const icon = createCompanyIcon(markerLabel, isChina);
        const marker = L.marker([jitterLat, jitterLng], { icon }).addTo(layer);
        // Popup: guests see role + products, logged-in see full details
        if (isGuest) {
          marker.bindPopup(`
            <div style="min-width:200px;font-family:system-ui;">
              <b style="font-size:13px;color:#999;">企业名称仅对会员可见</b><br/>
              <span style="color:#333;font-size:12px;">${c.coreRole || "禽业企业"}</span><br/>
              <span style="font-size:11px;color:#666;">${c.mainProducts || ""}</span>
            </div>
          `);
        } else {
          marker.bindPopup(`
            <div style="min-width:200px;font-family:system-ui;">
              <b style="font-size:13px;">${c.companyName}</b><br/>
              <span style="color:#666;font-size:11px;">${c.coreRole || ""}</span><br/>
              <span style="font-size:11px;color:#888;">${c.mainProducts || ""}</span>
            </div>
          `);
        }
      });
      if (bounds.length > 0) {
        try { map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }); } catch {}
      }
    }
  }, [viewLevel, selectedCountry, selectedCity, countryStats, cityStats, cityCompanies, onCountryClick, onCityClick, isGuest]);

  return <div ref={containerRef} style={{ height: "600px", width: "100%" }} />;
}

export default function MapPage() {
  const { user } = useAuth();
  const isGuest = !user;
  const [showContactCTA, setShowContactCTA] = useState(false);

  const { data: countryStats } = trpc.company.countryStats.useQuery();
  const { data: cityStats } = trpc.company.cityStats.useQuery();

  const [viewLevel, setViewLevel] = useState<ViewLevel>("global");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cityCompanies, isLoading: companiesLoading } = trpc.company.byCity.useQuery(
    { country: selectedCountry!, city: selectedCity! },
    { enabled: !!selectedCountry && !!selectedCity }
  );

  const handleCountryClick = useCallback((country: string) => {
    setSelectedCountry(country);
    setSelectedCity(null);
    setViewLevel("country");
    setSearchQuery("");
  }, []);

  const handleCityClick = useCallback((city: string, _lat: number, _lng: number) => {
    setSelectedCity(city);
    setViewLevel("city");
    setSearchQuery("");
  }, []);

  const goBack = useCallback(() => {
    if (viewLevel === "city") {
      setSelectedCity(null);
      setViewLevel("country");
      setSearchQuery("");
    } else if (viewLevel === "country") {
      setSelectedCountry(null);
      setSelectedCity(null);
      setViewLevel("global");
      setSearchQuery("");
    }
  }, [viewLevel]);

  const countryCitiesList = useMemo(() => {
    if (!cityStats || !selectedCountry) return [];
    return cityStats.filter((c: any) => c.country === selectedCountry).sort((a: any, b: any) => b.count - a.count);
  }, [cityStats, selectedCountry]);

  const filteredCitiesList = useMemo(() => {
    if (!searchQuery.trim()) return countryCitiesList;
    const q = searchQuery.toLowerCase();
    return countryCitiesList.filter((c: any) => c.city?.toLowerCase().includes(q));
  }, [countryCitiesList, searchQuery]);

  const filteredCompanies = useMemo(() => {
    if (!cityCompanies) return [];
    if (!searchQuery.trim()) return cityCompanies;
    const q = searchQuery.toLowerCase();
    return cityCompanies.filter((c: any) =>
      c.coreRole?.toLowerCase().includes(q) ||
      c.mainProducts?.toLowerCase().includes(q) ||
      (!isGuest && c.companyName?.toLowerCase().includes(q))
    );
  }, [cityCompanies, searchQuery, isGuest]);

  const filteredCountryStats = useMemo(() => {
    if (!countryStats) return [];
    if (!searchQuery.trim()) return countryStats;
    const q = searchQuery.toLowerCase();
    return countryStats.filter((s: any) => s.country.toLowerCase().includes(q));
  }, [countryStats, searchQuery]);

  const totalCountries = countryStats?.length || 0;
  const totalCompanies = countryStats?.reduce((s: number, c: any) => s + c.count, 0) || 0;
  const totalCities = cityStats?.length || 0;

  return (
    <div className="space-y-4">
      <ContactCTA open={showContactCTA} onClose={() => setShowContactCTA(false)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">企业地图</h1>
          <p className="text-muted-foreground mt-1">
            {viewLevel === "global" && "点击国家气泡查看城市分布，逐级钻取至具体企业"}
            {viewLevel === "country" && `${selectedCountry} — 点击城市查看企业列表`}
            {viewLevel === "city" && `${selectedCountry} · ${selectedCity} — 企业精确定位`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isGuest && (
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => setShowContactCTA(true)}
            >
              <MessageCircle className="h-4 w-4" />
              联系我们
            </Button>
          )}
          {viewLevel !== "global" && (
            <Button variant="outline" size="sm" onClick={goBack} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              {viewLevel === "city" ? "返回城市列表" : "返回全球视图"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">覆盖国家</p>
              <p className="text-lg font-bold">{totalCountries}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">定位城市</p>
              <p className="text-lg font-bold">{totalCities}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">企业总数</p>
              <p className="text-lg font-bold">{totalCompanies.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Guest banner */}
      {isGuest && viewLevel === "city" && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              企业名称和详细信息仅对会员可见，您可以查看企业类型和主营产品
            </span>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100" onClick={() => setShowContactCTA(true)}>
            了解更多
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <LeafletMap
              onCountryClick={handleCountryClick}
              onCityClick={handleCityClick}
              countryStats={countryStats}
              cityStats={cityStats}
              cityCompanies={cityCompanies}
              viewLevel={viewLevel}
              selectedCountry={selectedCountry}
              selectedCity={selectedCity}
              isGuest={isGuest}
            />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {viewLevel === "global" ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> 国家分布
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="搜索国家..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-1">
                    {filteredCountryStats.map((s: any) => (
                      <div key={s.country} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleCountryClick(s.country)}>
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate">{s.country}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">{s.count}家</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : viewLevel === "country" ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Navigation className="h-4 w-4" /> {selectedCountry} · 城市分布
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={goBack}><X className="h-4 w-4" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  共 {countryCitiesList.length} 个城市，{countryCitiesList.reduce((s: number, c: any) => s + c.count, 0)} 家企业
                </p>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="搜索城市..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-1">
                    {filteredCitiesList.map((c: any, i: number) => (
                      <div key={`${c.city}-${i}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          const lat = parseFloat(c.latitude);
                          const lng = parseFloat(c.longitude);
                          handleCityClick(c.city, lat, lng);
                        }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                          <span className="text-sm font-medium truncate">{c.city || "未知城市"}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">{c.count}家</Badge>
                      </div>
                    ))}
                    {filteredCitiesList.length === 0 && (
                      <div className="text-center text-muted-foreground py-8"><p className="text-sm">暂无城市数据</p></div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> {selectedCity}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {companiesLoading ? "加载中..." : `${selectedCountry} · 共 ${filteredCompanies.length} 家企业`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={goBack}><X className="h-4 w-4" /></Button>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={isGuest ? "搜索企业类型或产品..." : "搜索企业..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  {companiesLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCompanies.map((c: any) => (
                        <div key={c.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {/* Company name: blurred for guests */}
                              {isGuest ? (
                                <div className="flex items-center gap-1.5">
                                  <p className="font-medium text-sm truncate text-muted-foreground select-none" style={{ filter: "blur(4px)", WebkitUserSelect: "none" }}>
                                    {c.companyName}
                                  </p>
                                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                                </div>
                              ) : (
                                <p className="font-medium text-sm truncate">{c.companyName}</p>
                              )}
                              {/* Core role & tags: always visible */}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {c.coreRole && <Badge variant="secondary" className="text-xs">{c.coreRole}</Badge>}
                                {c.hasPurchasedFromChina === "是" && <Badge className="text-xs bg-green-600">已在中国采购</Badge>}
                              </div>
                              {/* Main products: always visible */}
                              {c.mainProducts && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.mainProducts}</p>}
                              {/* Company profile: blurred for guests */}
                              {c.companyProfile && (
                                isGuest ? (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 select-none" style={{ filter: "blur(4px)", WebkitUserSelect: "none" }}>
                                    {c.companyProfile}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.companyProfile}</p>
                                )
                              )}
                            </div>
                            {isGuest ? (
                              <button
                                onClick={() => setShowContactCTA(true)}
                                className="shrink-0 p-1.5 rounded-md hover:bg-primary/10 text-primary" title="联系我们查看详情">
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            ) : (
                              <a href={`https://www.google.com/maps/search/${encodeURIComponent(c.companyName + " " + selectedCity + " " + selectedCountry)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="shrink-0 p-1.5 rounded-md hover:bg-primary/10 text-primary" title="在 Google Maps 中精确定位">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* Guest CTA at bottom of list */}
                      {isGuest && filteredCompanies.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 text-center">
                          <Lock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            查看全部 {filteredCompanies.length} 家企业的完整信息
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            包括企业名称、联系方式、业务详情等
                          </p>
                          <Button
                            size="sm"
                            className="mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            onClick={() => setShowContactCTA(true)}
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                            联系我们
                          </Button>
                        </div>
                      )}
                      {filteredCompanies.length === 0 && !companiesLoading && (
                        <div className="text-center text-muted-foreground py-8"><p className="text-sm">暂无企业数据</p></div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
