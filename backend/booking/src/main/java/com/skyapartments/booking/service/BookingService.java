package com.skyapartments.booking.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.skyapartments.booking.dto.BookingDTO;
import com.skyapartments.booking.dto.BookingRequestDTO;
import com.skyapartments.booking.exception.BusinessValidationException;
import com.skyapartments.booking.exception.ResourceNotFoundException;
import com.skyapartments.booking.model.Booking;
import com.skyapartments.booking.model.BookingState;
import com.skyapartments.booking.repository.BookingRepository;

import jakarta.transaction.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;

    public BookingService(BookingRepository bookingRepository){
        this.bookingRepository = bookingRepository;
    } 

    public Page<BookingDTO> getBookingsByUserId(Long userId, Pageable pageable, String userEmail) {
        return bookingRepository.findByUserIdOrderByStartDateDesc(userId, pageable).map(booking -> new BookingDTO(booking));
    }

    public Page<BookingDTO> getBookingsByApartmentId(Long apartmentId, Pageable pageable) {
        return bookingRepository.findByApartmentIdOrderByStartDateDesc(apartmentId, pageable).map(booking -> new BookingDTO(booking));
    }

    public BookingDTO createBooking (BookingRequestDTO request, String userEmail) {
        

        Booking booking = new Booking();
        booking.setUserId(request.getUserId());
        booking.setApartmentId(request.getApartmentId());
        booking.setStartDate(request.getStartDate());
        booking.setEndDate(request.getEndDate());
        booking.setState(BookingState.CONFIRMED);
        booking.setGuests(request.getGuests());

        //TODO: booking.setCost();
        booking.setCost(BigDecimal.valueOf(100));   //Delete when conection to Apartment MS
        return new BookingDTO(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDTO cancelBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getState() == BookingState.CANCELLED) {
            throw new BusinessValidationException("Booking is already cancelled");
        }

        booking.setState(BookingState.CANCELLED);
        bookingRepository.save(booking);

        return new BookingDTO(booking);
    }

    @Transactional
    public BookingDTO updateBookingDates(Long bookingId, LocalDate newStartDate, LocalDate newEndDate, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getState() == BookingState.CANCELLED) {
            throw new BusinessValidationException("Cannot modify a cancelled booking");
        }

        if (newEndDate.isBefore(newStartDate)) {
            throw new BusinessValidationException("End date must be after start date");
        }

        // (Optional) Check availability for the apartment again before updating
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
        
        //TODO: booking.setCost();
        booking.setCost(BigDecimal.valueOf(100));   //Delete when conection to Apartment MS

        bookingRepository.save(booking);

        return new BookingDTO(booking);
    }

    public Set<Long> getUnavailableApartments(LocalDate startDate, LocalDate endDate) {
        return bookingRepository.findUnavailableApartments(startDate, endDate);
    }
}

