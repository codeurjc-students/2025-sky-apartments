package com.skyapartments.user.service;

import org.springframework.stereotype.Service;

import com.skyapartments.user.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;


    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
