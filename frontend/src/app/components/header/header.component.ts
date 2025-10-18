import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { LoginService } from '../../services/user/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isMenuOpen = false;

  get userInitials(): string {
    if (!this.loginService.currentUser()?.name) return 'U';
    
    const names = this.loginService.currentUser()?.name?.trim().split(' ') ?? ['U'];
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }

  constructor(
    public loginService: LoginService,
    private router: Router
  ) {
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onProfile() {
    this.router.navigate(['/profile'], { fragment: 'personal' });
  }

  onBookings() {
    this.router.navigate(['/profile'], { fragment: 'bookings' });
  }

  onBookingsDashboard() {
    this.router.navigate(['/profile'], { fragment: 'dashboard' });
  }

  onApartmentsManagement() {
    this.router.navigate(['/profile'], { fragment: 'apartments' });
  }

  onLogout() {
    this.loginService.logOut().subscribe({
      next: () => window.location.reload(),
      error: err => {
        console.error('Logout failed', err);
        const errorCode = err.status || 500;
        const errorMessage = err.error?.message || 'Logout failed';
        this.router.navigate(['/error'], {
          queryParams: {
            code: errorCode,
            message: errorMessage
          }
        });
      }
    });
  }

  onBook() {
    this.router.navigate(['/book-apartment']);
  }

  onLogin() {
    this.router.navigate(['/login']);
  }

  onSignUp() {
    this.router.navigate(['/signup']);
  }
}