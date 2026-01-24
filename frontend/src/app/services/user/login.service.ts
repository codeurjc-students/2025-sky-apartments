import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserDTO } from '../../dtos/user.dto';
import { tap, catchError, of, BehaviorSubject } from 'rxjs';

const BASE_URL = '/api/v1/auth';

interface AuthResponse {
  status: 'SUCCESS' | 'FAILURE';
  message: string;
  error?: string;
}

@Injectable({ providedIn: "root" })
export class LoginService {
  public logged$ = new BehaviorSubject<boolean>(false);  public user: UserDTO = {
    id: 0,
    name: '',
    surname: '',
    email: '',
    phoneNumber: '',
    roles: []
  }

  private refreshTimer: any = null;
  private readonly ACCESS_TOKEN_LIFETIME = 5 * 60 * 1000;
  private readonly REFRESH_BEFORE = 30 * 1000;

  constructor(private http: HttpClient) {
    this.reqIsLogged();
  }

  public reqIsLoggedPromise(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get("/api/v1/users/me", { withCredentials: true }).subscribe({
        next: (response) => {
          this.user = response as UserDTO;
          this.logged$.next(true);
          this.startRefreshTimer();
          resolve();
        },
        error: () => {
          this.logged$.next(false);
          resolve();
        }
      });
    });
  }

  public reqIsLogged() {
    this.http.get("/api/v1/users/me", { withCredentials: true }).subscribe(
      (response) => {
        this.user = response as UserDTO;
        this.logged$.next(true);

        this.startRefreshTimer();
      },
      (error) => {
        if (error.status != 404) {
          console.error(
            "Error when asking if logged: " + JSON.stringify(error)
          );
        }
      }
    );
  }

  public logIn(user: string, pass: string) {
    return this.http.post<AuthResponse>(
      BASE_URL + "/login",
      { username: user, password: pass },
      { withCredentials: true }
    ).pipe(
      tap((response) => {
        if (response.status === 'SUCCESS') {
          this.reqIsLogged();
          this.startRefreshTimer();
        }
      })
    );
  }

  public logOut() {

    this.stopRefreshTimer();
    
    return this.http.post<AuthResponse>(
      BASE_URL + "/logout", 
      {}, 
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.logged$.next(false);
        this.user = {
          id: 0,
          name: '',
          surname: '',
          email: '',
          phoneNumber: '',
          roles: []
        };
      })
    );
  }

  public refreshToken() {
    return this.http.post<AuthResponse>(
      BASE_URL + "/refresh",
      {},
      { withCredentials: true }
    ).pipe(
      tap((response) => {
        if (response.status === 'SUCCESS') {
          this.startRefreshTimer();
        } else {
          console.error('Error at refresh token:', response.message);
          this.logOut().subscribe();
        }
      }),
      catchError((error) => {
        console.error('Error at refresh token:', error);
        this.logOut().subscribe();
        return of(null);
      })
    );
  }

  private startRefreshTimer(): void {
    this.stopRefreshTimer();

    const refreshTime = this.ACCESS_TOKEN_LIFETIME - this.REFRESH_BEFORE;

    this.refreshTimer = setTimeout(() => {
      this.refreshToken().subscribe();
    }, refreshTime);

  }

  private stopRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  public isLogged() {
    return this.logged$.getValue();
  }

  public isAdmin() {
    return this.user && this.user.roles.includes("ADMIN");
  }

  public currentUser() {
    return this.user;
  }
}