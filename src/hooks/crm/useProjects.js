import { useState, useEffect, useCallback } from 'react';
import projectsAPI from '../../services/api/crm/projects';

// Module-level cache with separate entries for different filters
const cache = {
  all: { projects: null, timestamp: null },
  stats: { data: null, timestamp: null },
  TTL: 5 * 60 * 1000, // 5 minutes
};

export function useProjects(filters = {}) {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCacheKey = (filters) => {
    if (!filters.statuses || filters.statuses.length === 0) return 'all';
    // Sort statuses for consistent cache keys
    return `statuses_${filters.statuses.slice().sort().join('_')}`;
  };

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const now = Date.now();
      const cacheKey = getCacheKey(filters);

      // Initialize cache entry if it doesn't exist
      if (!cache[cacheKey]) {
        cache[cacheKey] = { projects: null, timestamp: null };
      }

      // Check project cache for this filter
      const isCacheValid = cache[cacheKey].projects &&
                          cache[cacheKey].timestamp &&
                          (now - cache[cacheKey].timestamp < cache.TTL);

      // Check stats cache
      const isStatsCacheValid = cache.stats.data &&
                               cache.stats.timestamp &&
                               (now - cache.stats.timestamp < cache.TTL);

      if (isCacheValid && isStatsCacheValid) {
        setProjects(cache[cacheKey].projects);
        setStats(cache.stats.data);
        setLoading(false);
        return;
      }

      // Fetch from API
      const promises = [];

      if (!isCacheValid) {
        promises.push(projectsAPI.list(filters));
      } else {
        promises.push(Promise.resolve(null));
      }

      if (!isStatsCacheValid) {
        promises.push(projectsAPI.getStats());
      } else {
        promises.push(Promise.resolve(null));
      }

      const [projectsData, statsData] = await Promise.all(promises);

      if (projectsData !== null) {
        cache[cacheKey].projects = projectsData.items || projectsData;
        cache[cacheKey].timestamp = now;
      }

      if (statsData !== null) {
        cache.stats.data = statsData;
        cache.stats.timestamp = now;
      }

      setProjects(cache[cacheKey].projects);
      setStats(cache.stats.data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const invalidateAllCaches = () => {
    // Invalidate all project caches
    Object.keys(cache).forEach(key => {
      if (key !== 'TTL' && cache[key]) {
        cache[key].projects = null;
        cache[key].timestamp = null;
      }
    });
    // Invalidate stats cache
    cache.stats.data = null;
    cache.stats.timestamp = null;
  };

  const createProject = useCallback(async (data) => {
    const newProject = await projectsAPI.create(data);
    invalidateAllCaches();
    await loadProjects();
    return newProject;
  }, [loadProjects]);

  const updateProject = useCallback(async (projectId, data) => {
    const updated = await projectsAPI.update(projectId, data);
    invalidateAllCaches();
    await loadProjects();
    return updated;
  }, [loadProjects]);

  const deleteProject = useCallback(async (projectId) => {
    await projectsAPI.delete(projectId);
    invalidateAllCaches();
    await loadProjects();
  }, [loadProjects]);

  return {
    projects,
    stats,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refresh: loadProjects,
  };
}
