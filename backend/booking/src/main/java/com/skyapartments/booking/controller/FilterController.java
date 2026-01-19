package com.skyapartments.booking.controller;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

import static org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.skyapartments.booking.dto.FilterDTO;
import com.skyapartments.booking.dto.FiltersByDateResponseDTO;
import com.skyapartments.booking.service.FilterService;

import io.swagger.v3.oas.annotations.Parameter;

@RestController
@RequestMapping("/api/v1/filters")
public class FilterController {
    private final FilterService filterService;

    public FilterController(FilterService filterService) {
        this.filterService = filterService;
    }
    
    @GetMapping
    public ResponseEntity<List<FilterDTO>> findAll(
        @Parameter(description = "Number of page. Default 0 (first page)") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Number of apartments per page") @RequestParam(defaultValue = "10") int pageSize
    ) {

        Pageable pageable = PageRequest.of(page, pageSize);

        Page<FilterDTO> filters = filterService.findAll(pageable);
        if (filters.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(filters.getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<FilterDTO> findById(@PathVariable Long id) {
        try {
            FilterDTO filter = filterService.findById(id);
            return ResponseEntity.ok(filter);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<?> create(@RequestBody FilterDTO filterDTO) {
        try {
            FilterDTO newFilter = filterService.create(filterDTO);

            URI location = fromCurrentRequest().path("/{id}").buildAndExpand(newFilter.getId()).toUri();
            return ResponseEntity.created(location).body(newFilter);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody FilterDTO filterDTO) {
        try {
            FilterDTO updatedFilter = filterService.update(id, filterDTO);
            return ResponseEntity.ok(updatedFilter);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            filterService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/applicable")
    public ResponseEntity<?> getApplicableFilters(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        
        // Validations
        if (checkIn.isAfter(checkOut) || checkIn.isEqual(checkOut)) {
            return ResponseEntity.badRequest()
                .body("Check-in date must be before check-out date");
        }
        
        if (checkIn.isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest()
                .body("Check-in date cannot be in the past");
        }
        
        FiltersByDateResponseDTO response = filterService.getApplicableFiltersByDate(checkIn, checkOut);
        return ResponseEntity.ok(response);
    }
}
