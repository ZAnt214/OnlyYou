import type { Coupon } from "@/lib/types";
import { coupons } from "@/lib/data/coupons";

export interface CouponRepository {
  findByCreator(creatorId: string): Promise<Coupon[]>;
  findByCode(code: string): Promise<Coupon | null>;
}

export class MockCouponRepository implements CouponRepository {
  async findByCreator(creatorId: string): Promise<Coupon[]> {
    return coupons.filter((c) => c.creatorId === creatorId);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return coupons.find((c) => c.code.toLowerCase() === code.toLowerCase()) ?? null;
  }
}

export const couponRepository = new MockCouponRepository();
