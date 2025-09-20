package com.skyapartments.apartment.integration;

import com.skyapartments.apartment.dto.ApartmentDTO;
import com.skyapartments.apartment.model.Apartment;
import com.skyapartments.apartment.repository.ApartmentRepository;
import com.skyapartments.apartment.service.ApartmentService;
import com.skyapartments.apartment.testutils.AbstractMySQLTest;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ApartmentServiceIntegrationTest extends AbstractMySQLTest {

    @Autowired
    private ApartmentRepository apartmentRepository;

    private ApartmentService apartmentService;

    private Apartment savedApartment;

    @BeforeEach
    void setUp() {
        apartmentRepository.deleteAll();
        apartmentService = new ApartmentService(apartmentRepository);

        savedApartment = apartmentRepository.save(
            new Apartment("Test Apartment 1", "Nice view", "123 Fake St")
        );
    }

    @Test
    void shouldReturnAllApartments() {
        List<ApartmentDTO> apartments = apartmentService.getAllApartments();

        assertThat(apartments).hasSize(1);
        assertThat(apartments.get(0).getName()).isEqualTo("Test Apartment 1");
        assertThat(apartments.get(0).getDescription()).isEqualTo("Nice view");
        assertThat(apartments.get(0).getAddress()).isEqualTo("123 Fake St");
    }

    @Test
    void shouldReturnApartmentById() {
        Optional<ApartmentDTO> apartmentOpt = apartmentService.getApartmentById(savedApartment.getId());

        assertThat(apartmentOpt).isPresent();
        ApartmentDTO apartment = apartmentOpt.get();
        assertThat(apartment.getName()).isEqualTo("Test Apartment 1");
        assertThat(apartment.getDescription()).isEqualTo("Nice view");
        assertThat(apartment.getAddress()).isEqualTo("123 Fake St");
    }

    @Test
    void shouldReturnEmptyWhenApartmentNotFound() {
        Optional<ApartmentDTO> apartmentOpt = apartmentService.getApartmentById(9999L);

        assertThat(apartmentOpt).isNotPresent();
    }
}
