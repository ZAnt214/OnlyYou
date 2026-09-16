import type { CreatorBalance } from "@/lib/types";
import { creatorBalances } from "@/lib/data/wallets";

export interface WalletRepository {
  findByCreator(creatorId: string): Promise<CreatorBalance | null>;
}

export class MockWalletRepository implements WalletRepository {
  async findByCreator(creatorId: string): Promise<CreatorBalance | null> {
    return creatorBalances.find((b) => b.creatorId === creatorId) ?? null;
  }
}

export const walletRepository = new MockWalletRepository();
