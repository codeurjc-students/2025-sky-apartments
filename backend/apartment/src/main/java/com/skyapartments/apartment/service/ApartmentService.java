package com.skyapartments.apartment.service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.skyapartments.apartment.dto.ApartmentDTO;
import com.skyapartments.apartment.dto.ApartmentRequestDTO;
import com.skyapartments.apartment.exception.BusinessValidationException;
import com.skyapartments.apartment.exception.ResourceNotFoundException;
import com.skyapartments.apartment.model.Apartment;
import com.skyapartments.apartment.repository.ApartmentRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import jakarta.transaction.Transactional;

@Service
public class ApartmentService {
    
    private final ApartmentRepository apartmentRepository;
    private final ImageService imageService;

    public ApartmentService (ApartmentRepository apartmentRepository, ImageService imageService) {
        this.apartmentRepository = apartmentRepository;
        this.imageService = imageService;
    }

    public Page<ApartmentDTO> getAllApartments(Pageable pageable) {
        return apartmentRepository.findAll(pageable).map(apto -> new ApartmentDTO(apto));
    }

    public ApartmentDTO getApartmentById (Long id) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found"));
        return new ApartmentDTO(apartment);
    }

    @Transactional
    public ApartmentDTO createApartment (ApartmentRequestDTO apartmentRequestDTO) {
        if (apartmentRepository.existsByName(apartmentRequestDTO.getName())) {
            throw new BusinessValidationException("An apartment with this name already exists");
        }

        Apartment apartment = new Apartment(apartmentRequestDTO);
        apartment = apartmentRepository.save(apartment);

        // Upload image
        if (apartmentRequestDTO.getImage() != null && !apartmentRequestDTO.getImage().isEmpty()) {
            try {
                String imageUrl = imageService.saveImage(apartmentRequestDTO.getImage(), apartment.getId());
                apartment.setImageUrl(imageUrl);
            } catch (Exception e) {
                throw new RuntimeException("Error uploading image: " + e.getMessage(), e);
            }
            
        }
        return new ApartmentDTO(apartmentRepository.save(apartment));
    }

    @Transactional
    public ApartmentDTO updateApartment(Long id, ApartmentRequestDTO apartmentRequestDTO) {

        Apartment apartment = apartmentRepository.findById(id)
            .orElseThrow(() -> new BusinessValidationException("Apartment not found with id " + id));

        apartment.setName(apartmentRequestDTO.getName());
        apartment.setDescription(apartmentRequestDTO.getDescription());
        apartment.setPrice(apartmentRequestDTO.getPrice());
        apartment.setCapacity(apartmentRequestDTO.getCapacity());
        apartment.setServices(apartmentRequestDTO.getServices());

        // Delete old image
        imageService.deleteImage(apartment.getImageUrl());
    
        apartment.setImageUrl(null);

        // Upload new images
        if (apartmentRequestDTO.getImage() != null) {
            try {
                String imageUrl = imageService.saveImage(apartmentRequestDTO.getImage(), apartment.getId());
                apartment.setImageUrl(imageUrl);
            } catch (Exception e) {
                    throw new RuntimeException("Error uploading image: " + e.getMessage(), e);
            }
        }
        return new ApartmentDTO(apartmentRepository.save(apartment));
    }

    public void deleteApartment(Long id) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found"));

        // Delete images from S3
        if (apartment.getImageUrl() != null) {
            imageService.deleteImage(apartment.getImageUrl());
        }
        apartmentRepository.deleteById(id);
    }
    
    public Page<ApartmentDTO> searchApartments(
            Set<String> services,
            int minCapacity,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        Set<Long> unavailable = Collections.emptySet();
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
        throw new BusinessValidationException("End date must be after start date");
        }
        if (startDate != null && endDate != null) {
            //TODO. Conect to Booking MS to get the apartments that are unavailable in that dates
        }

        int serviceCount = (services != null) ? services.size() : 0;

        return apartmentRepository.findAvailableWithOptionalFilters(
                    services,
                    serviceCount,
                    minCapacity,
                    unavailable.isEmpty() ? null : unavailable,
                    pageable
                )
                .map(ApartmentDTO::new);
    }

    public Set<String> getAllServices() {
        return apartmentRepository.findDistinctServices();
    }

    public Boolean checkAvailability (Long id, LocalDate startDate, LocalDate endDate) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found"));

        Set<Long> unavailable = Collections.emptySet();
        //TODO. Conect to Booking MS to get the apartments that are unavailable in that dates
        return !unavailable.contains(id);
    }

}
