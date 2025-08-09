import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { ApartmentService } from '../../services/apartment/apartment.service';


@Component({
  imports: [CommonModule],
  templateUrl: './apartment-detail.component.html'
})
export class ApartmentDetailComponent implements OnInit {
  apartment?: ApartmentDTO;

  constructor(
    private route: ActivatedRoute,
    private apartmentService: ApartmentService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params["id"];
    this.apartmentService.getApartmentById(id).subscribe({
      next: (data) => this.apartment = data,
      error: (err) => console.error(err)
    });
  }
}
