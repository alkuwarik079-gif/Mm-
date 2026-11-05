/**
 * Order notifications for a site with no server:
 *  - WhatsApp: the customer's WhatsApp opens with the full order, addressed to the owner
 *  - Email: the order is emailed to the owner through Web3Forms (free, no server needed)
 */

export type OrderLine = { name: string; qty: number; price: number };
export type Order = {
  id: string;
  lines: OrderLine[];
  subtotal: number;
  customer: { name: string; phone: string; email: string; address: string };
};

const qar = (n: number) => `${n.toLocaleString("en-US")} QAR`;

export function orderText(o: Order) {
  return [
    `🍵 New order ${o.id} — Ocha no Pauda`,
    "",
    ...o.lines.map((l) => `• ${l.qty} × ${l.name} — ${qar(l.price * l.qty)}`),
    "",
    `Total: ${qar(o.subtotal)} (pay on delivery)`,
    "",
    `Name: ${o.customer.name}`,
    `Phone: ${o.customer.phone}`,
    `Email: ${o.customer.email}`,
    `Address: ${o.customer.address}`,
  ].join("\n");
}

/** digits only; a local 8-digit Qatar number gets the 974 country code */
export function normalizeWhatsapp(raw: string) {
  let d = (raw || "").replace(/\D/g, "").replace(/^00/, "");
  if (d.length === 8) d = `974${d}`;
  return d;
}

/** opens Messages (iMessage on iPhone, SMS elsewhere) with the order filled in */
export const smsLink = (number: string, text: string) => `sms:+${normalizeWhatsapp(number)}?&body=${encodeURIComponent(text)}`;

export const whatsappLink = (number: string, text: string) => `https://wa.me/${normalizeWhatsapp(number)}?text=${encodeURIComponent(text)}`;

/** emails the order to the owner; resolves true on success */
export async function emailOrder(accessKey: string, o: Order, subjectPrefix = "New order"): Promise<boolean> {
  if (!accessKey) return false;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `${subjectPrefix} ${o.id} — ${qar(o.subtotal)}`,
        from_name: "Ocha no Pauda website",
        replyto: o.customer.email || undefined,
        message: orderText(o),
      }),
      signal: ctrl.signal,
    });
    const j = await res.json().catch(() => ({}));
    return res.ok && j.success !== false;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export const newOrderId = () => `ONP-${Math.floor(100000 + Math.random() * 900000)}`;

/**
 * Sends the order to the owner's own WhatsApp automatically through CallMeBot
 * (a free service that messages you from its number). The browser can't read
 * CallMeBot's reply (no CORS), so this is fire-and-forget.
 */
export async function autoWhatsapp(number: string, apiKey: string, text: string) {
  if (!number || !apiKey) return;
  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${normalizeWhatsapp(number)}` +
    `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;
  try {
    await Promise.race([fetch(url, { mode: "no-cors", keepalive: true }), new Promise((r) => setTimeout(r, 6000))]);
  } catch {}
}
