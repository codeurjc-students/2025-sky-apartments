import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { FilterDTO } from '../../dtos/filter.dto';
import { FiltersByDateResponseDTO } from '../../dtos/filterByDateResponse.dto';

const BASE_URL = '/api/v1/filters';

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  constructor(private http: HttpClient) {}

  public findAll(page: number = 0, pageSize: number = 10): Observable<FilterDTO[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<FilterDTO[]>(`${BASE_URL}`, { params })
          .pipe(catchError((error) => this.handleError(error)));
  }

  findById(id: number): Observable<FilterDTO> {
    return this.http.get<FilterDTO>(`${BASE_URL}/${id}`).pipe(catchError((error) => this.handleError(error)));
  }

  create(filter: FilterDTO): Observable<FilterDTO> {
    return this.http.post<FilterDTO>(BASE_URL, filter).pipe(catchError((error) => this.handleError(error)));
  }

  update(id: number, filter: FilterDTO): Observable<FilterDTO> {
    return this.http.put<FilterDTO>(`${BASE_URL}/${id}`, filter).pipe(catchError((error) => this.handleError(error)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${id}`).pipe(catchError((error) => this.handleError(error)));
  }

  getApplicableFilters(checkInDate: string, checkOutDate: string): Observable<FiltersByDateResponseDTO> {
    const params = new HttpParams()
      .set('checkIn', checkInDate)
      .set('checkOut', checkOutDate);
    return this.http.get<FiltersByDateResponseDTO>(`${BASE_URL}/applicable`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('ERROR en FilterService:', error);
    return throwError(() => error);
  }
}