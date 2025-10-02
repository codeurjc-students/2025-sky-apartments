package com.skyapartments.apartment.repository;

import java.time.LocalDate;
import java.util.Set;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;



@FeignClient(name = "booking", url = "http://localhost:8082/api/v1/bookings")
public interface BookingClient {

    @GetMapping("/unavailable")
    Set<Long> getUnavailableApartments(
        @RequestParam("startDate") LocalDate startDate,
        @RequestParam("endDate") LocalDate endDate
    );
}
