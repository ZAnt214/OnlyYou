import { DashboardLoading } from "@/components/DashboardLoading";

/**
 * /descobrir não tem generateStaticParams (depende de searchParams) e não
 * lê identidade — mas a busca dos produtos ainda passa por um round-trip
 * de servidor. Sem este arquivo, o clique no botão de busca ficava sem
 * nenhum feedback até a página inteira renderizar, lendo como travado.
 */
export default function Loading() {
  return <DashboardLoading />;
}
