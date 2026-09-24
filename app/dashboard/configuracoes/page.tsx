"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { User } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { DashboardLoading } from "@/components/DashboardLoading";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { ProfileAvatarEditor } from "@/components/ProfileAvatarEditor";
import { ProfileCoverEditor } from "@/components/ProfileCoverEditor";

export default function DashboardConfiguracoesPage() {
  const [creator, setCreator] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [offerings, setOfferings] = useState("");
  const [offeringsDescription, setOfferingsDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [baseline, setBaseline] = useState<{
    displayName: string;
    bio: string;
    offerings: string;
    offeringsDescription: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    setLoadError(null);

    (async () => {
      try {
        const current = await getCurrentCreatorClient();
        if (!active) return;

        const next = {
          displayName: current.displayName,
          bio: current.creatorProfile?.bio ?? "",
          offerings: (current.creatorProfile?.offerings ?? []).join(", "),
          offeringsDescription: current.creatorProfile?.offeringsDescription ?? "",
        };

        setCreator(current);
        setDisplayName(next.displayName);
        setBio(next.bio);
        setOfferings(next.offerings);
        setOfferingsDescription(next.offeringsDescription);
        setBaseline(next);
      } catch (err) {
        if (active) {
          setLoadError(err instanceof Error ? err.message : "Não foi possível carregar seu perfil.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!creator) return;

    setSaveError(null);
    setSaved(false);

    const offeringsList = offerings
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (displayName.trim().length < 2) {
      setSaveError("Seu nome precisa ter pelo menos 2 caracteres.");
      return;
    }
    if (offeringsList.length > 20) {
      setSaveError("Você pode adicionar no máximo 20 serviços.");
      return;
    }
    if (offeringsList.some((item) => item.length > 80)) {
      setSaveError("Cada serviço pode ter no máximo 80 caracteres.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await createClient().rpc("update_my_creator_profile", {
        p_display_name: displayName.trim(),
        p_bio: bio.trim(),
        p_offerings: offeringsList,
        p_offerings_description: offeringsDescription.trim(),
      });
      if (error) throw new Error(error.message);

      const nextBaseline = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        offerings: offeringsList.join(", "),
        offeringsDescription: offeringsDescription.trim(),
      };

      setDisplayName(nextBaseline.displayName);
      setBio(nextBaseline.bio);
      setOfferings(nextBaseline.offerings);
      setOfferingsDescription(nextBaseline.offeringsDescription);
      setBaseline(nextBaseline);
      setSaved(true);
      setCreator((current) => current ? { ...current, displayName: nextBaseline.displayName } : current);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Não foi possível salvar suas alterações.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <DashboardLoading />;

  if (loadError || !creator) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
        <div>
          <p className="font-semibold text-(--color-text)">Não foi possível abrir as configurações</p>
          <p className="mt-1 text-sm text-(--color-text-muted)">{loadError ?? "Tente novamente."}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setReloadKey((value) => value + 1);
          }}
          className="text-sm font-medium text-(--color-accent-text) hover:underline"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const offeringsCount = offerings
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;
  const isDirty = Boolean(
    baseline &&
      (
        displayName !== baseline.displayName ||
        bio !== baseline.bio ||
        offerings !== baseline.offerings ||
        offeringsDescription !== baseline.offeringsDescription
      ),
  );

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <DashboardPageHeader
        eyebrow="Conta"
        title="Configurações"
        description="Ajuste como você aparece para quem encontra seu trabalho no Jobê."
        action={
          <Link
            href={`/criadores/${creator.username}`}
            className="rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm font-medium text-(--color-text) hover:bg-(--color-surface-2)"
          >
            Ver meu perfil
          </Link>
        }
      />

      <section className="flex flex-col gap-5 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
        <div>
          <h2 className="font-semibold text-(--color-text)">Fotos do perfil</h2>
          <p className="mt-1 text-xs text-(--color-text-muted)">Troque quando quiser. PNG, JPG e WebP passam pelo fluxo seguro de imagem.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-(--color-text-muted)">Foto</span>
            <ProfileAvatarEditor
              userId={creator.id}
              displayName={creator.displayName}
              initialUrl={creator.avatar}
              editable
              sizeClassName="h-24 w-24"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-xs font-medium text-(--color-text-muted)">Imagem de destaque</span>
            <ProfileCoverEditor
              userId={creator.id}
              displayName={creator.displayName}
              initialUrl={creator.creatorProfile?.cover}
              editable
            />
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
        <div>
          <h2 className="font-semibold text-(--color-text)">Informações do perfil</h2>
          <p className="mt-1 text-xs text-(--color-text-muted)">Escreva do jeito que você fala. Não precisa parecer currículo.</p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm text-(--color-text)">
          Nome de exibição
          <input
            value={displayName}
            maxLength={80}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setSaved(false);
            }}
            className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base focus:border-(--color-accent-text) focus:outline-none sm:text-sm"
          />
          <span className="text-xs text-(--color-text-subtle)">{displayName.length}/80</span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-(--color-text)">
          Sobre você
          <textarea
            value={bio}
            maxLength={1000}
            onChange={(event) => {
              setBio(event.target.value);
              setSaved(false);
            }}
            rows={4}
            placeholder="Conte rapidinho o que você faz e como gosta de trabalhar."
            className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base leading-relaxed focus:border-(--color-accent-text) focus:outline-none sm:text-sm"
          />
          <span className="text-xs text-(--color-text-subtle)">{bio.length}/1000</span>
        </label>

        <label className="flex flex-col gap-1.5 border-t border-(--color-border) pt-5 text-sm text-(--color-text)">
          O que você faz
          <input
            value={offerings}
            onChange={(event) => {
              setOfferings(event.target.value);
              setSaved(false);
            }}
            placeholder="Edição de vídeo, Motion graphics, Produção musical"
            className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base focus:border-(--color-accent-text) focus:outline-none sm:text-sm"
          />
          <span className={`text-xs ${offeringsCount > 20 ? "text-(--color-danger)" : "text-(--color-text-subtle)"}`}>
            Separe cada serviço com vírgula. {offeringsCount}/20.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-(--color-text)">
          Uma explicação rápida
          <textarea
            value={offeringsDescription}
            maxLength={1000}
            onChange={(event) => {
              setOfferingsDescription(event.target.value);
              setSaved(false);
            }}
            rows={3}
            placeholder="Ex.: Você me manda o material e a gente vai ajustando pela conversa."
            className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base leading-relaxed focus:border-(--color-accent-text) focus:outline-none sm:text-sm"
          />
        </label>

        {saveError ? <p className="text-sm text-(--color-danger)">{saveError}</p> : null}
        {saved ? <p className="text-sm text-(--color-success)">Alterações salvas.</p> : null}

        <button
          type="submit"
          disabled={saving || !isDirty || offeringsCount > 20}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" strokeWidth={1.6} /> : null}
          Salvar alterações
        </button>
      </form>
    </div>
  );
}
