package com.skyapartments.booking.service;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.skyapartments.booking.model.Booking;
import com.skyapartments.booking.repository.BookingRepository;

import jakarta.annotation.PostConstruct;


@Component
public class DataBaseInitializer {
    
    private final BookingRepository bookingRepository;

    public DataBaseInitializer(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @PostConstruct
    public void initializeDatabase() throws Exception {
        bookingRepository.save(new Booking(1L, 1L, LocalDate.of(2025, 1, 10), LocalDate.of(2025, 1, 15), new BigDecimal("500.00"), 2));
        bookingRepository.save(new Booking(2L, 1L, LocalDate.of(2025, 2, 5), LocalDate.of(2025, 2, 12), new BigDecimal("750.00"), 4));
        bookingRepository.save(new Booking(3L, 3L, LocalDate.of(2025, 3, 20), LocalDate.of(2025, 3, 22), new BigDecimal("200.00"), 1));
        bookingRepository.save(new Booking(1L, 4L, LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 10), new BigDecimal("1200.00"), 3));
        bookingRepository.save(new Booking(1L, 5L, LocalDate.of(2025, 11, 15), LocalDate.of(2025, 11, 18), new BigDecimal("400.00"), 2));

        bookingRepository.save(new Booking(3L, 2L, LocalDate.of(2025, 1, 20), LocalDate.of(2025, 1, 25), new BigDecimal("600.00"), 3));
        bookingRepository.save(new Booking(4L, 6L, LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 7), new BigDecimal("850.00"), 2));
        bookingRepository.save(new Booking(5L, 7L, LocalDate.of(2025, 2, 14), LocalDate.of(2025, 2, 21), new BigDecimal("900.00"), 4));
        bookingRepository.save(new Booking(6L, 8L, LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 5), new BigDecimal("450.00"), 2));
        bookingRepository.save(new Booking(7L, 9L, LocalDate.of(2025, 3, 10), LocalDate.of(2025, 3, 17), new BigDecimal("1100.00"), 3));
        
        bookingRepository.save(new Booking(1L, 10L, LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 20), new BigDecimal("700.00"), 2));
        bookingRepository.save(new Booking(2L, 2L, LocalDate.of(2025, 5, 1), LocalDate.of(2025, 5, 8), new BigDecimal("950.00"), 4));
        bookingRepository.save(new Booking(3L, 4L, LocalDate.of(2025, 5, 10), LocalDate.of(2025, 5, 15), new BigDecimal("650.00"), 3));
        bookingRepository.save(new Booking(4L, 1L, LocalDate.of(2025, 6, 1), LocalDate.of(2025, 6, 10), new BigDecimal("1300.00"), 5));
        bookingRepository.save(new Booking(5L, 3L, LocalDate.of(2025, 6, 15), LocalDate.of(2025, 6, 22), new BigDecimal("1000.00"), 4));
        
        bookingRepository.save(new Booking(6L, 5L, LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 10), new BigDecimal("1400.00"), 5));
        bookingRepository.save(new Booking(7L, 6L, LocalDate.of(2025, 7, 15), LocalDate.of(2025, 7, 22), new BigDecimal("1100.00"), 3));
        bookingRepository.save(new Booking(1L, 7L, LocalDate.of(2025, 8, 1), LocalDate.of(2025, 8, 7), new BigDecimal("900.00"), 2));
        bookingRepository.save(new Booking(2L, 8L, LocalDate.of(2025, 8, 10), LocalDate.of(2025, 8, 20), new BigDecimal("1500.00"), 4));
        bookingRepository.save(new Booking(3L, 9L, LocalDate.of(2025, 8, 25), LocalDate.of(2025, 8, 30), new BigDecimal("750.00"), 2));
        
        bookingRepository.save(new Booking(4L, 10L, LocalDate.of(2025, 9, 1), LocalDate.of(2025, 9, 5), new BigDecimal("550.00"), 2));
        bookingRepository.save(new Booking(5L, 1L, LocalDate.of(2025, 9, 10), LocalDate.of(2025, 9, 17), new BigDecimal("1050.00"), 3));
        bookingRepository.save(new Booking(6L, 2L, LocalDate.of(2025, 9, 20), LocalDate.of(2025, 9, 27), new BigDecimal("950.00"), 3));
        bookingRepository.save(new Booking(7L, 3L, LocalDate.of(2025, 10, 1), LocalDate.of(2025, 10, 8), new BigDecimal("1100.00"), 4));
        bookingRepository.save(new Booking(1L, 4L, LocalDate.of(2025, 10, 12), LocalDate.of(2025, 10, 19), new BigDecimal("1000.00"), 3));
        
        bookingRepository.save(new Booking(2L, 5L, LocalDate.of(2025, 10, 22), LocalDate.of(2025, 10, 29), new BigDecimal("950.00"), 2));
        bookingRepository.save(new Booking(3L, 6L, LocalDate.of(2025, 11, 1), LocalDate.of(2025, 11, 7), new BigDecimal("850.00"), 3));
        bookingRepository.save(new Booking(4L, 7L, LocalDate.of(2025, 11, 10), LocalDate.of(2025, 11, 14), new BigDecimal("600.00"), 2));
        bookingRepository.save(new Booking(5L, 8L, LocalDate.of(2025, 11, 20), LocalDate.of(2025, 11, 25), new BigDecimal("700.00"), 2));
        bookingRepository.save(new Booking(6L, 9L, LocalDate.of(2025, 12, 1), LocalDate.of(2025, 12, 7), new BigDecimal("900.00"), 3));
        
        bookingRepository.save(new Booking(7L, 10L, LocalDate.of(2025, 12, 10), LocalDate.of(2025, 12, 17), new BigDecimal("1100.00"), 4));
        bookingRepository.save(new Booking(1L, 1L, LocalDate.of(2025, 12, 20), LocalDate.of(2025, 12, 27), new BigDecimal("1300.00"), 5));
        bookingRepository.save(new Booking(2L, 3L, LocalDate.of(2025, 5, 20), LocalDate.of(2025, 5, 25), new BigDecimal("650.00"), 2));
        bookingRepository.save(new Booking(3L, 7L, LocalDate.of(2025, 6, 5), LocalDate.of(2025, 6, 10), new BigDecimal("700.00"), 3));
        bookingRepository.save(new Booking(4L, 2L, LocalDate.of(2025, 7, 25), LocalDate.of(2025, 7, 31), new BigDecimal("850.00"), 2));

    }
}

