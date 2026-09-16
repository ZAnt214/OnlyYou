import type { Coupon } from "@/lib/types";

export const coupons: Coupon[] = [
  {
    id: "coup-5001",
    creatorId: "user-c01",
    code: "RUBI10",
    discountPercent: 10,
    active: true,
    expiresAt: "2025-12-31T23:59:59.000Z",
  },
  {
    id: "coup-5002",
    creatorId: "user-c02",
    code: "NOITE20",
    discountPercent: 20,
    active: true,
    expiresAt: "2025-10-31T23:59:59.000Z",
  },
  {
    id: "coup-5003",
    creatorId: "user-c05",
    code: "OUTONO15",
    discountPercent: 15,
    active: false,
    expiresAt: "2025-06-30T23:59:59.000Z",
  },
];
