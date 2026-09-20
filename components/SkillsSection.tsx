"use client";

import { createClient } from "@/lib/supabase/client";
import { updateCreatorSkills } from "@/lib/supabase/resume";
import { TagListEditor } from "@/components/TagListEditor";

/** Habilidades declaradas pelo criador — tags livres, persistidas em profiles.skills. */
export function SkillsSection({
  initialSkills,
  isOwnProfile,
}: {
  initialSkills: string[];
  isOwnProfile: boolean;
}) {
  const supabase = createClient();

  return (
    <TagListEditor
      title="Habilidades"
      tags={initialSkills}
      isOwnProfile={isOwnProfile}
      emptyText="Nenhuma habilidade adicionada ainda."
      placeholder="Ex.: Edição de vídeo"
      onSave={(skills) => updateCreatorSkills(supabase, skills)}
    />
  );
}
