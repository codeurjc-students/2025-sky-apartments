import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserDTO } from '../../dtos/user.dto';
import { catchError, of, tap } from 'rxjs';

const BASE_URL = '/api/v1/auth';

@Injectable({ providedIn: "root" })
export class LoginService {
  public logged: boolean = false;
  public user: UserDTO | undefined = undefined;

  constructor(private http: HttpClient) {
    this.reqIsLogged();
  }

  public reqIsLogged() {
  this.http.get<UserDTO>("/api/v1/users/me", { withCredentials: true })
    .pipe(
      tap((response) => {
        this.user = response;
        this.logged = true;
      }),
      catchError((error) => {
        if (error.status !== 404) {
          console.error("Error when asking if logged:", error);
        }
        return of(null);
      })
    )
    .subscribe();
}

  public logIn(user: string, pass: string) {
    return this.http.post(
      BASE_URL + "/login",
      { username: user, password: pass },
      { withCredentials: true }
    );
  }

  public logOut() {
    return this.http
      .post(BASE_URL + "/logout", { withCredentials: true })
      .subscribe((_) => {
        console.log("LOGOUT: Successfully");
        this.logged = false;
        this.user = undefined;
      });
  }

  public isLogged() {
    return this.logged;
  }

  public isAdmin() {
    return this.user && this.user.roles.includes("ADMIN");
  }

  currentUser() {
    return this.user;
  }
  
}