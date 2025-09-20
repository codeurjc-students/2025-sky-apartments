package com.skyapartments.apartment.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.skyapartments.apartment.dto.ApartmentDTO;
import com.skyapartments.apartment.repository.ApartmentRepository;


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
