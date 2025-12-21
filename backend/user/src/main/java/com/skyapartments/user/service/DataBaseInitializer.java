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
        User user3 = new User("María", "García", "611234567", "maria.garcia@example.com", passwordEncoder.encode("Password@1234"), "USER");
        User user4 = new User("Carlos", "Rodríguez", "622345678", "carlos.rodriguez@example.com", passwordEncoder.encode("Password@1234"), "USER");
        User user5 = new User("Ana", "Martínez", "633456789", "ana.martinez@example.com", passwordEncoder.encode("Password@1234"), "USER");
        User user6 = new User("Pedro", "López", "644567890", "pedro.lopez@example.com", passwordEncoder.encode("Password@1234"), "USER");
        User user7 = new User("Laura", "Fernández", "655678901", "laura.fernandez@example.com", passwordEncoder.encode("Password@1234"), "USER");

        userRepository.save(user);
        userRepository.save(admin);
        userRepository.save(user3);
        userRepository.save(user4);
        userRepository.save(user5);
        userRepository.save(user6);
        userRepository.save(user7);
    }
}
