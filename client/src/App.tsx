import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home"));
const MapPage = lazy(() => import("./pages/MapPage"));
const RegionsPage = lazy(() => import("./pages/RegionsPage"));
const RegionDetailPage = lazy(() => import("./pages/RegionDetailPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const TeamsPage = lazy(() => import("./pages/TeamsPage"));
const InquiryPage = lazy(() => import("./pages/InquiryPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const LifecyclePage = lazy(() => import("./pages/LifecyclePage"));
const ExportPage = lazy(() => import("./pages/ExportPage"));
const AbTestPage = lazy(() => import("./pages/AbTestPage"));
const BackupPage = lazy(() => import("./pages/BackupPage"));
const TradePage = lazy(() => import("./pages/TradePage"));
const FeishuSettingsPage = lazy(() => import("./pages/FeishuSettingsPage"));
const AiRecommendPage = lazy(() => import("./pages/AiRecommendPage"));
const EmailAutomationPage = lazy(() => import("./pages/EmailAutomationPage"));
const TodoPage = lazy(() => import("./pages/TodoPage"));
const WeeklyReportPage = lazy(() => import("./pages/WeeklyReportPage"));
const ProductionRegionsPage = lazy(() => import("./pages/ProductionRegionsPage"));
const MarketInsightsPage = lazy(() => import("./pages/MarketInsightsPage"));
const LoginPage = lazy(() => import("./components/LoginPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={MarketInsightsPage} />
          <Route path="/market-insights" component={MarketInsightsPage} />
          <Route path="/dashboard" component={Home} />
          <Route path="/map" component={MapPage} />
          <Route path="/regions" component={RegionsPage} />
          <Route path="/regions/:continent" component={RegionDetailPage} />
          <Route path="/search" component={SearchPage} />

          <Route path="/report" component={ReportPage} />
          <Route path="/favorites" component={FavoritesPage} />
          <Route path="/teams" component={TeamsPage} />
          <Route path="/inquiry" component={InquiryPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/lifecycle" component={LifecyclePage} />
          <Route path="/export" component={ExportPage} />
          <Route path="/abtest" component={AbTestPage} />
          <Route path="/backup" component={BackupPage} />
          <Route path="/trade" component={TradePage} />
          <Route path="/feishu-settings" component={FeishuSettingsPage} />
          <Route path="/ai-recommend" component={AiRecommendPage} />
          <Route path="/email-automation" component={EmailAutomationPage} />
          <Route path="/todo" component={TodoPage} />
          <Route path="/weekly-report" component={WeeklyReportPage} />
          <Route path="/production-regions" component={ProductionRegionsPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
