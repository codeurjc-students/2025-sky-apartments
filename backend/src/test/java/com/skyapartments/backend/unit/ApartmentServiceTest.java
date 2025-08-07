package com.skyapartments.backend.unit;

import com.skyapartments.backend.dto.ApartmentDTO;
import com.skyapartments.backend.model.Apartment;
import com.skyapartments.backend.repository.ApartmentRepository;
import com.skyapartments.backend.service.ApartmentService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.Test;

public class ApartmentServiceTest {
    
    private ApartmentService apartmentService;
    private ApartmentRepository apartmentRepository = mock(ApartmentRepository.class);

    public ApartmentServiceTest() {
        apartmentService = new ApartmentService(apartmentRepository);
    }

    @Test
    public void testGetAllApartments() {
        Apartment apt1 = new Apartment("Test Apartment 1", "Nice view", "123 Fake St");
        Apartment apt2 = new Apartment("Test Apartment 2", "Cozy place", "456 Real Ave");

        when(apartmentRepository.findAll()).thenReturn(List.of(apt1, apt2));

        List<ApartmentDTO> apartments = apartmentService.getAllApartments();

        assertThat(apartments).hasSize(2);

        assertThat(apartments.get(0).getName()).isEqualTo("Test Apartment 1");
        assertThat(apartments.get(0).getDescription()).isEqualTo("Nice view");
        assertThat(apartments.get(0).getAddress()).isEqualTo("123 Fake St");

        assertThat(apartments.get(1).getName()).isEqualTo("Test Apartment 2");
        assertThat(apartments.get(1).getDescription()).isEqualTo("Cozy place");
        assertThat(apartments.get(1).getAddress()).isEqualTo("456 Real Ave");
    }

    @Test
    public void testGetApartmentByIdFound() {
        Apartment apt = new Apartment("Test", "Nice", "Street 1");
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apt));

        Optional<ApartmentDTO> result = apartmentService.getApartmentById(1L);
        assertThat(result).isPresent();
        assertEquals("Test", result.get().getName());
        assertEquals("Nice", result.get().getDescription());
        assertEquals("Street 1", result.get().getAddress());
    }

    @Test
    public void testGetApartmentByIdNotFound() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.empty());
        
        Optional<ApartmentDTO> result = apartmentService.getApartmentById(1L);
        assertThat(result).isNotPresent();
    }
    
}
