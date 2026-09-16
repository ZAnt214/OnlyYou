import type { CustomRequest } from "@/lib/types";
import { customRequests } from "@/lib/data/custom-requests";

export interface CustomRequestRepository {
  findByCreator(creatorId: string): Promise<CustomRequest[]>;
  create(request: CustomRequest): Promise<CustomRequest>;
}

let mockCustomRequests: CustomRequest[] = [...customRequests];

export class MockCustomRequestRepository implements CustomRequestRepository {
  async findByCreator(creatorId: string): Promise<CustomRequest[]> {
    return mockCustomRequests.filter((r) => r.creatorId === creatorId);
  }

  async create(request: CustomRequest): Promise<CustomRequest> {
    mockCustomRequests = [...mockCustomRequests, request];
    return request;
  }
}

export const customRequestRepository = new MockCustomRequestRepository();
