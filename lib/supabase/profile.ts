import type { CreatorProfile, Role, User, VerificationStatus } from "@/lib/types";

/**
 * Formato de uma linha de `public.profiles` (colunas em snake_case, como o
 * Postgres/Supabase devolve). Mantido em sincronia manual com o schema
 * aplicado no projeto Supabase — ver descrição da tabela na tarefa que
 * introduziu este arquivo. Não inventar colunas aqui: se o app precisar de
 * um campo que não existe nesta tabela, isso é uma lacuna de schema, não
 * um bug de mapeamento.
 */
export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  roles: Role[] | null;
  verification_status: VerificationStatus | null;
  offerings: string[] | null;
  offerings_description: string | null;
  skills: string[] | null;
  languages: string[] | null;
  followers: number | null;
  rating: number | null;
  rating_count: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Converte uma linha real de `profiles` (snake_case) para o tipo `User` já
 * usado no resto do app (camelCase, mock ou real). Função pura — sem
 * `next/headers` nem qualquer coisa específica de servidor — para poder ser
 * importada tanto de Server Components/rotas quanto de Client Components
 * (ex.: MockSessionProvider, Header, telas de dashboard client-side).
 *
 * `creatorProfile` só é preenchido quando `roles` inclui `"creator"` —
 * mesma regra usada pelos dados mock (compradores não têm `creatorProfile`).
 */
export function mapProfileRowToUser(row: ProfileRow): User {
  const roles = row.roles ?? ["buyer"];
  const isCreator = roles.includes("creator");

  const creatorProfile: CreatorProfile | undefined = isCreator
    ? {
        bio: row.bio ?? "",
        followers: row.followers ?? 0,
        verificationStatus: row.verification_status ?? "unverified",
        rating: row.rating ?? 0,
        ratingCount: row.rating_count ?? 0,
        // Não há tabela de produtos real nesta fase — produtos continuam
        // mock, então uma contagem real de produtos publicados não existe
        // ainda para um criador real. 0 é o valor honesto aqui (nenhum
        // produto real publicado), não um placeholder de "em breve".
        productCount: 0,
        offerings: row.offerings ?? [],
        offeringsDescription: row.offerings_description ?? "",
        skills: row.skills ?? [],
        languages: row.languages ?? [],
      }
    : undefined;

  return {
    id: row.id,
    username: row.username ?? row.id,
    displayName: row.display_name ?? row.username ?? row.id,
    avatar: row.avatar_url ?? "",
    roles,
    createdAt: row.created_at,
    creatorProfile,
  };
}
