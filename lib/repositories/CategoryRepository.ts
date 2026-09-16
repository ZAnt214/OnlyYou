import type { Category } from "@/lib/types";
import { categories } from "@/lib/data/categories";

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
}

export class MockCategoryRepository implements CategoryRepository {
  async findAll(): Promise<Category[]> {
    return categories;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return categories.find((c) => c.slug === slug) ?? null;
  }
}

export const categoryRepository = new MockCategoryRepository();
