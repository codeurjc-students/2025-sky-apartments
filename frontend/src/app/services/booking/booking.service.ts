import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { BookingDTO } from '../../dtos/booking.dto';
import { BookingRequestDTO } from '../../dtos/bookingRequest.dto';

const BASE_URL = '/api/v1/bookings';

@Injectable({ providedIn: "root" })
export class BookingService {
  constructor(private httpClient: HttpClient) {}

  public getBookingsByUserId(userId: number, page: number = 0, pageSize: number = 10): Observable<BookingDTO[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.httpClient
      .get<BookingDTO[]>(`${BASE_URL}/user/${userId}`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getBookingsByApartmentId(apartmentId: number, page: number = 0, pageSize: number = 10): Observable<BookingDTO[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.httpClient
      .get<BookingDTO[]>(`${BASE_URL}/apartment/${apartmentId}`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public createBooking(booking: BookingRequestDTO): Observable<BookingDTO> {
    return this.httpClient
      .post<BookingDTO>(BASE_URL, booking)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public cancelBooking(bookingId: number): Observable<BookingDTO> {
    return this.httpClient
      .delete<BookingDTO>(`${BASE_URL}/${bookingId}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public updateBookingDates(
    bookingId: number,
    startDate: Date | string,
    endDate: Date | string
  ): Observable<BookingDTO> {
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];

    const params = new HttpParams()
      .set('startDate', start)
      .set('endDate', end);

    return this.httpClient
      .put<BookingDTO>(`${BASE_URL}/${bookingId}/dates`, null, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('HTTP Error:', error);
    return throwError(() => error);
  }
  
}