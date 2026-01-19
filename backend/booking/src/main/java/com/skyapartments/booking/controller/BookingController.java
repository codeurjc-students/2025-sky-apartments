package com.skyapartments.booking.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import java.net.URI;

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

import com.skyapartments.booking.dto.BookingDTO;
import com.skyapartments.booking.dto.BookingRequestDTO;
import com.skyapartments.booking.service.BookingService;

import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController (BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingDTO>> getBookingsByUserId(
        @PathVariable Long userId,
        @Parameter(description = "Number of page. Default 0 (first page)") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Number of apartments per page") @RequestParam(defaultValue = "10") int pageSize,
        HttpServletRequest request) {

        String userEmail = request.getUserPrincipal().getName();
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<BookingDTO> bookings = bookingService.getBookingsByUserId(userId, pageable, userEmail);
        
        if (bookings.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(bookings.getContent());
    }

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<List<BookingDTO>> getBookingsByApartmentId(
        @PathVariable Long apartmentId,
        @Parameter(description = "Number of page. Default 0 (first page)") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Number of apartments per page") @RequestParam(defaultValue = "10") int pageSize) {
        
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<BookingDTO> bookings = bookingService.getBookingsByApartmentId(apartmentId, pageable);
        if (bookings.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(bookings.getContent());
    }

    @PostMapping
    public ResponseEntity<BookingDTO> createBooking(@Valid @RequestBody BookingRequestDTO booking, HttpServletRequest request) {
        String userEmail = request.getUserPrincipal().getName();
        BookingDTO newBooking = bookingService.createBooking(booking, userEmail);

        URI location = fromCurrentRequest().path("/{id}").buildAndExpand(newBooking.getId()).toUri();

        return ResponseEntity.created(location).body(newBooking);
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<BookingDTO> cancelBooking(@PathVariable Long bookingId, HttpServletRequest request) {
        String userEmail = request.getUserPrincipal().getName();
        BookingDTO cancelledBooking = bookingService.cancelBooking(bookingId, userEmail);
        return ResponseEntity.ok(cancelledBooking);
    }

    @PutMapping("/{bookingId}/dates")
    public ResponseEntity<BookingDTO> updateBookingDates(
            @PathVariable Long bookingId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest request) {
        
        String userEmail = request.getUserPrincipal().getName();
        BookingDTO updatedBooking = bookingService.updateBookingDates(bookingId, startDate, endDate, userEmail);
        return ResponseEntity.ok(updatedBooking);
    }

    @GetMapping("/private/unavailable")
    @Hidden
    public Set<Long> findUnavailableApartments(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate
    ) {
        return bookingService.getUnavailableApartments(startDate, endDate);
    }

    @Hidden
    @GetMapping("/private/active/user/{userId}/apartment/{apartmentId}")
    public ResponseEntity<List<BookingDTO>> getActiveBookingsByUserAndApartment(
            @PathVariable Long userId,
            @PathVariable Long apartmentId
    ) {
        List<BookingDTO> bookings = bookingService.getActiveBookingsByUserAndApartment(userId, apartmentId);
        if (bookings.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(bookings);
    }

    @Hidden
    @GetMapping("/private/apartment/{apartmentId}")
    public ResponseEntity<Boolean> hasBookigs (@PathVariable Long apartmentId) {
        Boolean hasBookings = bookingService.hasBookings(apartmentId);
        return ResponseEntity.ok(hasBookings);
    }
    
}

