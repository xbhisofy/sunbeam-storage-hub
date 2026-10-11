import { createFileRoute } from "@tanstack/react-router";
import { requireBearerUserId } from "@/lib/api-auth";
import { deleteAccountData } from "@/lib/delete-account";

// Called by the Tanyora mobile app (mobile/) when the user deletes their
// account from the Profile screen. The handler verifies the caller's bearer
// token itself because /api/public/* bypasses site auth.
export const Route = createFileRoute("/api/public/delete-account")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const uid = await requireBearerUserId(request);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          return Response.json(await deleteAccountData(supabaseAdmin, uid));
        } catch (error) {
          if (error instanceof Response) return error;
          const message = error instanceof Error ? error.message : "Account deletion failed. Please retry.";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
