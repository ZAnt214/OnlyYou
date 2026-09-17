import "server-only";
import { MercadoPagoProvider } from "@/lib/payments/MercadoPagoProvider";
import { MockPaymentProvider, type PaymentProvider } from "@/lib/payments/PaymentProvider";

/**
 * Provider usado pelas API routes de pagamento. Seleção explícita via
 * PAYMENT_PROVIDER=mock|mercadopago; sem a variável, usa Mercado Pago se
 * MERCADOPAGO_ACCESS_TOKEN estiver configurado, senão cai para o mock — a
 * ausência de credenciais nunca derruba a aplicação.
 */
export function getServerPaymentProvider(): PaymentProvider {
  const selected = process.env.PAYMENT_PROVIDER;
  if (selected === "mock") return new MockPaymentProvider();
  if (selected === "mercadopago" || process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return new MercadoPagoProvider();
  }
  return new MockPaymentProvider();
}

export function isRealPaymentProviderActive(): boolean {
  return getServerPaymentProvider() instanceof MercadoPagoProvider;
}
