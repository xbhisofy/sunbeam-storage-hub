import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { site } from "@/lib/site";

const MIN_INR = 50;
const MAX_INR = 100000;

export const createZapupiOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ amount: z.number().min(MIN_INR).max(MAX_INR) }).parse(data))
  .handler(async ({ data, context }) => {
    const { zapKey, zapupiPost } = await import("./zapupi.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const orderId = `ZAP_${crypto.randomUUID().replace(/-/g, "")}`;
    const amount = data.amount.toFixed(2);

    const { error: insertError } = await supabaseAdmin.from("zapupi_deposits").insert({
      user_id: context.userId,
      order_id: orderId,
      amount_inr: data.amount,
      status: "pending",
    });
    if (insertError) throw new Error("Could not create the order. Please try again.");

    const base = site.webUrl.replace(/\/$/, "");
    const res = await zapupiPost("/create-order", {
      zap_key: zapKey(),
      order_id: orderId,
      amount,
      webhook_url: `${base}/api/public/zapupi-webhook`,
      success_url: `${base}/wallet?status=success&order_id=${orderId}`,
      failed_url: `${base}/wallet?status=failed&order_id=${orderId}`,
      timeout_url: `${base}/wallet?status=timeout&order_id=${orderId}`,
      remark: "Wallet top-up",
    });

    const paymentUrl = res?.payment_url ?? res?.data?.payment_url ?? res?.url;
    if (!paymentUrl || typeof paymentUrl !== "string") {
      await supabaseAdmin
        .from("zapupi_deposits")
        .update({ status: "failed", gateway_response: res, updated_at: new Date().toISOString() })
        .eq("order_id", orderId);
      throw new Error("ZapUPI did not return a payment link. Please try again.");
    }

    await supabaseAdmin
      .from("zapupi_deposits")
      .update({ payment_url: paymentUrl, gateway_response: res, updated_at: new Date().toISOString() })
      .eq("order_id", orderId);

    return { order_id: orderId, payment_url: paymentUrl };
  });

export const syncZapupiDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ order_id: z.string().min(5).max(80) }).parse(data))
  .handler(async ({ data, context }) => {
    const { verifyAndCreditDeposit } = await import("./zapupi.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only the owner of the deposit may sync it.
    const { data: dep } = await supabaseAdmin
      .from("zapupi_deposits")
      .select("user_id, status")
      .eq("order_id", data.order_id)
      .maybeSingle();
    if (!dep || dep.user_id !== context.userId) throw new Error("Deposit not found");
    if (dep.status === "success") return { result: "already" };

    const result = await verifyAndCreditDeposit(data.order_id);
    return { result };
  });
