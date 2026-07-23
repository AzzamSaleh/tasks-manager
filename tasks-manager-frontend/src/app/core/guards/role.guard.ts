import { inject } from "@angular/core";
import { CanActivateFn, ActivatedRouteSnapshot, Router } from "@angular/router";
import { UserRole } from "../../features/auth/models/auth.models";
import { AuthService } from "../../features/auth/services/auth.service";

/*
 * Ensures that only the roles configured in route data
 * can activate the route.
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentRole =
    authService.session()?.role;

  const allowedRoles =
    route.data['roles'] as UserRole[] | undefined;

  if (
    currentRole &&
    allowedRoles?.includes(currentRole)
  ) {
    return true;
  }

  if (currentRole === 'ADMIN') {
    return router.createUrlTree(['/admin']);
  }

  if (currentRole === 'USER') {
    return router.createUrlTree(['/user']);
  }

  return router.createUrlTree(['/login']);
};