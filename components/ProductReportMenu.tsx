"use client";

import { ReportMenu } from "@/components/ReportMenu";
import { reportService } from "@/lib/moderation/ReportService";
import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import { useRouter } from "next/navigation";
import type { ReportReason } from "@/lib/types";

export function ProductReportMenu({ productId, bare = false }: { productId: string; bare?: boolean }) {
  const session = useMockSession();
  const router = useRouter();

  return (
    <ReportMenu
      bare={bare}
      onReport={(reason: ReportReason) => {
        if (!session.currentUserId) {
          router.push("/entrar");
          return;
        }
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
