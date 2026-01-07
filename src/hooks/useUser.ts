import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRepository } from '@/services';
import { queryKeys } from '@/services/queryClient';
import { User } from '@/types';

// Hook for getting the current user
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.current,
    queryFn: () => userRepository.getCurrentUser(),
    // Keep user data fresh
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Always refetch on window focus for user data
    refetchOnWindowFocus: true,
  });
}

// Hook for getting a user by ID
export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.byId(id),
    queryFn: () => userRepository.getById(id),
    enabled: !!id,
  });
}

// Hook for getting all users
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => userRepository.getAll(),
  });
}

// Hook for creating a new user
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) =>
      userRepository.create(userData),
    onSuccess: (newUser) => {
      // Add the new user to the cache
      queryClient.setQueryData(
        queryKeys.users.byId(newUser.id),
        newUser
      );

      // Update the current user cache if this is the first user
      queryClient.setQueryData(
        queryKeys.users.current,
        newUser
      );

      // Invalidate the users list
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all
      });
    },
  });
}

// Hook for updating user information
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: {
      id: string;
      updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
    }) => userRepository.update(id, updates),
    onSuccess: (updatedUser, { id }) => {
      if (updatedUser) {
        // Update the specific user in cache
        queryClient.setQueryData(
          queryKeys.users.byId(id),
          updatedUser
        );

        // Update current user cache if this is the current user
        queryClient.setQueryData(
          queryKeys.users.current,
          (oldUser: User | null) => {
            return oldUser?.id === id ? updatedUser : oldUser;
          }
        );

        // Invalidate the users list
        queryClient.invalidateQueries({
          queryKey: queryKeys.users.all
        });
      }
    },
  });
}

// Hook for updating user preferences specifically
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, preferences }: {
      id: string;
      preferences: Partial<User['preferences']>
    }) => userRepository.update(id, { preferences: preferences as any }),
    onSuccess: (updatedUser, { id }) => {
      if (updatedUser) {
        // Update the specific user in cache
        queryClient.setQueryData(
          queryKeys.users.byId(id),
          updatedUser
        );

        // Update current user cache if this is the current user
        queryClient.setQueryData(
          queryKeys.users.current,
          (oldUser: User | null) => {
            return oldUser?.id === id ? updatedUser : oldUser;
          }
        );
      }
    },
    // Optimistic updates for preferences
    onMutate: async ({ id, preferences }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.byId(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.current });

      // Snapshot the previous values
      const previousUser = queryClient.getQueryData<User>(queryKeys.users.byId(id));
      const previousCurrentUser = queryClient.getQueryData<User>(queryKeys.users.current);

      // Optimistically update the cache
      if (previousUser) {
        const optimisticUser = {
          ...previousUser,
          preferences: {
            ...previousUser.preferences,
            ...preferences
          }
        };

        queryClient.setQueryData(queryKeys.users.byId(id), optimisticUser);

        // Update current user if it's the same user
        if (previousCurrentUser?.id === id) {
          queryClient.setQueryData(queryKeys.users.current, optimisticUser);
        }
      }

      // Return a context object with the snapshotted values
      return { previousUser, previousCurrentUser };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, { id }, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.users.byId(id), context.previousUser);
      }
      if (context?.previousCurrentUser) {
        queryClient.setQueryData(queryKeys.users.current, context.previousCurrentUser);
      }
    },
  });
}

// Hook for deleting a user
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userRepository.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.users.byId(id)
      });

      // Clear current user if it was deleted
      queryClient.setQueryData(
        queryKeys.users.current,
        (oldUser: User | null) => {
          return oldUser?.id === id ? null : oldUser;
        }
      );

      // Invalidate the users list
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all
      });
    },
  });
}
