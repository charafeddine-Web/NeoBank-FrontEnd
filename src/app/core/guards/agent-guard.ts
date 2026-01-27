import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { hasRole } from './token-utils';

export const agentGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const token = auth.getAccessToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  if (!hasRole(token, r => r.includes('AGENT'))) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

