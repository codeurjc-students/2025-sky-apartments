import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { ApartmentRequestDTO } from '../../dtos/apartmentRequest.dto';

const BASE_URL = '/api/v1/apartments';

@Injectable({ providedIn: 'root' })
export class ApartmentService {
  constructor(private httpClient: HttpClient) {}

  public getAllApartments(page: number = 0, pageSize: number = 10): Observable<ApartmentDTO[]> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.httpClient
      .get<ApartmentDTO[]>(`${BASE_URL}/`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getApartmentById(id: number): Observable<ApartmentDTO> {
    return this.httpClient
      .get<ApartmentDTO>(`${BASE_URL}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public createApartment(apartment: ApartmentRequestDTO): Observable<ApartmentDTO> {
    const formData = this.buildFormData(apartment);
    return this.httpClient
      .post<ApartmentDTO>(BASE_URL, formData)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public updateApartment(id: number, apartment: ApartmentRequestDTO): Observable<ApartmentDTO> {
    const formData = this.buildFormData(apartment);
    return this.httpClient
      .put<ApartmentDTO>(`${BASE_URL}/${id}`, formData)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public deleteApartment(id: number): Observable<void> {
    return this.httpClient
      .delete<void>(`${BASE_URL}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public searchApartments(options: {
    services?: string[];
    minCapacity?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Observable<ApartmentDTO[]> {
    let params = new HttpParams();

    if (options.services) {
      options.services.forEach((s) => (params = params.append('services', s)));
    }
    if (options.minCapacity) params = params.set('minCapacity', options.minCapacity);
    if (options.startDate) params = params.set('startDate', options.startDate);
    if (options.endDate) params = params.set('endDate', options.endDate);

    params = params
      .set('page', options.page ?? 0)
      .set('pageSize', options.pageSize ?? 10);

    return this.httpClient
      .get<ApartmentDTO[]>(`${BASE_URL}/search`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getAllServices(): Observable<string[]> {
    return this.httpClient
      .get<string[]>(`${BASE_URL}/services`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public checkAvailability(
    id: number,
    startDate: string,
    endDate: string
  ): Observable<boolean> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.httpClient
      .get<boolean>(`${BASE_URL}/${id}/availability`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private buildFormData(dto: ApartmentRequestDTO): FormData {
    const formData = new FormData();
    formData.append('name', dto.name);
    formData.append('description', dto.description);
    formData.append('price', dto.price.toString());
    formData.append('capacity', dto.capacity.toString());

    if (dto.services) {
      dto.services.forEach((service) => formData.append('services', String(service)));
    }
    
    if (dto.images && dto.images.length > 0) {
      dto.images.forEach((image) => formData.append('images', image));
    }
    
    return formData;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('ERROR en ApartmentService:', error);
    return throwError(() => error);
  }
}
