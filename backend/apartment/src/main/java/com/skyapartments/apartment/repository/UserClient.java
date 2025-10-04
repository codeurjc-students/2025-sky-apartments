package com.skyapartments.apartment.repository;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.skyapartments.apartment.dto.UserDTO;

@FeignClient(name = "user", path = "/api/v1/users")
public interface UserClient {
    @GetMapping("/email")
    UserDTO findByEmail(@RequestParam String email);
}

