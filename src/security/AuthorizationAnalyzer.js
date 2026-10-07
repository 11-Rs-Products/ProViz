/**
 * AuthorizationAnalyzer.js
 * Verifies that protected operations have valid, non-bypassable authorization checks.
 */

export class AuthorizationAnalyzer {
  /**
   * Evaluates if access to protected asset or sink is authorized.
   * @param {Object} actorContext
   * @param {Object} targetResource
   * @param {Array<string>} pathGuards
   * @returns {Object}
   */
  checkAuthorization(actorContext, targetResource, pathGuards = []) {
    const requiredPermission = targetResource.requiredPermission || targetResource.requiredPrivilege || 'READ';
    const actorPermissions = actorContext.permissions || [];
    const hasPermission = actorPermissions.includes(requiredPermission) || actorPermissions.includes('*');

    const hasAuthzGuard = pathGuards.some(g => g.includes('AUTHZ_GUARD') || g.includes('CHECK_PERMISSION') || g.includes('RBAC'));

    if (!hasPermission && !hasAuthzGuard) {
      return {
        isAuthorized: false,
        isViolation: true,
        reason: `Actor '${actorContext.id || 'anonymous'}' unauthorized for resource '${targetResource.id}' (missing permission '${requiredPermission}')`
      };
    }

    return {
      isAuthorized: true,
      isViolation: false,
      reason: 'Authorization verified'
    };
  }
}
