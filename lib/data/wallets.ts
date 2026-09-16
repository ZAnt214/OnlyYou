import type { CreatorBalance, Withdrawal } from "@/lib/types";

export const creatorBalances: CreatorBalance[] = [
  { creatorId: "user-c01", available: 412.3, pending: 89.6, withdrawn: 1820.0, currency: "BRL" },
  { creatorId: "user-c02", available: 780.15, pending: 140.2, withdrawn: 5230.5, currency: "BRL" },
  { creatorId: "user-c03", available: 0, pending: 32.4, withdrawn: 0, currency: "BRL" },
  { creatorId: "user-c04", available: 71.92, pending: 0, withdrawn: 0, currency: "BRL" },
  { creatorId: "user-c05", available: 1204.6, pending: 310.0, withdrawn: 9870.25, currency: "BRL" },
  { creatorId: "user-c06", available: 0, pending: 0, withdrawn: 0, currency: "BRL" },
  { creatorId: "user-c07", available: 0, pending: 0, withdrawn: 3120.0, currency: "BRL" },
  { creatorId: "user-c08", available: 526.4, pending: 96.8, withdrawn: 2410.0, currency: "BRL" },
];

export const withdrawals: Withdrawal[] = [
  {
    id: "wd-2001",
    creatorId: "user-c02",
    amount: 500.0,
    currency: "BRL",
    status: "paid",
    requestedAt: "2025-08-01T10:00:00.000Z",
  },
  {
    id: "wd-2002",
    creatorId: "user-c05",
    amount: 900.0,
    currency: "BRL",
    status: "processing",
    requestedAt: "2025-09-10T10:00:00.000Z",
  },
  {
    id: "wd-2003",
    creatorId: "user-c01",
    amount: 200.0,
    currency: "BRL",
    status: "requested",
    requestedAt: "2025-09-15T10:00:00.000Z",
  },
  {
    id: "wd-2004",
    creatorId: "user-c08",
    amount: 350.0,
    currency: "BRL",
    status: "rejected",
    requestedAt: "2025-08-22T10:00:00.000Z",
  },
];
