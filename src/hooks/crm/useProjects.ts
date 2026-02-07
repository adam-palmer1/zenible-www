import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import projectsAPI from '../../services/api/crm/projects';
import { queryKeys } from '../../lib/query-keys';

/**
 * React Query-based hook for managing projects
 *
 * Features:
 * - Automatic request deduplication
 * - 5-minute stale time (configured in react-query.js)
 * - Automatic cache invalidation on mutations
 * - Separate queries for projects list and stats
 */

export function useProjects(filters: Record<string, unknown> = {}) {
  const queryClient = useQueryClient();

  // Query for projects list
  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: async () => {
      const data = await projectsAPI.list(filters as any) as any;
      return data.items || data;
    },
  });

  // Query for project stats
  const statsQuery = useQuery({
    queryKey: queryKeys.projects.stats(),
    queryFn: () => projectsAPI.getStats(),
  });

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => projectsAPI.create(data),
    onSuccess: () => {
      // Invalidate all project lists and stats
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
    },
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Record<string, unknown> }) => projectsAPI.update(projectId, data),
    onSuccess: () => {
      // Invalidate all project lists and stats
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => projectsAPI.delete(projectId),
    onSuccess: () => {
      // Invalidate all project lists and stats
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
    },
  });

  // Wrapper functions to maintain the same API interface
  const createProject = useCallback(async (data: Record<string, unknown>): Promise<unknown> => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateProject = useCallback(async (projectId: string, data: Record<string, unknown>): Promise<unknown> => {
    return updateMutation.mutateAsync({ projectId, data });
  }, [updateMutation]);

  const deleteProject = useCallback(async (projectId: string): Promise<unknown> => {
    return deleteMutation.mutateAsync(projectId);
  }, [deleteMutation]);

  // Refresh function that invalidates and refetches
  const refresh = useCallback((): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
  }, [queryClient]);

  // Combine loading states - loading if either query is in initial loading state
  const loading = projectsQuery.isLoading || statsQuery.isLoading;

  // Combine error states
  const error = projectsQuery.error?.message || statsQuery.error?.message || null;

  return {
    projects: projectsQuery.data || [],
    stats: statsQuery.data || null,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refresh,
    // Additional React Query utilities for advanced usage
    isRefetching: projectsQuery.isRefetching || statsQuery.isRefetching,
    isFetching: projectsQuery.isFetching || statsQuery.isFetching,
  };
}
