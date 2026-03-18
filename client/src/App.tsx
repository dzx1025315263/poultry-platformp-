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
          <Route path="/" component={Home} />
          <Route path="/map" component={MapPage} />
          <Route path="/regions" component={RegionsPage} />
          <Route path="/regions/:continent" component={RegionDetailPage} />
          <Route path="/search" component={SearchPage} />
          <Route path="/insights" component={InsightsPage} />
          <Route path="/report" component={ReportPage} />
          <Route path="/favorites" component={FavoritesPage} />
          <Route path="/teams" component={TeamsPage} />
          <Route path="/inquiry" component={InquiryPage} />
          <Route path="/admin" component={AdminPage} />
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
