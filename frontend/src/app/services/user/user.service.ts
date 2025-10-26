import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserDTO } from '../../dtos/user.dto';
import { UpdateUserRequestDTO } from '../../dtos/updateUserRequest.dto';
import { UserRequestDTO } from '../../dtos/userRequest.dto';


const BASE_URL = '/api/v1/users';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private httpClient: HttpClient) {}

  public getUserById(id: number): Observable<UserDTO> {
    return this.httpClient
      .get<UserDTO>(`${BASE_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  public getCurrentUser(): Observable<UserDTO> {
    return this.httpClient
      .get<UserDTO>(`${BASE_URL}/me`)
      .pipe(catchError(this.handleError));
  }

  public createUser(requestDTO: UserRequestDTO): Observable<UserDTO> {
    return this.httpClient
      .post<UserDTO>(BASE_URL, requestDTO)
      .pipe(catchError(this.handleError));
  }

  public updateUser(id: number, updateDTO: UpdateUserRequestDTO): Observable<UserDTO> {
    return this.httpClient
      .put<UserDTO>(`${BASE_URL}/${id}`, updateDTO)
      .pipe(catchError(this.handleError));
  }

  public deleteUser(id: number): Observable<void> {
    return this.httpClient
      .delete<void>(`${BASE_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('HTTP Error:', error);
    return throwError(() => error);
  }
}
