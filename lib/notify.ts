import { site } from "@/config/site";

export type NewOrderAlert = {
  orderNumber: string;
  name: string;
  phone: string;
  location: string;
  total: number;
  items: string[];
};

/**
 * Tells the owner about a new order right away, through a Telegram bot.
 * Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to turn it on; without them this does nothing.
 * It never throws: a failed alert must not affect the customer's order.
 */
export async function notifyNewOrder(order: NewOrderAlert) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;

  const lines = [
    `🛒 Nouvelle commande ${order.orderNumber}`,
    `${order.name} · ${order.phone}`,
    order.location,
    ...order.items.map((item) => `• ${item}`),
    `Total à encaisser : ${order.total} ${site.currency}`,
    `${site.url}/dashboard/orders?q=${encodeURIComponent(order.orderNumber)}`,
  ];

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: lines.join("\n"), disable_web_page_preview: true }),
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    // Ignored on purpose; see above.
  }
}
