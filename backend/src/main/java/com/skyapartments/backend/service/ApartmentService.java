package com.skyapartments.backend.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.skyapartments.backend.dto.ApartmentDTO;
import com.skyapartments.backend.repository.ApartmentRepository;

@Service
public class ApartmentService {
    
    private final ApartmentRepository apartmentRepository;

    public ApartmentService (ApartmentRepository apartmentRepository) {
        this.apartmentRepository = apartmentRepository;
    }

    public List<ApartmentDTO> getAllApartments() {
        return apartmentRepository.findAll().stream()
            .map(apto -> new ApartmentDTO(apto)).collect(Collectors.toList());
    }

    public Optional<ApartmentDTO> getApartmentById (Long id) {
        return apartmentRepository.findById(id)
            .map(apto -> new ApartmentDTO(apto));
    }
}
