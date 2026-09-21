"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const TYPING_MS = 55;
const DELETING_MS = 30;
const PAUSE_AFTER_TYPE_MS = 1800;
const PAUSE_AFTER_DELETE_MS = 400;

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * Efeito de máquina de escrever: digita cada frase, pausa, apaga e passa
 * pra próxima, em loop. Pra quem prefere menos movimento (prefers-reduced-motion),
 * mostra só a primeira frase, parada.
 */
export function TypewriterHeadline({
  phrases,
  srText,
  className,
}: {
  phrases: string[];
  /** Texto fixo e curto pra leitor de tela — não repete todas as frases animadas. */
  srText: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (reduceMotion) return;
    const current = phrases[index % phrases.length];

    if (!deleting && subIndex === current.length) {
      const t = setTimeout(() => setDeleting(true), PAUSE_AFTER_TYPE_MS);
      return () => clearTimeout(t);
    }
    if (deleting && subIndex === 0) {
      const t = setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      }, PAUSE_AFTER_DELETE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setSubIndex((s) => s + (deleting ? -1 : 1)),
      deleting ? DELETING_MS : TYPING_MS,
    );
    return () => clearTimeout(t);
  }, [subIndex, deleting, index, phrases, reduceMotion]);

  const text = reduceMotion
    ? phrases[0]
    : phrases[index % phrases.length].slice(0, subIndex);

  return (
    <span className={`inline-block max-w-full break-words align-bottom ${className ?? ""}`}>
      <span aria-hidden="true">
        {text}
        {!reduceMotion ? (
          <span
            className="ml-0.5 inline-block w-[3px] animate-pulse bg-(--color-accent-text) align-middle"
            style={{ height: "0.85em" }}
          />
        ) : null}
      </span>
      <span className="sr-only">{srText}</span>
    </span>
  );
}
