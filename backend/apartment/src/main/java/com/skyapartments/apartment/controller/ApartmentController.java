package com.skyapartments.apartment.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skyapartments.apartment.dto.ApartmentDTO;
import com.skyapartments.apartment.service.ApartmentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/apartments/")
public class ApartmentController {
    
    private final ApartmentService apartmentService;

    public ApartmentController(ApartmentService apartmentService) {
        this.apartmentService = apartmentService;
    }

    @Operation(summary = "Get all apartments")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of apartments returned"),
            @ApiResponse(responseCode = "204", description = "No apartments found", content = @Content)
    })
    @GetMapping("/")
    public ResponseEntity<List<ApartmentDTO>> getAllApartments() {
        List<ApartmentDTO> apartments = apartmentService.getAllApartments();

        if (apartments.isEmpty()) {
            return ResponseEntity.noContent().build(); // HTTP 204 No Content
        }

        return ResponseEntity.ok(apartments);
    }

    @Operation(summary = "Get apartment by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Apartment found"),
            @ApiResponse(responseCode = "404", description = "Apartment not found", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApartmentDTO> getApartments(@PathVariable Long id) {
        return apartmentService.getApartmentById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}