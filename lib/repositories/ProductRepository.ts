import type { Product } from "@/lib/types";
import { products } from "@/lib/data/products";

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByCreator(creatorId: string): Promise<Product[]>;
  findByCategory(categorySlug: string): Promise<Product[]>;
  search(query: string): Promise<Product[]>;
}

export class MockProductRepository implements ProductRepository {
  async findAll(): Promise<Product[]> {
    return products;
  }

  async findById(id: string): Promise<Product | null> {
    return products.find((p) => p.id === id) ?? null;
  }

  async findByCreator(creatorId: string): Promise<Product[]> {
    return products.filter((p) => p.creatorId === creatorId);
  }

  async findByCategory(categorySlug: string): Promise<Product[]> {
    return products.filter((p) => p.category === categorySlug);
  }

  async search(query: string): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
}

export const productRepository = new MockProductRepository();
