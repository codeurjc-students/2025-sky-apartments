package com.skyapartments.booking.repository;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.skyapartments.booking.config.FeignTracingConfig;
import com.skyapartments.booking.dto.UserDTO;

@FeignClient(name = "user", path = "/api/v1/users/private", configuration = FeignTracingConfig.class)
public interface UserClient {

    @GetMapping
    Long getUserIdByEmail(@RequestParam String email);

    @GetMapping("/email")
    UserDTO findByEmail(@RequestParam String email);

    @GetMapping("/{id}")
    UserDTO getUser(@PathVariable("id") Long userId);
}
