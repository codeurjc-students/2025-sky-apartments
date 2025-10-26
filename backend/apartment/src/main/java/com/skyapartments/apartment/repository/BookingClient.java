package com.skyapartments.apartment.repository;

import java.time.LocalDate;
import java.util.Set;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.skyapartments.apartment.config.FeignTracingConfig;


@FeignClient(name = "booking", path = "/api/v1/bookings", configuration = FeignTracingConfig.class)
public interface BookingClient {

    @GetMapping("/unavailable")
    Set<Long> getUnavailableApartments(
        @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    );
}
