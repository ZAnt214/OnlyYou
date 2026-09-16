import type { Dispute } from "@/lib/types";

export interface DisputeRepository {
  findAll(): Promise<Dispute[]>;
  findByCustomServiceOrder(customServiceOrderId: string): Promise<Dispute[]>;
  create(dispute: Dispute): Promise<Dispute>;
}

let mockDisputes: Dispute[] = [];

export class MockDisputeRepository implements DisputeRepository {
  async findAll(): Promise<Dispute[]> {
    return mockDisputes;
  }

  async findByCustomServiceOrder(customServiceOrderId: string): Promise<Dispute[]> {
    return mockDisputes.filter((d) => d.customServiceOrderId === customServiceOrderId);
  }

  async create(dispute: Dispute): Promise<Dispute> {
    mockDisputes = [...mockDisputes, dispute];
    return dispute;
  }
}

export const disputeRepository = new MockDisputeRepository();
