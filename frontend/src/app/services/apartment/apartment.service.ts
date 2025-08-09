import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { catchError, Observable, throwError } from 'rxjs';

const BASE_URL = "/api/apartments/";

@Injectable({ providedIn: 'root' })
export class ApartmentService {

  constructor(private http: HttpClient) {}

  public getApartments(): Observable<ApartmentDTO[]> {
    return this.http.get<ApartmentDTO[]>(BASE_URL);
  }

  public getApartmentById(id: number | string): Observable<ApartmentDTO> {
    return this.http.get<ApartmentDTO>(BASE_URL + id);
  }
}
