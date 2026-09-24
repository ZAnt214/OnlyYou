"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { mapProfileRowToUser, type ProfileRow } from "@/lib/supabase/profile";
import { ProfileAvatarEditor } from "@/components/ProfileAvatarEditor";

export default function DashboardConfiguracoesPage() {
  const [creator, setCreator] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [offerings, setOfferings] = useState("");
  const [offeringsDescription, setOfferingsDescription] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Lê o perfil autenticado e grava somente pela RPC controlada. O cliente não
  // possui UPDATE direto em profiles, então campos internos como roles,
  // verificação e avaliações não podem ser alterados pela API pública.
  const [realUserId, setRealUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;

      if (authUser) {
        const { data: row } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (row) {
          const c = mapProfileRowToUser(row as ProfileRow);
          setRealUserId(authUser.id);
          setCreator(c);
          setDisplayName(c.displayName);
          setBio(c.creatorProfile?.bio ?? "");
          setOfferings((c.creatorProfile?.offerings ?? []).join(", "));
          setOfferingsDescription(c.creatorProfile?.offeringsDescription ?? "");
          return;
        }
      }

    })();
  }, []);

  if (!creator) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!creator) return;
    setSaveError(null);
    const offeringsList = offerings
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!realUserId) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("update_my_creator_profile", {
      p_display_name: displayName,
      p_bio: bio,
      p_offerings: offeringsList,
      p_offerings_description: offeringsDescription,
    });
    if (error) {
      setSaveError(error.message);
      return;
    }
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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-(--color-text)">Foto de perfil</span>
        <ProfileAvatarEditor
          userId={creator.id}
          displayName={creator.displayName}
          initialUrl={creator.avatar}
          editable
          sizeClassName="h-24 w-24"
        />
        <p className="text-xs text-(--color-text-subtle)">
          Use uma imagem quadrada. PNG, JPG ou WebP.
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
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
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
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1 border-t border-(--color-border) pt-4">
          <label htmlFor="offerings" className="text-sm font-medium text-(--color-text)">
            O que ofereço (tags, separadas por vírgula)
          </label>
          <input
            id="offerings"
            value={offerings}
            onChange={(e) => {
              setOfferings(e.target.value);
              setSaved(false);
            }}
            placeholder="Ensaio fotográfico personalizado, Vídeo personalizado"
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
          />
          <p className="text-xs text-(--color-text-subtle)">
            Aparece no seu perfil, separado das tags automáticas de produtos publicados.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="offeringsDescription" className="text-sm font-medium text-(--color-text)">
            Descrição do que ofereço
          </label>
          <textarea
            id="offeringsDescription"
            value={offeringsDescription}
            onChange={(e) => {
              setOfferingsDescription(e.target.value);
              setSaved(false);
            }}
            rows={2}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover)"
          >
            Salvar alterações
          </button>
          {saved ? <span className="text-sm text-(--color-text-muted)">Alterações salvas.</span> : null}
          {saveError ? <span className="text-sm text-(--color-danger)">{saveError}</span> : null}
        </div>
      </form>
    </div>
  );
}
