import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublicProductById } from "@/lib/supabase/products";
import { CheckoutFlow } from "@/components/CheckoutFlow";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const supabase = createPublicClient();
  const product = await getPublicProductById(supabase, productId);
  if (!product || product.status !== "approved") notFound();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-(--color-text)">Checkout</h1>
      <CheckoutFlow product={product} />
    </div>
  );
}
