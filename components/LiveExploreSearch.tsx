"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

const SEARCH_DELAY_MS = 350;

export function LiveExploreSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSent = useRef(initialQuery.trim());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateResults(rawValue: string) {
    const query = rawValue.trim();
    if (query === lastSent.current) return;
    lastSent.current = query;

    const params = new URLSearchParams(window.location.search);
    if (query) params.set("q", query);
    else params.delete("q");
    const nextUrl = params.size ? `/descobrir?${params.toString()}` : "/descobrir";

    startTransition(() => router.replace(nextUrl, { scroll: false }));
  }

  useEffect(() => {
    function syncFromHistory() {
      const query = new URLSearchParams(window.location.search).get("q") ?? "";
      lastSent.current = query;
      setValue(query);
    }

    window.addEventListener("popstate", syncFromHistory);
    return () => {
      window.removeEventListener("popstate", syncFromHistory);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    if (initialQuery === lastSent.current) return;
    lastSent.current = initialQuery;
    setValue(initialQuery);
  }, [initialQuery]);

  function scheduleSearch(nextValue: string) {
    setValue(nextValue);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => updateResults(nextValue), SEARCH_DELAY_MS);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    updateResults(value);
  }

  function clearSearch() {
    if (timer.current) clearTimeout(timer.current);
    setValue("");
    updateResults("");
  }

  return (
    <div className="mt-6">
      <form
        onSubmit={submit}
        role="search"
        className="flex items-center gap-2 rounded-(--radius-pill) border border-(--color-border) bg-(--color-surface) px-4 py-3 shadow-sm focus-within:border-(--color-accent-text)"
      >
        <Search size={18} strokeWidth={1.7} className="shrink-0 text-(--color-text-subtle)" />
        <input
          ref={inputRef}
          name="q"
          value={value}
          onChange={(event) => scheduleSearch(event.target.value)}
          placeholder="O que você está procurando?"
          aria-label="Buscar no Jobê"
          autoComplete="off"
          className="min-w-0 w-full bg-transparent text-sm text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none"
        />
        {value ? (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Limpar pesquisa"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-(--color-text-subtle) transition-colors hover:bg-(--color-surface-2) hover:text-(--color-text)"
          >
            <X size={16} />
          </button>
        ) : null}
        <span className="sr-only" aria-live="polite">
          {isPending ? "Atualizando resultados" : "Resultados atualizados"}
        </span>
      </form>

      {isPending ? <SearchSkeleton /> : null}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="mt-5 animate-pulse space-y-3" aria-hidden="true">
      <div className="h-3 w-32 rounded-full bg-(--color-surface-2)" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-xl bg-(--color-surface-2)" />
        <div className="h-24 rounded-xl bg-(--color-surface-2)" />
      </div>
    </div>
  );
}
