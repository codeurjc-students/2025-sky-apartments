import { Routes } from '@angular/router';
import { ApartmentsComponent } from './components/apartmentList/apartments.component';
import { ApartmentDetailComponent } from './components/apartmentDetail/apartment-detail.component';

export const routes: Routes = [
    { path: '',                 component: ApartmentsComponent },
    { path: 'apartments/:id',   component: ApartmentDetailComponent }
];
