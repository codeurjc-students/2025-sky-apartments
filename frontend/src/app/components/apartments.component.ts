import { Component, OnInit } from "@angular/core";
import { ApartmentDTO } from "../dtos/apartment.dto";
import { ApartmentService } from "../services/apartment.service";
import { NgForOf, NgIf } from "@angular/common";
import { RouterModule } from "@angular/router"

@Component({
    imports: [NgIf, NgForOf, RouterModule],
    templateUrl: './apartments.component.html'
})
export class ApartmentsComponent implements OnInit{
    apartments: ApartmentDTO[] = [];

    constructor (private apartmentService: ApartmentService) {}

    ngOnInit(): void {
    this.apartmentService.getApartments().subscribe({
      next: (data) => this.apartments = data,
      error: (err) => console.error(err)
    });
  }
}