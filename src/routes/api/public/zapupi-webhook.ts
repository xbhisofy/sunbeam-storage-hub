import { createFileRoute } from "@tanstack/react-router";

// ZapUPI payment webhook. Public endpoint — never trusts the payload;
// every event is re-verified with ZapUPI's order-status API before crediting.
export const Route = createFileRoute("/api/public/zapupi-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });
        }

        const orderId = String(payload?.order_id ?? payload?.orderId ?? "");
        if (!orderId || orderId.length > 80) {
          return Response.json({ ok: false, error: "Missing order_id" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Deduplicate: one credit per order+status event.
        const eventKey = `${orderId}:${String(payload?.status ?? "unknown")}`;
        const { error: dedupeError } = await supabaseAdmin
          .from("zapupi_webhook_events")
          .insert({ event_key: eventKey, payload });
        if (dedupeError) {
          // Unique violation = already processed.
          return Response.json({ ok: true, result: "duplicate" });
        }

        try {
          const { verifyAndCreditDeposit } = await import("@/lib/zapupi.server");
          const result = await verifyAndCreditDeposit(orderId);
          return Response.json({ ok: true, result });
        } catch (e) {
          console.error("zapupi webhook error", e);
          return Response.json({ ok: false, error: "Verification failed" }, { status: 500 });
        }
      },
    },
  },
});
