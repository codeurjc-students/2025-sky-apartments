import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { authInterceptor } from './auth.interceptor';
import { LoginService } from './services/user/login.service';

function initializeApp(loginService: LoginService) {
  return () => loginService.reqIsLoggedPromise();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })),
    provideNativeDateAdapter(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [LoginService],
      multi: true
    },
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables())
  ]
};
