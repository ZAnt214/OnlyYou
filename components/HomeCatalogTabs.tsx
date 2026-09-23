"use client";

import { useState, type ReactNode } from "react";

const labels = ["Serviços", "Produtos digitais", "Jogue comigo"];

export function HomeCatalogTabs({ services, products, gaming, counts, unavailable }: {
  services: ReactNode;
  products: ReactNode;
  gaming: ReactNode;
  counts: number[];
  unavailable: boolean;
}) {
  const [selected, setSelected] = useState(0);
  return (
    <div className="mt-6">
      <div aria-label="Tipo de oferta" className="mb-6 flex flex-wrap gap-2">
        {labels.map((label, index) => <button key={label} type="button" aria-pressed={selected === index} aria-controls="home-catalog-results" onClick={() => setSelected(index)} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selected === index ? "border-(--color-contrast) bg-(--color-contrast) text-(--color-on-contrast)" : "border-(--color-border) text-(--color-text) hover:bg-(--color-surface-2)"}`}>{label}</button>)}
      </div>
      <div id="home-catalog-results" aria-label={labels[selected]}>
        {counts[selected] ? [services, products, gaming][selected] : <p role="status" className="rounded-xl border border-(--color-border) p-6 text-sm text-(--color-text-muted)">{unavailable ? "Não foi possível carregar esta categoria. Tente novamente em Explorar." : "As ofertas desta categoria aparecerão aqui quando forem publicadas."}</p>}
      </div>
    </div>
  );
}
