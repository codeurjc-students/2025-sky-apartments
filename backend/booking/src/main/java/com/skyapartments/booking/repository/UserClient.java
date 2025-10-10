package com.skyapartments.booking.repository;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.skyapartments.booking.config.FeignTracingConfig;
import com.skyapartments.booking.dto.UserDTO;

@FeignClient(name = "user", path = "/api/v1/users", configuration = FeignTracingConfig.class)
public interface UserClient {

    @GetMapping
    Long getUserIdByEmail(@RequestParam String email);

    @GetMapping("/email")
    UserDTO findByEmail(@RequestParam String email);
}
