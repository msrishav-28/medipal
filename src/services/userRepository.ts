import { db, DatabaseUser } from './database';
import { User } from '@/types';

export class UserRepository {
  // Convert database user to domain user
  private toDomainUser(dbUser: DatabaseUser): User {
    return {
      ...dbUser,
      createdAt: new Date(dbUser.createdAt),
      updatedAt: new Date(dbUser.updatedAt)
    };
  }

  // Convert domain user to database user
  private toDatabaseUser(user: Omit<User, 'id'>): Omit<DatabaseUser, 'id'> {
    return {
      ...user,
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt.getTime()
    };
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const id = crypto.randomUUID();
    const userToCreate: User = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now
    };

    const dbUser = this.toDatabaseUser(userToCreate);
    await db.users.add({ ...dbUser, id });
    const createdUser = await db.users.get(id);
    
    if (!createdUser) {
      throw new Error('Failed to create user');
    }

    return this.toDomainUser(createdUser);
  }

  async getById(id: string): Promise<User | null> {
    const user = await db.users.get(id);
    return user ? this.toDomainUser(user) : null;
  }

  async getAll(): Promise<User[]> {
    const users = await db.users.toArray();
    return users.map(user => this.toDomainUser(user));
  }

  async update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User | null> {
    const updateData = {
      ...updates,
      updatedAt: Date.now()
    };

    await db.users.update(id, updateData);
    const updatedUser = await db.users.get(id);
    
    return updatedUser ? this.toDomainUser(updatedUser) : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      const user = await db.users.get(id);
      if (!user) {
        return false;
      }
      await db.users.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // For now, return the first user (single-user app)
    const users = await this.getAll();
    return users.length > 0 ? users[0]! : null;
  }
}

export const userRepository = new UserRepository();