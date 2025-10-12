import { Routes } from '@angular/router';
import { ApartmentListComponent } from './components/apartmentList/apartment-list.component';
import { ApartmentDetailComponent } from './components/apartmentDetail/apartment-detail.component';
import { LoginComponent } from './components/login/login.component';
import { SignUpComponent } from './components/signup/signup.component';
import { HomeComponent } from './components/home/home.component';
import { ErrorComponent } from './components/error/error.component';
import { BookingConfirmationComponent } from './components/booking-confirmation/booking-confirmation.component';
import { authGuard } from '../auth.guard';

export const routes: Routes = [
    { path: '',                 component: HomeComponent},
    { path: 'apartment/:id',    component: ApartmentDetailComponent },
    { path: 'apartments',       component: ApartmentListComponent },
    { path: 'login',            component: LoginComponent },
    { path: 'signup',           component: SignUpComponent },
    { path: 'booking',          component: BookingConfirmationComponent, canActivate: [authGuard] },
    { path: 'error',            component: ErrorComponent },
    { path: 'home', redirectTo: '', pathMatch: 'full' },
    { path: '**', redirectTo: '/error' },
];
