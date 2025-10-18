import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserDTO } from '../../dtos/user.dto';
import { tap } from 'rxjs';

const BASE_URL = '/api/v1/auth';

@Injectable({ providedIn: "root" })
export class LoginService {
  public logged: boolean = false;
  public user: UserDTO = {
    id: 0,
    name: '',
    surname: '',
    email: '',
    phoneNumber: '',
    roles: []
  }

  constructor(private http: HttpClient) {
    this.reqIsLogged();
  }

  public reqIsLogged() {
    this.http.get("/api/v1/users/me", { withCredentials: true }).subscribe(
      (response) => {
        this.user = response as UserDTO;
        this.logged = true;
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
    return this.http.post(
      BASE_URL + "/login",
      { username: user, password: pass },
      { withCredentials: true }
    ).pipe();
  }

  public logOut() {
    return this.http.post(BASE_URL + "/logout", {}, { withCredentials: true }).pipe(
      tap(() => {
        console.log("LOGOUT: Successfully");
        this.logged = false;
      })
    );
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