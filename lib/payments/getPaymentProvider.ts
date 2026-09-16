import { HttpMercadoPagoProvider } from "@/lib/payments/HttpMercadoPagoProvider";
import type { PaymentProvider } from "@/lib/payments/PaymentProvider";

/**
 * Instância única do provedor de pagamentos usada por todos os fluxos de
 * checkout do app (produtos e pedidos personalizados). Centralizada aqui
 * para que exista um único ponto de troca de provedor.
 */
export const paymentProvider: PaymentProvider = new HttpMercadoPagoProvider();
