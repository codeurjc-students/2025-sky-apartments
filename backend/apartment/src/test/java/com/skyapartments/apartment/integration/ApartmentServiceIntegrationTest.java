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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ApartmentServiceIntegrationTest extends AbstractMySQLTest {

    @Autowired
    private ApartmentRepository apartmentRepository;

    private ApartmentService apartmentService;
    
    private Apartment apt1;

    @BeforeEach
    void setUp() throws Exception {
        apartmentRepository.deleteAll();
        apartmentService = new ApartmentService(apartmentRepository);
        apt1 = new Apartment("Test Apartment 1", "Nice view", BigDecimal.valueOf(100.00), Set.of("WiFi", "Parking"), 4);
        apt1 = apartmentRepository.save(apt1);
    }

    @Test
    void shouldReturnAllApartments() {
        List<ApartmentDTO> apartments = apartmentService.getAllApartments();

        assertThat(apartments).hasSize(1);
        assertThat(apartments.get(0).getName()).isEqualTo("Test Apartment 1");
        assertThat(apartments.get(0).getDescription()).isEqualTo("Nice view");
        assertThat(apartments.get(0).getPrice()).isEqualByComparingTo(BigDecimal.valueOf(100.00));
        assertThat(apartments.get(0).getServices()).containsExactlyInAnyOrder("WiFi", "Parking");
        assertThat(apartments.get(0).getCapacity()).isEqualTo(4);
        assertThat(apartments.get(0).getImageUrls()).isEmpty();
    }

    @Test
    void shouldReturnApartmentById() {
        Optional<ApartmentDTO> apartmentOpt = apartmentService.getApartmentById(apt1.getId());

        assertThat(apartmentOpt).isPresent();
        ApartmentDTO apartment = apartmentOpt.get();
        assertThat(apartment.getName()).isEqualTo("Test Apartment 1");
        assertThat(apartment.getDescription()).isEqualTo("Nice view");
        assertThat(apartment.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(100.00));
        assertThat(apartment.getServices()).containsExactlyInAnyOrder("WiFi", "Parking");
        assertThat(apartment.getCapacity()).isEqualTo(4);
        assertThat(apartment.getImageUrls()).isEmpty();
    }

    @Test
    void shouldReturnEmptyWhenApartmentNotFound() {
        Optional<ApartmentDTO> apartmentOpt = apartmentService.getApartmentById(9999L);

        assertThat(apartmentOpt).isNotPresent();
    }
}
