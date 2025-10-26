import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-error',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent implements OnInit {
  errorMessage = 'Something went wrong';
  errorCode = 500;
  errorDescription = 'An unexpected error occurred. Please try again later.';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.errorMessage = params['message'];
      }
      if (params['code']) {
        this.errorCode = Number(params['code']);
        this.setErrorDescription(this.errorCode);
      }
    });
  }

  setErrorDescription(code: number) {
    switch (code) {
      case 404:
        this.errorDescription = 'The page or resource you are looking for could not be found.';
        break;
      case 403:
        this.errorDescription = 'You do not have permission to access this resource.';
        break;
      case 500:
        this.errorDescription = 'An internal server error occurred. Please try again later.';
        break;
      case 503:
        this.errorDescription = 'The service is temporarily unavailable. Please try again later.';
        break;
      case 401:
        this.errorDescription = 'You are not authorized to view this page. Please log in.';
        break;
      default:
        this.errorDescription = 'An unexpected error occurred. Please try again later.';
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goBack() {
    window.history.back();
  }
}