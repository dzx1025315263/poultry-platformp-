import { useAuth } from "@/_core/hooks/useAuth";
import { industryConfig } from "@shared/industry-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, LogOut, PanelLeft, Globe, Map, Heart, Users, Mail, Shield, Search, FileText, TrendingUp,
  GitBranch, Download, FlaskConical, Database, BarChart3, Bell, Sparkles, Zap, ListTodo, Newspaper, Factory,
  MessageCircle, LogIn
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import LoginPage from './LoginPage';

type MenuItem = { icon: any; label: string; path: string; adminOnly?: boolean; guestHidden?: boolean };
type MenuGroup = { title: string; guestHidden?: boolean; items: MenuItem[] };

const menuGroups: MenuGroup[] = [
  {
    title: "数据浏览",
    items: [
      { icon: LayoutDashboard, label: "数据概览", path: "/" },
      { icon: Map, label: "企业地图", path: "/map" },
      { icon: Globe, label: "地区导航", path: "/regions" },
      { icon: Search, label: "全局搜索", path: "/search" },
      { icon: TrendingUp, label: "市场洞察", path: "/insights" },
      { icon: FileText, label: "报告全文", path: "/report" },
      { icon: BarChart3, label: "贸易数据", path: "/trade" },
      { icon: Factory, label: "主产区分析", path: "/production-regions" },
      { icon: Newspaper, label: "每周分析", path: "/weekly-report" },
    ],
  },
  {
    title: "客户管理",
    guestHidden: true,
    items: [
      { icon: Heart, label: "收藏夹 CRM", path: "/favorites", guestHidden: true },
      { icon: GitBranch, label: "生命周期", path: "/lifecycle", guestHidden: true },
      { icon: Mail, label: "询盘邮件", path: "/inquiry", guestHidden: true },
      { icon: FlaskConical, label: "A/B 测试", path: "/abtest", guestHidden: true },
      { icon: Zap, label: "邮件自动化", path: "/email-automation", guestHidden: true },
      { icon: Sparkles, label: "AI 推荐", path: "/ai-recommend", guestHidden: true },
    ],
  },
  {
    title: "团队协作",
    guestHidden: true,
    items: [
      { icon: Users, label: "团队管理", path: "/teams", guestHidden: true },
      { icon: Download, label: "数据导出", path: "/export", guestHidden: true },
      { icon: ListTodo, label: "待办事项", path: "/todo", guestHidden: true },
    ],
  },
  {
    title: "系统管理",
    guestHidden: true,
    items: [
      { icon: Shield, label: "管理后台", path: "/admin", adminOnly: true },
      { icon: Database, label: "数据备份", path: "/backup", adminOnly: true },
      { icon: Bell, label: "飞书通知", path: "/feishu-settings", guestHidden: true },
    ],
  },
];

const allMenuItems = menuGroups.flatMap(g => g.items);

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

/* ─── Contact Us CTA Modal ─── */
function ContactCTAModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white text-center">
          <img src="/ugg-logo-sm.png" alt="Universal Gourmand Group" className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-4 object-contain p-2" />
          <h2 className="text-xl font-bold">Universal Gourmand Group</h2>
          <p className="text-blue-100 mt-2 text-sm">
            全球禽业数据协作平台 · 连接全球 2,300+ 家禽业企业
          </p>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">全球市场洞察</p>
                <p className="text-xs text-muted-foreground mt-0.5">覆盖 111 个国家的禽肉贸易数据和市场分析</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Map className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">企业精准匹配</p>
                <p className="text-xs text-muted-foreground mt-0.5">完整的企业名称、联系方式、业务详情和采购历史</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Factory className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">主产区深度分析</p>
                <p className="text-xs text-muted-foreground mt-0.5">美国、中国、巴西、欧盟、泰国、土耳其六大产区实时数据</p>
              </div>
            </div>
          </div>
          <div className="pt-2 space-y-2">
            <Button className="w-full h-11 text-base gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={onClose}>
              <MessageCircle className="h-4 w-4" />
              联系我们
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Universal Gourmand Group — Your Global Poultry Partner
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  // 暂时开放浏览：未登录用户以访客身份浏览
  // if (!user) {
  //   return <LoginPage />;
  // }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const isGuest = !user;
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [showContactCTA, setShowContactCTA] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = allMenuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <ContactCTAModal open={showContactCTA} onClose={() => setShowContactCTA(false)} />

      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          {/* ─── Sidebar Header with UGG Logo ─── */}
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                {isCollapsed ? (
                  <img src="/ugg-logo-sm.png" alt="UGG" className="h-6 w-6 object-contain" />
                ) : (
                  <PanelLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img src="/ugg-logo-sm.png" alt="UGG" className="h-7 w-7 object-contain shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold tracking-tight truncate text-sm block leading-tight">
                      {industryConfig.platformShortName}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block leading-tight">
                      Universal Gourmand Group
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          {/* ─── Sidebar Menu ─── */}
          <SidebarContent className="gap-0 overflow-y-auto">
            {menuGroups.map((group) => {
              // Filter items: hide guestHidden items for guests, hide adminOnly for non-admins
              const visibleItems = group.items.filter(item => {
                if (item.adminOnly && !isAdmin) return false;
                if (item.guestHidden && isGuest) return false;
                return true;
              });
              // Hide entire group if guestHidden and user is guest
              if (group.guestHidden && isGuest) return null;
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.title} className="mb-1">
                  {!isCollapsed && (
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.title}</span>
                    </div>
                  )}
                  <SidebarMenu className="px-2 py-0.5">
                    {visibleItems.map(item => {
                      const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className="h-9 transition-all font-normal text-sm"
                          >
                            <item.icon
                              className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                            />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </div>
              );
            })}

            {/* ─── Guest: Contact Us CTA in sidebar ─── */}
            {isGuest && !isCollapsed && (
              <div className="mx-3 mt-4 mb-2">
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="/ugg-logo-sm.png" alt="UGG" className="h-6 w-6 object-contain" />
                    <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">UGG</span>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed mb-2.5">
                    获取 2,300+ 家全球禽业企业完整数据
                  </p>
                  <button
                    onClick={() => setShowContactCTA(true)}
                    className="w-full text-xs font-medium py-1.5 px-3 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="h-3 w-3" />
                    联系我们
                  </button>
                </div>
              </div>
            )}
            {isGuest && isCollapsed && (
              <div className="flex justify-center mt-3">
                <button
                  onClick={() => setShowContactCTA(true)}
                  className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 transition-all"
                  title="联系我们"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            )}
          </SidebarContent>

          {/* ─── Sidebar Footer ─── */}
          <SidebarFooter className="p-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-9 w-9 border shrink-0">
                      <AvatarFallback className="text-xs font-medium">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                      <p className="text-sm font-medium truncate leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1.5">
                        {user.role === "admin" ? "管理员" : "成员"}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => { window.location.href = '/login'; }}
                  className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center"
                >
                  <Avatar className="h-9 w-9 border shrink-0 bg-muted">
                    <AvatarFallback className="text-xs font-medium text-muted-foreground">
                      <Globe className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      访客模式
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5 flex items-center gap-1">
                      <LogIn className="h-3 w-3" />
                      点击登录
                    </p>
                  </div>
                </button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <img src="/ugg-logo-sm.png" alt="UGG" className="h-6 w-6 object-contain" />
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
            {isGuest && (
              <button
                onClick={() => setShowContactCTA(true)}
                className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium flex items-center gap-1.5"
              >
                <MessageCircle className="h-3 w-3" />
                联系我们
              </button>
            )}
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
