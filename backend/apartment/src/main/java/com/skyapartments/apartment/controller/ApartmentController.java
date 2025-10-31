package com.skyapartments.apartment.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.skyapartments.apartment.dto.ApartmentDTO;
import com.skyapartments.apartment.dto.ApartmentRequestDTO;
import com.skyapartments.apartment.service.ApartmentService;

import jakarta.validation.Valid;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

import static org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;

@RestController
@RequestMapping("/api/v1/apartments")
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
    public ResponseEntity<List<ApartmentDTO>> getAllApartments(
        @Parameter(description = "Number of page. Default 0 (first page)") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Number of apartments per page") @RequestParam(defaultValue = "10") int pageSize) {
        
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<ApartmentDTO> apartments = apartmentService.getAllApartments(pageable);
        if (apartments.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(apartments.getContent());
    }

    @Operation(summary = "Get apartment by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Apartment found"),
            @ApiResponse(responseCode = "404", description = "Apartment not found", content = @Content),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApartmentDTO> getApartmentById(
            @Parameter(description = "ID of the apartment to retrieve", required = true)
            @PathVariable Long id) {

        ApartmentDTO apartment = apartmentService.getApartmentById(id);
        return ResponseEntity.ok(apartment);
    }

    @Operation(summary = "Create a new apartment")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Apartment created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content)
    })
    @PostMapping
    public ResponseEntity<ApartmentDTO> createApartment(
            @Parameter(description = "Apartment details", required = true)
            @Valid @ModelAttribute ApartmentRequestDTO apartmentRequestDTO) {   // @ModelAttribute to handle MultipartFile
        
        ApartmentDTO createdApartment = apartmentService.createApartment(apartmentRequestDTO);

        URI location = fromCurrentRequest().path("/{id}").buildAndExpand(createdApartment.getId()).toUri();
        return ResponseEntity.created(location).body(createdApartment);
    }

    @Operation(summary = "Update an apartment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Apartment updated successfully"),
            @ApiResponse(responseCode = "404", description = "Apartment not found", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApartmentDTO> updateApartment(
            @Parameter(description = "ID of the apartment to update", required = true)
            @PathVariable Long id,
            @Parameter(description = "Updated apartment details", required = true)
            @Valid @ModelAttribute ApartmentRequestDTO apartmentRequestDTO) {   // @ModelAttribute to handle MultipartFile

        ApartmentDTO updatedApartment = apartmentService.updateApartment(id, apartmentRequestDTO);
        return ResponseEntity.ok(updatedApartment);

    }

    @Operation(summary = "Delete an apartment")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Apartment deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Apartment not found", content = @Content),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApartment(
            @Parameter(description = "ID of the apartment to delete", required = true)
            @PathVariable Long id) {

        apartmentService.deleteApartment(id);
        return ResponseEntity.noContent().build();

    }

    @Operation(summary = "Search apartments with optional services")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search results returned successfully"),
            @ApiResponse(responseCode = "204", description = "No apartments found matching the criteria", content = @Content),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content)
    })
    @GetMapping("/search")
    public ResponseEntity<List<ApartmentDTO>> searchApartments(
            @Parameter(description = "Set of required services") @RequestParam(required = false) Set<String> services,
            @Parameter(description = "Minimum apartment capacity") @RequestParam(required = false) Integer minCapacity,
            @Parameter(description = "Start date for availability filter") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date for availability filter") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Number of page. Default 0 (first page)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of apartments per page") @RequestParam(defaultValue = "10") int pageSize) {
        
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<ApartmentDTO> apartments = apartmentService.searchApartments(
                services,
                minCapacity != null ? minCapacity : 0,
                startDate,
                endDate,
                pageable
        );
        if (apartments.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(apartments.getContent());
    }

    @Operation(summary = "Get all available services", description = "Returns a set of all possible apartment services")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Services returned successfully"),
            @ApiResponse(responseCode = "204", description = "No services found", content = @Content)
    })
    @GetMapping("/services")
    public ResponseEntity<Set<String>> getAllServices() {
        Set<String> services = apartmentService.getAllServices();
        if (services.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(services);
    }

    @Operation(summary = "Get availability for an apartment between two dates")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Availability returned successfully"),
            @ApiResponse(responseCode = "404", description = "Apartment not found", content = @Content),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content)
    })
    @GetMapping("/{id}/availability")
    public ResponseEntity<Boolean> checkAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        Boolean isAvailable = apartmentService.checkAvailability(id, startDate, endDate);
        return ResponseEntity.ok(isAvailable);

    }
}

