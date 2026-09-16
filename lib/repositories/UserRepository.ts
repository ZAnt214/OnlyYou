import type { User } from "@/lib/types";
import { allUsers, creators } from "@/lib/data/users";

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findCreators(): Promise<User[]>;
  updateCreatorProfile(
    userId: string,
    patch: { displayName?: string; bio?: string },
  ): Promise<User>;
}

export class MockUserRepository implements UserRepository {
  async findAll(): Promise<User[]> {
    return allUsers;
  }

  async findById(id: string): Promise<User | null> {
    return allUsers.find((u) => u.id === id) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return allUsers.find((u) => u.username === username) ?? null;
  }

  async findCreators(): Promise<User[]> {
    return creators;
  }

  /**
   * Nesta fase de mock não há autenticação real: a área do criador
   * (dashboard) sempre opera como se a pessoa usuária fosse esta criadora
   * verificada, para permitir navegar por todas as telas com dados
   * consistentes.
   */
  async findMockCurrentCreator(): Promise<User> {
    return creators[0];
  }

  /**
   * Mutação em memória, sem banco de dados: atualiza o objeto do usuário
   * diretamente no array mock. Persiste apenas enquanto o processo do
   * servidor estiver de pé (mesmo padrão usado por ReportRepository e
   * CustomRequestRepository).
   */
  async updateCreatorProfile(
    userId: string,
    patch: { displayName?: string; bio?: string },
  ): Promise<User> {
    const user = allUsers.find((u) => u.id === userId);
    if (!user || !user.creatorProfile) {
      throw new Error("Usuário não encontrado ou não é criador.");
    }
    if (patch.displayName !== undefined) user.displayName = patch.displayName;
    if (patch.bio !== undefined) user.creatorProfile.bio = patch.bio;
    return user;
  }
}

export const userRepository = new MockUserRepository();
