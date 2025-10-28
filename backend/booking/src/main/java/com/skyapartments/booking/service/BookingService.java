package com.skyapartments.booking.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.skyapartments.booking.dto.ApartmentDTO;
import com.skyapartments.booking.dto.BookingDTO;
import com.skyapartments.booking.dto.BookingRequestDTO;
import com.skyapartments.booking.exception.BusinessValidationException;
import com.skyapartments.booking.exception.ResourceNotFoundException;
import com.skyapartments.booking.model.Booking;
import com.skyapartments.booking.model.BookingState;
import com.skyapartments.booking.repository.ApartmentClient;
import com.skyapartments.booking.repository.BookingRepository;
import com.skyapartments.booking.repository.UserClient;

import jakarta.transaction.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserClient userClient;
    private final ApartmentClient apartmentClient;

    public BookingService(BookingRepository bookingRepository, UserClient userClient, ApartmentClient apartmentClient){
        this.bookingRepository = bookingRepository;
        this.userClient = userClient;
        this.apartmentClient = apartmentClient;
    } 

    public Page<BookingDTO> getBookingsByUserId(Long userId, Pageable pageable, String userEmail) {
        Long userIdFromEmail = userClient.getUserIdByEmail(userEmail);
        if (!userIdFromEmail.equals(userId)) {
            throw new SecurityException("User email does not match user ID");
        }
        return bookingRepository.findByUserIdOrderByStartDateDesc(userId, pageable).map(booking -> new BookingDTO(booking));
    }

    public Page<BookingDTO> getBookingsByApartmentId(Long apartmentId, Pageable pageable) {
        if (apartmentClient.getApartment(apartmentId) == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return bookingRepository.findByApartmentIdOrderByStartDateDesc(apartmentId, pageable).map(booking -> new BookingDTO(booking));
    }

    @Transactional
    public BookingDTO createBooking (BookingRequestDTO request, String userEmail) {
        Long userId = userClient.getUserIdByEmail(userEmail);
        if (!request.getUserId().equals(userId)) {
            throw new SecurityException("User email does not match user ID");
        }
        ApartmentDTO apartment = apartmentClient.getApartment(request.getApartmentId());
        if (apartment == null) {
            throw new ResourceNotFoundException("Apartment not found");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessValidationException("End date must be after start date");
        }
        if (request.getEndDate().isBefore(LocalDate.now())) {
            throw new BusinessValidationException("End date must be after today");
        }
        // Check for overlapping bookings
        boolean overlaps = bookingRepository.findByApartmentIdAndStateNot(
                        request.getApartmentId(), BookingState.CANCELLED)
                .stream()
                .anyMatch(b -> !request.getStartDate().isAfter(b.getEndDate()) && !request.getEndDate().isBefore(b.getStartDate()));
        if (overlaps) {
            throw new BusinessValidationException("The apartment is not available for the selected dates");
        }

        Booking booking = new Booking();
        booking.setUserId(request.getUserId());
        booking.setApartmentId(request.getApartmentId());
        booking.setStartDate(request.getStartDate());
        booking.setEndDate(request.getEndDate());
        booking.setState(BookingState.CONFIRMED);
        booking.setCost(calculateCost(apartment, request.getStartDate(), request.getEndDate()));
        booking.setGuests(request.getGuests());
        return new BookingDTO(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDTO cancelBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        Long userId = userClient.getUserIdByEmail(userEmail);
        if (!booking.getUserId().equals(userId)) {
            throw new SecurityException("User email does not match booking owner");
        }

        if (booking.getState() == BookingState.CANCELLED) {
            throw new BusinessValidationException("Booking is already cancelled");
        }

        booking.setState(BookingState.CANCELLED);
        bookingRepository.save(booking);

        return new BookingDTO(booking);
    }

    private BigDecimal calculateCost(ApartmentDTO apartment, LocalDate startDate, LocalDate endDate) {
        long days = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
        return apartment.getPrice().multiply(BigDecimal.valueOf(days));
    }

    @Transactional
    public BookingDTO updateBookingDates(Long bookingId, LocalDate newStartDate, LocalDate newEndDate, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        Long userId = userClient.getUserIdByEmail(userEmail);
        if (!booking.getUserId().equals(userId)) {
            throw new SecurityException("User email does not match booking owner");
        }
        if (booking.getState() == BookingState.CANCELLED) {
            throw new BusinessValidationException("Cannot modify a cancelled booking");
        }

        if (booking.getState() == BookingState.COMPLETED) {
            throw new BusinessValidationException("Cannot modify a completed booking");
        }

        if (newEndDate.isBefore(newStartDate)) {
            throw new BusinessValidationException("End date must be after start date");
        }

        ApartmentDTO apartment = apartmentClient.getApartment(booking.getApartmentId());
        if (apartment == null) {
            throw new ResourceNotFoundException("Apartment not found");
        }

        // Check availability for the apartment again before updating
        boolean overlaps = bookingRepository.findByApartmentIdAndStateNot(
                        booking.getApartmentId(), BookingState.CANCELLED)
                .stream()
                .filter(b -> !b.getId().equals(bookingId)) // ignore current booking
                .anyMatch(b -> !newStartDate.isAfter(b.getEndDate()) && !newEndDate.isBefore(b.getStartDate()));

        if (overlaps) {
            throw new BusinessValidationException("The apartment is not available for the selected dates");
        }

        booking.setStartDate(newStartDate);
        booking.setEndDate(newEndDate);
        booking.setCost(calculateCost(apartment, newStartDate, newEndDate));
        bookingRepository.save(booking);

        return new BookingDTO(booking);
    }

    public Set<Long> getUnavailableApartments(LocalDate startDate, LocalDate endDate) {
        return bookingRepository.findUnavailableApartments(startDate, endDate);
    }

    @Scheduled(cron = "0 0 0 * * *") //Everyday at midnight
    @Transactional
    public void markCompletedBookings() {
        LocalDate today = LocalDate.now();
        List<Booking> pastBookings = bookingRepository.findByEndDateBeforeAndState(today, BookingState.CONFIRMED);
        for (Booking booking : pastBookings) {
            booking.setState(BookingState.COMPLETED);
        }
        bookingRepository.saveAll(pastBookings);
    }
}
