import { describe, it, expect, beforeEach } from 'vitest';
import { userRepository } from '../userRepository';
import { db } from '../database';
import { createTestUser } from '@/test/testUtils';

describe('UserRepository', () => {
  beforeEach(async () => {
    await db.users.clear();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = createTestUser();
      delete (userData as any).id;
      delete (userData as any).createdAt;
      delete (userData as any).updatedAt;

      const createdUser = await userRepository.create(userData);

      expect(createdUser.id).toBeDefined();
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.age).toBe(userData.age);
      expect(createdUser.createdAt).toBeInstanceOf(Date);
      expect(createdUser.updatedAt).toBeInstanceOf(Date);
    });

    it('should set timestamps automatically', async () => {
      const userData = createTestUser();
      delete (userData as any).id;
      delete (userData as any).createdAt;
      delete (userData as any).updatedAt;

      const beforeCreate = new Date();
      const createdUser = await userRepository.create(userData);
      const afterCreate = new Date();

      expect(createdUser.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdUser.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(createdUser.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdUser.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('getById', () => {
    it('should retrieve a user by ID', async () => {
      const userData = createTestUser();
      delete (userData as any).id;
      delete (userData as any).createdAt;
      delete (userData as any).updatedAt;

      const createdUser = await userRepository.create(userData);
      const retrievedUser = await userRepository.getById(createdUser.id);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.name).toBe(createdUser.name);
    });

    it('should return null for non-existent user', async () => {
      const retrievedUser = await userRepository.getById('non-existent-id');
      expect(retrievedUser).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const userData = createTestUser();
      delete (userData as any).id;
      delete (userData as any).createdAt;
      delete (userData as any).updatedAt;

      const createdUser = await userRepository.create(userData);
      
      const updates = { name: 'Updated Name', age: 70 };
      const updatedUser = await userRepository.update(createdUser.id, updates);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.age).toBe(70);
      expect(updatedUser?.updatedAt.getTime()).toBeGreaterThan(createdUser.updatedAt.getTime());
    });

    it('should return null for non-existent user', async () => {
      const updatedUser = await userRepository.update('non-existent-id', { name: 'Test' });
      expect(updatedUser).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const userData = createTestUser();
      delete (userData as any).id;
      delete (userData as any).createdAt;
      delete (userData as any).updatedAt;

      const createdUser = await userRepository.create(userData);
      const deleteResult = await userRepository.delete(createdUser.id);

      expect(deleteResult).toBe(true);

      const retrievedUser = await userRepository.getById(createdUser.id);
      expect(retrievedUser).toBeNull();
    });

    it('should return false for non-existent user', async () => {
      const deleteResult = await userRepository.delete('non-existent-id');
      expect(deleteResult).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return the first user when users exist', async () => {
      const userData1 = createTestUser({ name: 'User 1' });
      const userData2 = createTestUser({ name: 'User 2' });
      
      delete (userData1 as any).id;
      delete (userData1 as any).createdAt;
      delete (userData1 as any).updatedAt;
      delete (userData2 as any).id;
      delete (userData2 as any).createdAt;
      delete (userData2 as any).updatedAt;

      await userRepository.create(userData1);
      await userRepository.create(userData2);

      const currentUser = await userRepository.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser?.name).toBe('User 1');
    });

    it('should return null when no users exist', async () => {
      const currentUser = await userRepository.getCurrentUser();
      expect(currentUser).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all users', async () => {
      const userData1 = createTestUser({ name: 'User 1' });
      const userData2 = createTestUser({ name: 'User 2' });
      
      delete (userData1 as any).id;
      delete (userData1 as any).createdAt;
      delete (userData1 as any).updatedAt;
      delete (userData2 as any).id;
      delete (userData2 as any).createdAt;
      delete (userData2 as any).updatedAt;

      await userRepository.create(userData1);
      await userRepository.create(userData2);

      const allUsers = await userRepository.getAll();
      expect(allUsers).toHaveLength(2);
      expect(allUsers.map(u => u.name)).toContain('User 1');
      expect(allUsers.map(u => u.name)).toContain('User 2');
    });

    it('should return empty array when no users exist', async () => {
      const allUsers = await userRepository.getAll();
      expect(allUsers).toHaveLength(0);
    });
  });
});