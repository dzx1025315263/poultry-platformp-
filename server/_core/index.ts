import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerWeeklyReportCron } from "../weeklyReportCron";
import { sdk } from "./sdk";
import * as db from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback + Feishu login URL endpoint
  registerOAuthRoutes(app);

  // Server-side redirect to Feishu login (fallback when VITE_FEISHU_APP_ID is not set)
  app.get("/api/auth/feishu-login-url-redirect", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const redirectUri = `${protocol}://${host}/api/oauth/callback`;
    const loginUrl = sdk.getFeishuAuthUrl(redirectUri, "/");
    res.redirect(302, loginUrl);
  });
  // V5.1: 内部数据写入 API（API Key 认证，供 Manus 沙盒直接调用）
  const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "ugg-internal-2026-manus";
  app.post("/api/internal/data", express.json({ limit: "10mb" }), async (req, res) => {
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    if (apiKey !== INTERNAL_API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { action, ...params } = req.body;
    try {
      let result: any;
      switch (action) {
        case "batchUpsertWeeklyHeadlines":
          result = await db.batchUpsertWeeklyHeadlines(params.weekLabel, params.items); break;
        case "batchUpsertRiskAlerts":
          result = await db.batchUpsertRiskAlerts(params.weekLabel, params.items); break;
        case "batchUpsertPriceSnapshots":
          result = await db.batchUpsertPriceSnapshots(params.weekLabel, params.items); break;
        case "batchUpsertRegionMarketPrices":
          result = await db.batchUpsertRegionMarketPrices(params.regionCode, params.date, params.items); break;
        case "batchUpsertRegionSubAreaPrices":
          result = await db.batchUpsertRegionSubAreaPrices(params.regionCode, params.date, params.items); break;
        case "batchUpsertRegionFeedPrices":
          result = await db.batchUpsertRegionFeedPrices(params.regionCode, params.date, params.items); break;
        case "batchUpsertRegionDiseaseAlerts":
          result = await db.batchUpsertRegionDiseaseAlerts(params.regionCode, params.date, params.items); break;
        case "batchUpsertRegionIndustryNews":
          result = await db.batchUpsertRegionIndustryNews(params.regionCode, params.date, params.items); break;
        case "upsertWeeklyReport": {
          const { weekLabel, reportDate, ...reportData } = params;
          const existing = await db.getWeeklyReportByWeek(weekLabel);
          let reportId = existing?.id;
          if (!reportId) {
            reportId = await db.createWeeklyReport({ weekLabel, reportDate: new Date(reportDate || Date.now()) });
          }
          await db.updateWeeklyReport(reportId, { ...reportData, status: 'completed' });
          result = { id: reportId, weekLabel, status: 'completed' };
          break;
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }
      res.json({ success: true, result });
    } catch (err: any) {
      console.error("[InternalAPI] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 注册每周报告自动生成服务
  registerWeeklyReportCron(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
