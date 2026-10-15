// Server-only ZapUPI helpers. Never import from client code.

const ZAPUPI_BASE = "https://pay.zapupi.com/api";

export function zapKey(): string {
  const key = process.env["ZAPUPI_ZAP_KEY"];
  if (!key) throw new Error("ZapUPI is not configured yet");
  return key;
}

export async function zapupiPost(path: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${ZAPUPI_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`ZapUPI returned an invalid response (${res.status})`);
  }
}

/**
 * Verify an order directly with ZapUPI and credit the wallet if paid.
 * Never trusts webhook/redirect data — always re-checks order-status.
 * Returns the credit result: credited | already | mismatch | pending | not_found | failed
 */
export async function verifyAndCreditDeposit(orderId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const statusRes = await zapupiPost("/order-status", { zap_key: zapKey(), order_id: orderId });
  const rawStatus = String(statusRes?.status ?? statusRes?.payment_status ?? "").toLowerCase();
  const paidAmount = Number(statusRes?.amount ?? statusRes?.paid_amount ?? 0);
  const txnId = statusRes?.txn_id ?? statusRes?.transaction_id ?? null;
  const utr = statusRes?.utr ?? statusRes?.utr_number ?? null;

  const isPaid = ["success", "completed", "paid"].includes(rawStatus);
  const isFailed = ["failed", "cancelled", "expired", "timeout"].includes(rawStatus);

  if (isPaid) {
    const { data, error } = await supabaseAdmin.rpc("credit_zapupi_deposit", {
      _order_id: orderId,
      _paid_amount: paidAmount,
      _txn_id: txnId,
      _utr: utr,
      _response: statusRes,
    });
    if (error) throw new Error("Could not credit the deposit");
    return String(data);
  }

  if (isFailed) {
    await supabaseAdmin
      .from("zapupi_deposits")
      .update({ status: "failed", gateway_response: statusRes, updated_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .eq("status", "pending");
    return "failed";
  }

  return "pending";
}
