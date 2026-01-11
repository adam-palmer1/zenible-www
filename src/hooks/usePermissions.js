import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Permission definitions for CRM actions
 * Format: 'resource:action'
 */
export const PERMISSIONS = {
  // Contact permissions
  CONTACT_VIEW: 'contact:view',
  CONTACT_CREATE: 'contact:create',
  CONTACT_UPDATE: 'contact:update',
  CONTACT_DELETE: 'contact:delete',
  CONTACT_UPDATE_STATUS: 'contact:update_status',
  CONTACT_BULK_ACTIONS: 'contact:bulk_actions',

  // Service permissions
  SERVICE_VIEW: 'service:view',
  SERVICE_CREATE: 'service:create',
  SERVICE_UPDATE: 'service:update',
  SERVICE_DELETE: 'service:delete',

  // Status permissions
  STATUS_CREATE_CUSTOM: 'status:create_custom',
  STATUS_UPDATE_CUSTOM: 'status:update_custom',
  STATUS_DELETE_CUSTOM: 'status:delete_custom',
  STATUS_RENAME_COLUMN: 'status:rename_column',

  // Admin permissions
  ADMIN_VIEW_SETTINGS: 'admin:view_settings',
  ADMIN_UPDATE_SETTINGS: 'admin:update_settings'
};

/**
 * Role-based permission mappings
 * In production, this should come from the backend
 */
const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS), // Admin has all permissions
  manager: [
    PERMISSIONS.CONTACT_VIEW,
    PERMISSIONS.CONTACT_CREATE,
    PERMISSIONS.CONTACT_UPDATE,
    PERMISSIONS.CONTACT_DELETE,
    PERMISSIONS.CONTACT_UPDATE_STATUS,
    PERMISSIONS.CONTACT_BULK_ACTIONS,
    PERMISSIONS.SERVICE_VIEW,
    PERMISSIONS.SERVICE_CREATE,
    PERMISSIONS.SERVICE_UPDATE,
    PERMISSIONS.SERVICE_DELETE,
    PERMISSIONS.STATUS_CREATE_CUSTOM,
    PERMISSIONS.STATUS_UPDATE_CUSTOM,
    PERMISSIONS.STATUS_DELETE_CUSTOM,
    PERMISSIONS.STATUS_RENAME_COLUMN
  ],
  user: [
    PERMISSIONS.CONTACT_VIEW,
    PERMISSIONS.CONTACT_CREATE,
    PERMISSIONS.CONTACT_UPDATE,
    PERMISSIONS.CONTACT_UPDATE_STATUS,
    PERMISSIONS.SERVICE_VIEW,
    PERMISSIONS.SERVICE_CREATE,
    PERMISSIONS.SERVICE_UPDATE,
    PERMISSIONS.STATUS_RENAME_COLUMN
  ],
  viewer: [
    PERMISSIONS.CONTACT_VIEW,
    PERMISSIONS.SERVICE_VIEW,
    PERMISSIONS.STATUS_RENAME_COLUMN
  ]
};

/**
 * Hook for permission-based access control
 */
export const usePermissions = () => {
  const { user } = useAuth();

  // Get user's permissions based on role
  const userPermissions = useMemo(() => {
    if (!user) return [];

    const role = user.role || 'viewer';
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
  }, [user]);

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission to check
   * @param {object} resource - Optional resource to check ownership
   * @returns {boolean}
   */
  const can = (permission, resource = null) => {
    if (!user) return false;

    // Check if user has the permission
    const hasPermission = userPermissions.includes(permission);

    // If no resource specified, just check permission
    if (!resource) return hasPermission;

    // Check resource ownership for certain permissions
    const ownershipPermissions = [
      PERMISSIONS.CONTACT_UPDATE,
      PERMISSIONS.CONTACT_DELETE,
      PERMISSIONS.SERVICE_UPDATE,
      PERMISSIONS.SERVICE_DELETE
    ];

    // If this is an ownership-based permission, check if user owns the resource
    if (ownershipPermissions.includes(permission)) {
      // Admin and managers can access all resources
      if (user.role === 'admin' || user.role === 'manager') {
        return hasPermission;
      }

      // Regular users can only access their own resources
      if (resource.created_by === user.id || resource.owner_id === user.id) {
        return hasPermission;
      }

      return false;
    }

    return hasPermission;
  };

  /**
   * Check if user cannot perform an action (inverse of can)
   */
  const cannot = (permission, resource = null) => {
    return !can(permission, resource);
  };

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = (...permissions) => {
    return permissions.every(permission => can(permission));
  };

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = (...permissions) => {
    return permissions.some(permission => can(permission));
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  /**
   * Check if user is an admin
   */
  const isAdmin = () => hasRole('admin');

  /**
   * Check if user is a manager or admin
   */
  const isManagerOrAdmin = () => hasRole('admin') || hasRole('manager');

  return {
    can,
    cannot,
    canAll,
    canAny,
    hasRole,
    isAdmin,
    isManagerOrAdmin,
    permissions: userPermissions,
    user
  };
};
