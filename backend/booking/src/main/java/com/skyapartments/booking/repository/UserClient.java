package com.skyapartments.booking.repository;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.skyapartments.booking.dto.UserDTO;

@FeignClient(name = "user", url = "http://localhost:8080/api/v1/users")
public interface UserClient {

    @GetMapping
    Long getUserIdByEmail(@RequestParam String email);

    @GetMapping("/email")
    UserDTO findByEmail(@RequestParam String email);
}
