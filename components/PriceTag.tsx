export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PriceTag({
  price,
  promoPrice,
  size = "md",
}: {
  price: number;
  promoPrice?: number;
  size?: "sm" | "md" | "lg";
}) {
  const priceClass =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";

  if (promoPrice != null && promoPrice < price) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-(--color-text-subtle) line-through">
          De: {formatBRL(price)}
        </span>
        <span
          className={`font-semibold text-(--color-highlight) ${priceClass}`}
        >
          Por: {formatBRL(promoPrice)}
        </span>
      </div>
    );
  }

  return (
    <span className={`font-semibold text-(--color-text) ${priceClass}`}>
      {formatBRL(price)}
    </span>
  );
}
