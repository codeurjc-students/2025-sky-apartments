package com.skyapartments.apartment.repository;

import java.time.LocalDate;
import java.util.Set;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.skyapartments.apartment.config.FeignTracingConfig;


@FeignClient(name = "booking", path = "/api/v1/bookings", configuration = FeignTracingConfig.class)
public interface BookingClient {

    @GetMapping("/unavailable")
    Set<Long> getUnavailableApartments(
        @RequestParam("startDate") LocalDate startDate,
        @RequestParam("endDate") LocalDate endDate
    );
}
