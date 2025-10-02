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
        bookingRepository.save(new Booking(
            1L,
            1L,
            LocalDate.of(2025, 1, 10),
            LocalDate.of(2025, 1, 15),
            new BigDecimal("500.00"),
            2
        ));

        bookingRepository.save(new Booking(
            2L,
            1L,
            LocalDate.of(2025, 2, 5),
            LocalDate.of(2025, 2, 12),
            new BigDecimal("750.00"),
            4
        ));

        bookingRepository.save(new Booking(
            3L,
            3L,
            LocalDate.of(2025, 3, 20),
            LocalDate.of(2025, 3, 22),
            new BigDecimal("200.00"),
            1
        ));

        bookingRepository.save(new Booking(
            1L,
            4L,
            LocalDate.of(2025, 4, 1),
            LocalDate.of(2025, 4, 10),
            new BigDecimal("1200.00"),
            3
        ));

        bookingRepository.save(new Booking(
            1L,
            5L,
            LocalDate.of(2025, 5, 15),
            LocalDate.of(2025, 5, 18),
            new BigDecimal("400.00"),
            2
        ));

    }
}

