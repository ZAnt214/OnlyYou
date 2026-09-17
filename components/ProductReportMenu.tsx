"use client";

import { ReportMenu } from "@/components/ReportMenu";
import { reportService } from "@/lib/moderation/ReportService";
import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import type { ReportReason } from "@/lib/types";

export function ProductReportMenu({ productId, bare = false }: { productId: string; bare?: boolean }) {
  const session = useMockSession();

  return (
    <ReportMenu
      bare={bare}
      onReport={(reason: ReportReason) => {
        reportService.fileReport({
          reporterId: session.currentUserId,
          targetType: "product",
          targetId: productId,
          reason,
          description: "Denúncia enviada pela página do produto.",
        });
      }}
    />
  );
}
