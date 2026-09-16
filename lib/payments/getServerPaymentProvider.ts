import "server-only";
import { MercadoPagoProvider } from "@/lib/payments/MercadoPagoProvider";
import { MockPaymentProvider, type PaymentProvider } from "@/lib/payments/PaymentProvider";

/**
 * Provider usado pelas API routes (app/api/mercadopago/*). Usa o Mercado
 * Pago de verdade quando MERCADOPAGO_ACCESS_TOKEN está configurado; cai de
 * volta para MockPaymentProvider em dev local sem a chave configurada, para
 * não travar o fluxo de quem está só rodando `npm run dev` sem credenciais.
 */
export function getServerPaymentProvider(): PaymentProvider {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return new MockPaymentProvider();
  }
  return new MercadoPagoProvider();
}
