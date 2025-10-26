import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { LoginService } from './app/services/user/login.service';


export const authGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  // Get the current logged-in status
  const logged = loginService.isLogged();
  
  if (logged) {
    return true;
  }

  // Redirect to login page if not logged in
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};