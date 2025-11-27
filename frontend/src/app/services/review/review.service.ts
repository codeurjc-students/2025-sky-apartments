import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReviewRequestDTO } from '../../dtos/reviewRequest.dto';
import { ReviewDTO } from '../../dtos/review.dto';
import { UpdateReviewRequestDTO } from '../../dtos/updateReviewRequest.dto';


const BASE_URL = '/api/v1/reviews';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private httpClient: HttpClient) {}

  public createReview(review: ReviewRequestDTO): Observable<ReviewDTO> {
    return this.httpClient
      .post<ReviewDTO>(BASE_URL, review)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public updateReview(reviewId: number, updateRequest: UpdateReviewRequestDTO): Observable<ReviewDTO> {
    return this.httpClient
      .put<ReviewDTO>(`${BASE_URL}/${reviewId}`, updateRequest)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public deleteReview(reviewId: number): Observable<void> {
    return this.httpClient
      .delete<void>(`${BASE_URL}/${reviewId}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getReviewsByApartment(
    apartmentId: number,
    page: number = 0,
    pageSize: number = 10
  ): Observable<ReviewDTO[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.httpClient
      .get<ReviewDTO[]>(`${BASE_URL}/apartment/${apartmentId}`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public canUserReview(userId: number, apartmentId: number): Observable<boolean> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('apartmentId', apartmentId.toString());

    return this.httpClient
      .get<boolean>(`${BASE_URL}/can-review`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getApartmentRating(apartmentId: number): Observable<number> {
    return this.httpClient
      .get<number>(`${BASE_URL}/apartment/${apartmentId}/rating`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('ERROR in ReviewService:', error);
    return throwError(() => error);
  }

}