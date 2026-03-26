import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ExternalLink, X, MapPin, Building2, ChevronLeft, Search, Globe, Navigation, Users } from "lucide-react";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";

/* ─── Country center coords fallback ─── */
const CC: Record<string, { lat: number; lng: number }> = {
  "沙特阿拉伯":{lat:23.89,lng:45.08},"阿联酋":{lat:23.42,lng:53.85},"卡塔尔":{lat:25.35,lng:51.18},
  "科威特":{lat:29.31,lng:47.48},"阿曼":{lat:21.47,lng:55.98},"巴林":{lat:26.07,lng:50.56},
  "伊拉克":{lat:33.22,lng:43.68},"约旦":{lat:30.59,lng:36.24},"黎巴嫩":{lat:33.85,lng:35.86},
  "也门":{lat:15.55,lng:48.52},"叙利亚":{lat:34.80,lng:38.99},"巴勒斯坦":{lat:31.95,lng:35.23},
  "中国":{lat:35.86,lng:104.20},"日本":{lat:36.20,lng:138.25},"韩国":{lat:35.91,lng:127.77},
  "菲律宾":{lat:12.88,lng:121.77},"越南":{lat:14.06,lng:108.28},"泰国":{lat:15.87,lng:100.99},
  "马来西亚":{lat:4.21,lng:101.98},"印度尼西亚":{lat:-0.79,lng:113.92},"新加坡":{lat:1.35,lng:103.82},
  "缅甸":{lat:21.92,lng:95.96},"柬埔寨":{lat:12.57,lng:104.99},"印度":{lat:20.59,lng:78.96},
  "巴基斯坦":{lat:30.38,lng:69.35},"孟加拉国":{lat:23.69,lng:90.36},
  "南非":{lat:-30.56,lng:22.94},"尼日利亚":{lat:9.08,lng:8.68},"加纳":{lat:7.95,lng:-1.02},
  "肯尼亚":{lat:-0.02,lng:37.91},"坦桑尼亚":{lat:-6.37,lng:34.89},"埃及":{lat:26.82,lng:30.80},
  "摩洛哥":{lat:31.79,lng:-7.09},"利比亚":{lat:26.34,lng:17.23},"安哥拉":{lat:-11.20,lng:17.87},
  "莫桑比克":{lat:-18.67,lng:35.53},"刚果(金)":{lat:-4.04,lng:21.76},"喀麦隆":{lat:7.37,lng:12.35},
  "科特迪瓦":{lat:7.54,lng:-5.55},"塞内加尔":{lat:14.50,lng:-14.45},"贝宁":{lat:9.31,lng:2.32},
  "加蓬":{lat:-0.80,lng:11.61},"马达加斯加":{lat:-18.77,lng:46.87},"毛里求斯":{lat:-20.35,lng:57.55},
  "赞比亚":{lat:-13.13,lng:27.85},"津巴布韦":{lat:-19.02,lng:29.15},"苏丹":{lat:12.86,lng:30.22},
  "索马里":{lat:5.15,lng:46.20},"利比里亚":{lat:6.43,lng:-9.43},"塞拉利昂":{lat:8.46,lng:-11.78},
  "几内亚":{lat:9.95,lng:-9.70},"多哥":{lat:8.62,lng:0.82},"埃塞俄比亚":{lat:9.15,lng:40.49},
  "英国":{lat:55.38,lng:-3.44},"荷兰":{lat:52.13,lng:5.29},"德国":{lat:51.17,lng:10.45},
  "法国":{lat:46.23,lng:2.21},"西班牙":{lat:40.46,lng:-3.75},"意大利":{lat:41.87,lng:12.57},
  "波兰":{lat:51.92,lng:19.15},"比利时":{lat:50.50,lng:4.47},"丹麦":{lat:56.26,lng:9.50},
  "瑞典":{lat:60.13,lng:18.64},"爱尔兰":{lat:53.14,lng:-7.69},"葡萄牙":{lat:39.40,lng:-8.22},
  "希腊":{lat:39.07,lng:21.82},"欧盟":{lat:50.85,lng:4.35},
  "巴西":{lat:-14.24,lng:-51.93},"墨西哥":{lat:23.63,lng:-102.55},"哥伦比亚":{lat:4.57,lng:-74.30},
  "智利":{lat:-35.68,lng:-71.54},"秘鲁":{lat:-9.19,lng:-75.02},"阿根廷":{lat:-38.42,lng:-63.62},
  "古巴":{lat:21.52,lng:-77.78},"美国":{lat:37.09,lng:-95.71},"加拿大":{lat:56.13,lng:-106.35},
  "俄罗斯":{lat:61.52,lng:105.32},"乌克兰":{lat:48.38,lng:31.17},"哈萨克斯坦":{lat:48.02,lng:66.92},
  "乌兹别克斯坦":{lat:41.38,lng:64.59},"格鲁吉亚":{lat:42.32,lng:43.36},"亚美尼亚":{lat:40.07,lng:45.04},
  "阿塞拜疆":{lat:40.14,lng:47.58},"白俄罗斯":{lat:53.71,lng:27.95},"澳大利亚":{lat:-25.27,lng:133.78},
  "新西兰":{lat:-40.90,lng:174.89},"土耳其":{lat:38.96,lng:35.24},"伊朗":{lat:32.43,lng:53.69},
  "以色列":{lat:31.05,lng:34.85},
};

