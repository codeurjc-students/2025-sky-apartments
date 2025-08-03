package com.skyapartments.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skyapartments.backend.dto.ApartmentDTO;
import com.skyapartments.backend.service.ApartmentService;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/apartments")
public class ApartmentController {
    
    private final ApartmentService apartmentService;

    public ApartmentController(ApartmentService apartmentService) {
        this.apartmentService = apartmentService;
    }

    @GetMapping
    public ResponseEntity<List<ApartmentDTO>> getAllApartments() {
        List<ApartmentDTO> apartments = apartmentService.getAllApartments();

        if (apartments.isEmpty()) {
            return ResponseEntity.noContent().build(); // HTTP 204 No Content
        }

        return ResponseEntity.ok(apartments);
    }
    
}
