package com.skyapartments.review.repository;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.skyapartments.review.config.FeignTracingConfig;
import com.skyapartments.review.dto.ApartmentDTO;


@FeignClient(name = "apartment", path = "/api/v1/apartments", configuration = FeignTracingConfig.class)
public interface ApartmentClient {
    @GetMapping("/{id}")
    ApartmentDTO getApartment(@PathVariable("id") Long apartmentId);
}
