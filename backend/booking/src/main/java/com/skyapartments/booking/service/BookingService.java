package com.skyapartments.booking.service;

import org.springframework.stereotype.Service;

import com.skyapartments.booking.repository.BookingRepository;


@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    
    public BookingService(BookingRepository bookingRepository){
        this.bookingRepository = bookingRepository;
    } 
}
