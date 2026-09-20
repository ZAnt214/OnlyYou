import { DashboardLoading } from "@/components/DashboardLoading";

/**
 * O perfil do criador é sempre dinâmico (precisa saber quem está olhando
 * para isOwnProfile) — sem este arquivo, o clique em "perfil" ficava sem
 * nenhum feedback até a página inteira renderizar, lendo como travado.
 */
export default function Loading() {
  return <DashboardLoading />;
}
