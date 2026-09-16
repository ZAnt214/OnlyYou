"use client";

import { useMemo } from "react";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface FavoriteRepository {
  list(): string[];
  isFavorite(productId: string): boolean;
  toggle(productId: string): void;
}

export class MockFavoriteRepository implements FavoriteRepository {
  constructor(private session: MockSessionContextValue) {}

  list(): string[] {
    return this.session.favorites;
  }

  isFavorite(productId: string): boolean {
    return this.session.favorites.includes(productId);
  }

  toggle(productId: string): void {
    this.session.toggleFavorite(productId);
  }
}

export function useFavoriteRepository(): FavoriteRepository {
  const session = useMockSession();
  return useMemo(() => new MockFavoriteRepository(session), [session]);
}
