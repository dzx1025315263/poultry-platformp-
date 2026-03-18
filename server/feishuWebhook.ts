/**
 * 飞书 Webhook 机器人推送服务
 * 当收藏夹变更、跟进状态更新时自动推送飞书消息通知
 */

import { ENV } from "./_core/env";

let FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL || ENV.feishuWebhookUrl || "";

// 允许运行时动态更新 Webhook URL
export function setFeishuWebhookUrl(url: string) {
  FEISHU_WEBHOOK_URL = url;
}

export function getFeishuWebhookUrl() {
  return FEISHU_WEBHOOK_URL;
}

export interface FeishuMessage {
  title: string;
  content: string;
  type?: "favorite_add" | "favorite_remove" | "status_update" | "contact_import" | "general";
}

/**
 * 发送飞书 Webhook 消息（富文本卡片格式）
 */
export async function sendFeishuNotification(msg: FeishuMessage): Promise<boolean> {
  if (!FEISHU_WEBHOOK_URL) {
    console.warn("[FeishuWebhook] Webhook URL not configured, skipping notification");
    return false;
  }

  const typeLabels: Record<string, string> = {
    favorite_add: "📌 收藏夹新增",
    favorite_remove: "🗑️ 收藏夹移除",
    status_update: "🔄 跟进状态更新",
    contact_import: "📥 联系人导入",
    general: "📢 系统通知",
  };

  const typeColors: Record<string, string> = {
    favorite_add: "green",
    favorite_remove: "red",
    status_update: "blue",
    contact_import: "purple",
    general: "grey",
  };

  const typeLabel = typeLabels[msg.type || "general"] || "📢 系统通知";
  const color = typeColors[msg.type || "general"] || "grey";

  try {
    const response = await fetch(FEISHU_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "interactive",
        card: {
          config: { wide_screen_mode: true },
          header: {
            title: { tag: "plain_text", content: `${typeLabel} | ${msg.title}` },
            template: color,
          },
          elements: [
            {
              tag: "markdown",
              content: msg.content,
            },
            {
              tag: "note",
              elements: [
                { tag: "plain_text", content: `全球禽业数据平台 · ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}` },
              ],
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[FeishuWebhook] Failed (${response.status}): ${detail}`);
      return false;
    }

    const result = await response.json();
    if (result.code !== 0 && result.StatusCode !== 0) {
      console.warn(`[FeishuWebhook] API error: ${JSON.stringify(result)}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[FeishuWebhook] Error:", error);
    return false;
  }
}

/**
 * 收藏夹变更通知
 */
export function notifyFavoriteChange(params: {
  userName: string;
  companyName: string;
  action: "add" | "remove";
}) {
  const actionText = params.action === "add" ? "收藏了" : "取消收藏了";
  return sendFeishuNotification({
    title: `${params.userName} ${actionText}企业`,
    content: `**操作人：** ${params.userName}\n**企业：** ${params.companyName}\n**操作：** ${actionText}`,
    type: params.action === "add" ? "favorite_add" : "favorite_remove",
  });
}

/**
 * 跟进状态更新通知
 */
export function notifyStatusUpdate(params: {
  userName: string;
  companyName: string;
  oldStatus?: string;
  newStatus: string;
}) {
  const statusLabels: Record<string, string> = {
    "未联系": "未联系", "已联系": "已联系", "洽谈中": "洽谈中",
    "已报价": "已报价", "已成交": "已成交", "已失败": "已失败",
    new: "新客户", contacted: "已联系", negotiating: "洽谈中",
    quoted: "已报价", closed_won: "已成交", closed_lost: "已失败",
    prospect: "潜在客户", won: "已成交", repurchase: "复购",
  };
  const newLabel = statusLabels[params.newStatus] || params.newStatus;
  const oldLabel = params.oldStatus ? (statusLabels[params.oldStatus] || params.oldStatus) : "无";

  return sendFeishuNotification({
    title: `${params.companyName} 跟进状态变更`,
    content: `**操作人：** ${params.userName}\n**企业：** ${params.companyName}\n**状态变更：** ${oldLabel} → **${newLabel}**`,
    type: "status_update",
  });
}

/**
 * 批量联系人导入通知
 */
export function notifyContactImport(params: {
  userName: string;
  companyName: string;
  count: number;
}) {
  return sendFeishuNotification({
    title: `批量导入 ${params.count} 个联系人`,
    content: `**操作人：** ${params.userName}\n**企业：** ${params.companyName}\n**导入数量：** ${params.count} 个联系人`,
    type: "contact_import",
  });
}
