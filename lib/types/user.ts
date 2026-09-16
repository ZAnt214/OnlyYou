export type Role = "buyer" | "creator" | "admin";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";

export interface CreatorProfile {
  bio: string;
  followers: number;
  verificationStatus: VerificationStatus;
  rating: number;
  ratingCount: number;
  productCount: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  roles: Role[];
  createdAt: string;
  creatorProfile?: CreatorProfile;
}
