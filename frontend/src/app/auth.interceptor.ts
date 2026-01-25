
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { LoginService } from './services/user/login.service';


let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);

  // Clone the request to add credentials
  const clonedRequest = req.clone({
    withCredentials: true
  });

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 Unauthorized and not on login/refresh endpoints
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/users/me')
      ) {

        if (!isRefreshing) {
          isRefreshing = true;

          return loginService.refreshToken().pipe(
            switchMap((response) => {
              isRefreshing = false;

              if (response && response.status === 'SUCCESS') {
                return next(clonedRequest);
              } else {
                return throwError(() => error);
              }
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              console.error('Error en refresh, cerrando sesión');
              loginService.logOut().subscribe();
              return throwError(() => refreshError);
            })
          );
        } else {
          // If a refresh is already in progress, wait for it to complete
          return throwError(() => error);
        }
      }
      return throwError(() => error);
    })
  );
};