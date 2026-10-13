/**
 * =========================================================================
 * ACADEMIC STAFF & TEACHERS PORTAL SECURITY CONFIGURATION
 * =========================================================================
 * 
 * Master passwords for accessing the Academic Staff Portal, Gradebook, and Super Admin Authority.
 * Staff Password: StPaul2026!
 * Super Admin Password: UPgrade2026 (strictly distinct from general staff)
 */
export const STAFF_PORTAL_PASSWORD = 'StPaul2026!';
export const SUPER_ADMIN_PORTAL_PASSWORD = 'UPgrade2026';

/**
 * Session storage keys to track authorized roles during active browser sessions.
 */
export const STAFF_SESSION_AUTH_KEY = 'stpaul_staff_portal_unlocked';
export const SUPER_ADMIN_SESSION_AUTH_KEY = 'stpaul_super_admin_portal_unlocked';

/**
 * Check whether a provided password matches the Super Administrator password.
 */
export function verifySuperAdminPassword(candidate: string): boolean {
  if (!candidate) return false;
  return candidate.trim() === SUPER_ADMIN_PORTAL_PASSWORD;
}

/**
 * Check whether a provided password matches the general staff password.
 */
export function verifyStaffPassword(candidate: string): boolean {
  if (!candidate) return false;
  return candidate.trim() === STAFF_PORTAL_PASSWORD;
}

/**
 * Check whether a provided password matches either staff or super admin master password.
 */
export function verifyAnyPortalPassword(candidate: string): boolean {
  if (!candidate) return false;
  const trimmed = candidate.trim();
  return trimmed === STAFF_PORTAL_PASSWORD || trimmed === SUPER_ADMIN_PORTAL_PASSWORD;
}

/**
 * Check if the staff portal is already unlocked in this browser session.
 */
export function isStaffPortalUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STAFF_SESSION_AUTH_KEY) === 'true' || 
           sessionStorage.getItem(SUPER_ADMIN_SESSION_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Check if the Super Admin portal is unlocked in this browser session.
 */
export function isSuperAdminUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SUPER_ADMIN_SESSION_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark the staff portal as unlocked for this session.
 */
export function setStaffPortalUnlocked(): void {
  try {
    sessionStorage.setItem(STAFF_SESSION_AUTH_KEY, 'true');
  } catch (e) {
    console.error('Failed to set staff session unlock:', e);
  }
}

/**
 * Mark the Super Admin portal as unlocked for this session.
 */
export function setSuperAdminUnlocked(): void {
  try {
    sessionStorage.setItem(STAFF_SESSION_AUTH_KEY, 'true');
    sessionStorage.setItem(SUPER_ADMIN_SESSION_AUTH_KEY, 'true');
  } catch (e) {
    console.error('Failed to set super admin session unlock:', e);
  }
}

/**
 * Reset staff and super admin authorization (locks the staff/gradebook area).
 */
export function clearStaffPortalUnlocked(): void {
  try {
    sessionStorage.removeItem(STAFF_SESSION_AUTH_KEY);
    sessionStorage.removeItem(SUPER_ADMIN_SESSION_AUTH_KEY);
  } catch (e) {
    console.error('Failed to clear staff session unlock:', e);
  }
}
