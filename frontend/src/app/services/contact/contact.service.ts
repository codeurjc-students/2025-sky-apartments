import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ContactMessageDTO } from '../../dtos/contactMessage.dto';



export interface ContactResponse {
  status: string;
  message: string;
}

const BASE_URL = '/api/v1/contact';

@Injectable({ providedIn: 'root' })
export class ContactService {
  
  constructor(private httpClient: HttpClient) {}
  
  sendContactMessage(contactMessage: ContactMessageDTO): Observable<ContactResponse> {
    return this.httpClient
      .post<ContactResponse>(BASE_URL, contactMessage)
      .pipe(catchError((error) => this.handleError(error)));
  }
  
  private handleError(error: HttpErrorResponse) {
    console.error('ERROR in ContactService:', error);
    return throwError(() => error);
  }
}