import type { Review } from "@/lib/types";
import { reviews } from "@/lib/data/reviews";

export interface ReviewRepository {
  findByProduct(productId: string): Promise<Review[]>;
  findByUser(userId: string): Promise<Review[]>;
}

export class MockReviewRepository implements ReviewRepository {
  async findByProduct(productId: string): Promise<Review[]> {
    return reviews.filter((r) => r.productId === productId);
  }

  async findByUser(userId: string): Promise<Review[]> {
    return reviews.filter((r) => r.userId === userId);
  }
}

export const reviewRepository = new MockReviewRepository();
