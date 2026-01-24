package com.skyapartments.review.repository;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.skyapartments.review.config.FeignTracingConfig;
import com.skyapartments.review.dto.UserDTO;



@FeignClient(name = "user", path = "/api/v1/users/private", configuration = FeignTracingConfig.class)
public interface UserClient {

    @GetMapping("/{id}")
    UserDTO getUser(@PathVariable("id") Long userId);

    @GetMapping
    Long getUserIdByEmail(@RequestParam String email);

    @GetMapping("/email")
    UserDTO findByEmail(@RequestParam String email);
}