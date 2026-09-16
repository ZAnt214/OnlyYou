"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@/lib/types";
import { userRepository } from "@/lib/repositories/UserRepository";

export default function DashboardConfiguracoesPage() {
  const [creator, setCreator] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await userRepository.findMockCurrentCreator();
      setCreator(c);
      setDisplayName(c.displayName);
      setBio(c.creatorProfile?.bio ?? "");
    })();
  }, []);

  if (!creator) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!creator) return;
    await userRepository.updateCreatorProfile(creator.id, { displayName, bio });
    setSaved(true);
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Configurações</h1>
        <p className="text-sm text-(--color-text-muted)">
          Essas informações aparecem no seu perfil público.{" "}
          <Link href={`/criadores/${creator.username}`} className="underline hover:text-(--color-text)">
            Ver perfil
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="displayName" className="text-sm font-medium text-(--color-text)">
            Nome de exibição
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setSaved(false);
            }}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="bio" className="text-sm font-medium text-(--color-text)">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              setSaved(false);
            }}
            rows={3}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
          >
            Salvar alterações
          </button>
          {saved ? <span className="text-sm text-(--color-text-muted)">Alterações salvas.</span> : null}
        </div>
      </form>
    </div>
  );
}
