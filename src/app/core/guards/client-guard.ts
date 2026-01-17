import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { hasRole } from './token-utils';

export const clientGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const token = auth.getAccessToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

