import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomRequest, ServiceRequest, ServiceRequestStatus } from "@/lib/types";

interface ServiceRequestRow {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: string;
  budget_cents: number | null;
  desired_delivery_days: number | null;
  status: ServiceRequestStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
  requester?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface CustomRequestFromOpportunityRow {
  id: string;
  requester_id: string;
  creator_id: string;
  description: string;
  status: CustomRequest["status"];
  source_gig_id: string | null;
  source_service_request_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  cancelled_at: string | null;
}

function mapServiceRequest(row: ServiceRequestRow): ServiceRequest {
  return {
    id: row.id,
    requesterId: row.requester_id,
    title: row.title,
    description: row.description,
    category: row.category,
    budgetCents: row.budget_cents ?? undefined,
    desiredDeliveryDays: row.desired_delivery_days ?? undefined,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    requester: row.requester
      ? {
          displayName: row.requester.display_name ?? row.requester.username ?? "Usuário do Jobê",
          username: row.requester.username ?? row.requester_id,
          avatarUrl: row.requester.avatar_url ?? undefined,
        }
      : undefined,
  };
}

const PUBLIC_SELECT = `
  *,
  requester:profiles!service_requests_requester_id_fkey(display_name, username, avatar_url)
`;

export async function listOpenServiceRequests(
  supabase: SupabaseClient,
  category?: string,
): Promise<ServiceRequest[]> {
  let query = supabase
    .from("service_requests")
    .select(PUBLIC_SELECT)
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(40);

  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapServiceRequest(row as unknown as ServiceRequestRow));
}

export async function listServiceRequestsForRequester(
  supabase: SupabaseClient,
  requesterId: string,
): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from("service_requests")
    .select(PUBLIC_SELECT)
    .eq("requester_id", requesterId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapServiceRequest(row as unknown as ServiceRequestRow));
}

export async function createServiceRequest(
  supabase: SupabaseClient,
  params: {
    title: string;
    description: string;
    category: string;
    budgetCents?: number;
    desiredDeliveryDays?: number;
  },
): Promise<ServiceRequest> {
  const { data, error } = await supabase.rpc("create_service_request", {
    p_title: params.title,
    p_description: params.description,
    p_category: params.category,
    p_budget_cents: params.budgetCents ?? null,
    p_desired_delivery_days: params.desiredDeliveryDays ?? null,
  });
  if (error) throw new Error(error.message);
  return mapServiceRequest(data as ServiceRequestRow);
}

export async function closeServiceRequest(
  supabase: SupabaseClient,
  requestId: string,
): Promise<ServiceRequest> {
  const { data, error } = await supabase.rpc("close_service_request", {
    p_request_id: requestId,
  });
  if (error) throw new Error(error.message);
  return mapServiceRequest(data as ServiceRequestRow);
}

export async function expressServiceRequestInterest(
  supabase: SupabaseClient,
  params: { requestId: string; message: string },
): Promise<Pick<CustomRequest, "id">> {
  const { data, error } = await supabase.rpc("express_service_request_interest", {
    p_request_id: params.requestId,
    p_message: params.message,
  });
  if (error) throw new Error(error.message);
  const row = data as CustomRequestFromOpportunityRow;
  return { id: row.id };
}
