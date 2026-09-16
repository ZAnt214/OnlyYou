"use client";

import { useMemo } from "react";
import { useOrderRepository } from "@/lib/repositories/OrderRepository";
import { usePaymentRepository } from "@/lib/repositories/PaymentRepository";
import { useSaleRepository } from "@/lib/repositories/SaleRepository";
import { useEntitlementRepository } from "@/lib/repositories/EntitlementRepository";
import { OrderService } from "./OrderService";
import { PaymentService } from "./PaymentService";
import { WalletService } from "./WalletService";
import { EntitlementService } from "./EntitlementService";
import { MockPaymentProvider } from "@/lib/payments/PaymentProvider";

const paymentProvider = new MockPaymentProvider();

/**
 * Reúne os serviços necessários para o fluxo de checkout
 * (Order -> Payment -> Sale -> Entitlement) já ligados aos repositórios
 * mock que persistem via MockSessionProvider/localStorage.
 */
export function useCheckoutServices() {
  const orderRepo = useOrderRepository();
  const paymentRepo = usePaymentRepository();
  const saleRepo = useSaleRepository();
  const entitlementRepo = useEntitlementRepository();

  return useMemo(
    () => ({
      orderService: new OrderService(orderRepo),
      paymentService: new PaymentService(paymentRepo, paymentProvider),
      walletService: new WalletService(saleRepo),
      entitlementService: new EntitlementService(entitlementRepo, paymentRepo),
    }),
    [orderRepo, paymentRepo, saleRepo, entitlementRepo],
  );
}
