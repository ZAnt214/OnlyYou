import type { Entitlement } from "@/lib/types";
import type { EntitlementRepository } from "@/lib/repositories/EntitlementRepository";
import type { PaymentRepository } from "@/lib/repositories/PaymentRepository";

/**
 * Regra central: uma entitlement só é concedida (ou considerada válida) se o
 * Payment associado ao pedido estiver com status "paid". A criação de um
 * Order sozinha NUNCA libera acesso a conteúdo.
 */
export class EntitlementService {
  constructor(
    private entitlementRepo: EntitlementRepository,
    private paymentRepo: PaymentRepository,
  ) {}

  hasActiveAccess(userId: string, productId: string): boolean {
    const entitlement = this.entitlementRepo.findByUserAndProduct(userId, productId);
    return entitlement?.status === "active";
  }

  listLibrary(userId: string): Entitlement[] {
    return this.entitlementRepo
      .findByUser(userId)
      .filter((e) => e.status === "active");
  }

  /**
   * Concede a entitlement apenas se o pagamento do pedido estiver "paid".
   * Lança erro caso contrário — nunca libera conteúdo a partir de um Order
   * pendente.
   */
  grantFromOrder(params: {
    userId: string;
    productId: string;
    orderId: string;
    paymentId: string;
  }): Entitlement {
    const payment = this.paymentRepo.findById(params.paymentId);
    if (!payment || payment.status !== "paid") {
      throw new Error(
        "Não é possível conceder acesso: o pagamento associado ao pedido não está confirmado (paid).",
      );
    }

    const entitlement: Entitlement = {
      id: `ent-${params.orderId}-${params.productId}`,
      userId: params.userId,
      productId: params.productId,
      orderId: params.orderId,
      status: "active",
      grantedAt: new Date().toISOString(),
    };

    this.entitlementRepo.create(entitlement);
    return entitlement;
  }

  revoke(entitlementId: string): void {
    this.entitlementRepo.revoke(entitlementId);
  }
}
