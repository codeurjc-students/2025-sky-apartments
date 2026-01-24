package com.skyapartments.review.repository;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.skyapartments.review.config.FeignTracingConfig;
import com.skyapartments.review.dto.BookingDTO;


@FeignClient(name = "booking", path = "/api/v1/bookings/private", configuration = FeignTracingConfig.class)
public interface BookingClient {
    
    @GetMapping("/active/user/{userId}/apartment/{apartmentId}")
    List<BookingDTO> getActiveBookingsByUserAndApartment(@PathVariable("userId") Long userId, @PathVariable("apartmentId") Long apartmentId);
}

