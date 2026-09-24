"use client";

import { useRouter } from "next/navigation";
import { ReportMenu } from "@/components/ReportMenu";
import { createClient } from "@/lib/supabase/client";
import { createReport } from "@/lib/supabase/reports";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import type { ReportReason } from "@/lib/types";

export function ProductReportMenu({
  productId,
  bare = false,
}: {
  productId: string;
  bare?: boolean;
}) {
  const { userId, loading } = useCurrentUserId();
  const router = useRouter();

  return (
    <ReportMenu
      bare={bare}
      onReport={async (reason: ReportReason) => {
        if (loading) return;
        if (!userId) {
          router.push("/entrar");
          return;
        }

        await createReport(createClient(), {
          targetType: "product",
          targetId: productId,
          reason,
          description: "Denúncia enviada pela página do produto.",
        });
      }}
    />
  );
}