type ViewLevel = "global" | "country" | "city";

export default function MapPage() {
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
  const { data: countryCompanies, isLoading: countryCompaniesLoading } = trpc.company.byCountry.useQuery(
    { country: selectedCountry! },
    { enabled: !!selectedCountry && viewLevel === "country" && !selectedCity }
  );

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];
  }, []);

  /* ─── Country-level bubbles (global view) ─── */
  const showCountryBubbles = useCallback((map: google.maps.Map, stats: any[]) => {
    clearMarkers();
    const mx = Math.max(...stats.map((s: any) => s.count), 1);
    stats.forEach((s: any) => {
      const co = CC[s.country];
      if (!co) return;
      const sz = Math.max(28, Math.min(64, 28 + (s.count / mx) * 36));
      const el = document.createElement("div");
      el.style.cssText = `width:${sz}px;height:${sz}px;border-radius:50%;background:oklch(0.55 0.18 250/0.85);border:2px solid white;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:transform 0.2s;font-family:system-ui;`;
      el.innerHTML = `<span style="color:white;font-size:${Math.max(10, sz / 4)}px;font-weight:bold">${s.count}</span>`;
      el.title = `${s.country}: ${s.count}家企业 (点击查看城市分布)`;
      el.onmouseenter = () => { el.style.transform = "scale(1.15)"; };
      el.onmouseleave = () => { el.style.transform = "scale(1)"; };
      el.onclick = () => {
        setSelectedCountry(s.country);
        setSelectedCity(null);
        setViewLevel("country");
        const center = CC[s.country];
        if (center && mapRef.current) {
          mapRef.current.setCenter(center);
          mapRef.current.setZoom(5);
        }
      };
      markersRef.current.push(new google.maps.marker.AdvancedMarkerElement({ map, position: co, content: el }));
    });
  }, [clearMarkers]);

  /* ─── City-level pins (country view) ─── */
  const showCityPins = useCallback((map: google.maps.Map, country: string) => {
    clearMarkers();
    if (!cityStats) return;
    const countryCities = cityStats.filter((c: any) => c.country === country && c.latitude && c.longitude);
    if (countryCities.length === 0) return;

    const mx = Math.max(...countryCities.map((c: any) => c.count), 1);
    countryCities.forEach((c: any) => {
      const lat = parseFloat(c.latitude);
      const lng = parseFloat(c.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const sz = Math.max(24, Math.min(52, 24 + (c.count / mx) * 28));
      const el = document.createElement("div");
      el.style.cssText = `display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.2s;font-family:system-ui;`;

      const bubble = document.createElement("div");
      bubble.style.cssText = `width:${sz}px;height:${sz}px;border-radius:50%;background:oklch(0.60 0.20 145/0.9);border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);`;
      bubble.innerHTML = `<span style="color:white;font-size:${Math.max(9, sz / 4.5)}px;font-weight:bold">${c.count}</span>`;

      const label = document.createElement("div");
      label.style.cssText = `margin-top:2px;background:rgba(0,0,0,0.75);color:white;padding:1px 6px;border-radius:4px;font-size:10px;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;`;
      label.textContent = c.city;

      el.appendChild(bubble);
      el.appendChild(label);
      el.title = `${c.city}: ${c.count}家企业`;
      el.onmouseenter = () => { el.style.transform = "scale(1.15)"; };
      el.onmouseleave = () => { el.style.transform = "scale(1)"; };
      el.onclick = () => {
        setSelectedCity(c.city);
        setViewLevel("city");
        if (mapRef.current) {
          mapRef.current.setCenter({ lat, lng });
          mapRef.current.setZoom(10);
        }
      };
      markersRef.current.push(new google.maps.marker.AdvancedMarkerElement({ map, position: { lat, lng }, content: el }));
    });
  }, [clearMarkers, cityStats]);

  /* ─── Individual company markers (city view) ─── */
  const showCompanyMarkers = useCallback((map: google.maps.Map, comps: any[]) => {
    clearMarkers();
    comps.forEach((c: any) => {
      const lat = parseFloat(c.latitude);
      const lng = parseFloat(c.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      // Add small random offset to prevent exact overlap
      const jitterLat = lat + (Math.random() - 0.5) * 0.01;
      const jitterLng = lng + (Math.random() - 0.5) * 0.01;

      const el = document.createElement("div");
      el.style.cssText = `display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.2s;font-family:system-ui;`;

      const isChina = c.hasPurchasedFromChina === "是";
      const pin = document.createElement("div");
      pin.style.cssText = `width:28px;height:28px;border-radius:50%;background:${isChina ? 'oklch(0.55 0.20 145)' : 'oklch(0.55 0.18 250)'};border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);`;
      pin.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

      const label = document.createElement("div");
      label.style.cssText = `margin-top:1px;background:rgba(0,0,0,0.8);color:white;padding:1px 5px;border-radius:3px;font-size:9px;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis;`;
      // Extract short name
      const shortName = c.companyName.replace(/\s*[\(（].*?[\)）]\s*/g, '').substring(0, 20);
      label.textContent = shortName;

      el.appendChild(pin);
      el.appendChild(label);
      el.title = c.companyName;
      el.onmouseenter = () => { el.style.transform = "scale(1.2)"; };
      el.onmouseleave = () => { el.style.transform = "scale(1)"; };

      markersRef.current.push(new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: jitterLat, lng: jitterLng }, content: el }));
    });
  }, [clearMarkers]);

  /* ─── Map ready handler ─── */
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (countryStats) showCountryBubbles(map, countryStats);
  }, [countryStats, showCountryBubbles]);

  /* ─── Sync markers with view level changes ─── */
  useEffect(() => {
    if (!mapRef.current) return;
    if (viewLevel === "global" && countryStats) {
      showCountryBubbles(mapRef.current, countryStats);
      mapRef.current.setCenter({ lat: 25, lng: 45 });
      mapRef.current.setZoom(3);
    } else if (viewLevel === "country" && selectedCountry && cityStats) {
      showCityPins(mapRef.current, selectedCountry);
    } else if (viewLevel === "city" && cityCompanies) {
      showCompanyMarkers(mapRef.current, cityCompanies);
    }
  }, [viewLevel, selectedCountry, selectedCity, countryStats, cityStats, cityCompanies, showCountryBubbles, showCityPins, showCompanyMarkers]);

  /* ─── Navigation ─── */
  const goBack = useCallback(() => {
    if (viewLevel === "city") {
      setSelectedCity(null);
      setViewLevel("country");
      if (mapRef.current && selectedCountry) {
        const center = CC[selectedCountry];
        if (center) {
          mapRef.current.setCenter(center);
          mapRef.current.setZoom(5);
        }
      }
    } else if (viewLevel === "country") {
      setSelectedCountry(null);
      setSelectedCity(null);
      setViewLevel("global");
    }
  }, [viewLevel, selectedCountry]);

  /* ─── Stats for sidebar ─── */
  const countryCitiesList = useMemo(() => {
    if (!cityStats || !selectedCountry) return [];
    return cityStats
      .filter((c: any) => c.country === selectedCountry)
      .sort((a: any, b: any) => b.count - a.count);
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
      c.companyName?.toLowerCase().includes(q) ||
      c.coreRole?.toLowerCase().includes(q) ||
      c.mainProducts?.toLowerCase().includes(q)
    );
  }, [cityCompanies, searchQuery]);

  /* ─── Summary stats ─── */
  const totalCountries = countryStats?.length || 0;
  const totalCompanies = countryStats?.reduce((s: number, c: any) => s + c.count, 0) || 0;
  const totalCities = cityStats?.length || 0;

  return (
    <div className="space-y-4">
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
        {viewLevel !== "global" && (
          <Button variant="outline" size="sm" onClick={goBack} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            {viewLevel === "city" ? "返回城市列表" : "返回全球视图"}
          </Button>
        )}
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

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <MapView className="h-[600px]" initialCenter={{ lat: 25, lng: 45 }} initialZoom={3} onMapReady={handleMapReady} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {viewLevel === "global" ? (
            /* Global view - country list */
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> 国家分布
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索国家..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-1">
                    {countryStats
                      ?.filter((s: any) => !searchQuery || s.country.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((s: any) => (
                        <div
                          key={s.country}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedCountry(s.country);
                            setSelectedCity(null);
                            setViewLevel("country");
                            setSearchQuery("");
                            const center = CC[s.country];
                            if (center && mapRef.current) {
                              mapRef.current.setCenter(center);
                              mapRef.current.setZoom(5);
                            }
                          }}
                        >
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
            /* Country view - city list */
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Navigation className="h-4 w-4" /> {selectedCountry} · 城市分布
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={goBack}><X className="h-4 w-4" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  共 {countryCitiesList.length} 个城市，
                  {countryCitiesList.reduce((s: number, c: any) => s + c.count, 0)} 家企业
                </p>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索城市..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-1">
                    {filteredCitiesList.map((c: any, i: number) => (
                      <div
                        key={`${c.city}-${i}`}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedCity(c.city);
                          setViewLevel("city");
                          setSearchQuery("");
                          const lat = parseFloat(c.latitude);
                          const lng = parseFloat(c.longitude);
                          if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
                            mapRef.current.setCenter({ lat, lng });
                            mapRef.current.setZoom(10);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                          <span className="text-sm font-medium truncate">{c.city || "未知城市"}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">{c.count}家</Badge>
                      </div>
                    ))}
                    {filteredCitiesList.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <p className="text-sm">暂无城市数据</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            /* City view - company list */
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
                  <Input
                    placeholder="搜索企业..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
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
                              <p className="font-medium text-sm truncate">{c.companyName}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {c.coreRole && <Badge variant="secondary" className="text-xs">{c.coreRole}</Badge>}
                                {c.hasPurchasedFromChina === "是" && <Badge className="text-xs bg-green-600">已在中国采购</Badge>}
                              </div>
                              {c.mainProducts && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.mainProducts}</p>}
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/${encodeURIComponent(c.companyName + " " + selectedCity + " " + selectedCountry)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="shrink-0 p-1.5 rounded-md hover:bg-primary/10 text-primary"
                              title="在 Google Maps 中精确定位"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                      {filteredCompanies.length === 0 && !companiesLoading && (
                        <div className="text-center text-muted-foreground py-8">
                          <p className="text-sm">暂无企业数据</p>
                        </div>
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
