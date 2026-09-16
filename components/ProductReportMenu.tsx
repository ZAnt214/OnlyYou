"use client";

import { ReportMenu } from "@/components/ReportMenu";
import { reportService } from "@/lib/moderation/ReportService";
import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import type { ReportReason } from "@/lib/types";

export function ProductReportMenu({ productId }: { productId: string }) {
  const session = useMockSession();

  return (
    <ReportMenu
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
