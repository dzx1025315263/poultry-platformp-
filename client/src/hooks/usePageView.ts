import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

// 生成简单的匿名访客 ID（基于浏览器指纹，存储在 localStorage）
function getVisitorId(): string {
  const key = "ugg_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "v_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

/**
 * 自动上报页面浏览量
 * @param pagePath 页面路径，如 "/", "/weekly-reports"
 * @param reportId 周报 ID（仅周报详情页传入）
 */
export function usePageView(pagePath: string, reportId?: number | null) {
  const recordView = trpc.marketInsights.recordView.useMutation();
  const reported = useRef(false);

  useEffect(() => {
    // 每次 pagePath 或 reportId 变化时重置
    reported.current = false;
  }, [pagePath, reportId]);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;

    // 延迟 500ms 上报，避免快速跳转产生无效记录
    const timer = setTimeout(() => {
      try {
        recordView.mutate({
          pagePath,
          reportId: reportId ?? undefined,
          visitorId: getVisitorId(),
          userAgent: navigator.userAgent.substring(0, 500),
          referrer: document.referrer?.substring(0, 500) || undefined,
        });
      } catch {
        // 静默失败，不影响用户体验
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pagePath, reportId]);
}
