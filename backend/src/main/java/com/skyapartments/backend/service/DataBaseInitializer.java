package com.skyapartments.backend.service;

import org.springframework.stereotype.Service;

import com.skyapartments.backend.model.Apartment;
import com.skyapartments.backend.repository.ApartmentRepository;

import jakarta.annotation.PostConstruct;

@Service
public class DataBaseInitializer {
    
    private final ApartmentRepository apartmentRepository;

    public DataBaseInitializer(ApartmentRepository apartmentRepository) {
        this.apartmentRepository = apartmentRepository;
    }

    @PostConstruct
    public void initializeDatabase() {
        Apartment apto1 = new Apartment("City Center Loft", "Modern apartment in the heart of the city", "123 Main St, Madrid");
        Apartment apto2 = new Apartment ("Beach House", "Relaxing house near the beach", "456 Ocean Drive, Valencia");

        apartmentRepository.save(apto1);
        apartmentRepository.save(apto2);
    }
}
