package com.skyapartments.user.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.skyapartments.user.model.User;
import com.skyapartments.user.repository.UserRepository;

import jakarta.annotation.PostConstruct;

@Component
public class DataBaseInitializer {
    
    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    public DataBaseInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void initializeDatabase() {
        User user = new User("Juan", "Pérez", "600123456", "user@example.com", passwordEncoder.encode("Password@1234"),"USER");
        User admin = new User("Leire", "Sánchez", "600123456", "admin@example.com", passwordEncoder.encode("Password@1234"),"ADMIN");

        userRepository.save(user);
        userRepository.save(admin);
    }
}
