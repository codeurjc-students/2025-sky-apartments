package com.skyapartments.booking.repository;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.skyapartments.booking.dto.ApartmentDTO;

@FeignClient(name = "apartment", path = "http://localhost:8083/api/v1/apartments")
public interface ApartmentClient {
    @GetMapping("/{id}")
    ApartmentDTO getApartment(@PathVariable("id") Long apartmentId);
}
