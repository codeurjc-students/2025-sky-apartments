package com.skyapartments.apartment.unit;

import com.skyapartments.apartment.dto.ApartmentDTO;
import com.skyapartments.apartment.model.Apartment;
import com.skyapartments.apartment.repository.ApartmentRepository;
import com.skyapartments.apartment.service.ApartmentService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;


public class ApartmentServiceUnitTest {
    
    private ApartmentService apartmentService;
    private ApartmentRepository apartmentRepository = mock(ApartmentRepository.class);

    public ApartmentServiceUnitTest() {
        apartmentService = new ApartmentService(apartmentRepository);
    }

    @Test
    public void testGetAllApartments() {
        Apartment apt1 = new Apartment("Test Apartment 1", "Nice view",BigDecimal.valueOf(100.0), Set.of("WiFi", "Parking"), 4);
        Apartment apt2 = new Apartment("Test Apartment 2", "Cozy place", BigDecimal.valueOf(150.0), Set.of("WiFi"), 2);

        when(apartmentRepository.findAll()).thenReturn(List.of(apt1, apt2));

        List<ApartmentDTO> apartments = apartmentService.getAllApartments();

        assertThat(apartments).hasSize(2);

        assertThat(apartments.get(0).getName()).isEqualTo("Test Apartment 1");
        assertThat(apartments.get(0).getDescription()).isEqualTo("Nice view");
        assertThat(apartments.get(0).getPrice()).isEqualTo(BigDecimal.valueOf(100.0));
        assertThat(apartments.get(0).getServices()).containsExactlyInAnyOrder("WiFi", "Parking");
        assertThat(apartments.get(0).getCapacity()).isEqualTo(4);
        assertThat(apartments.get(1).getName()).isEqualTo("Test Apartment 2");
        assertThat(apartments.get(1).getDescription()).isEqualTo("Cozy place");
        assertThat(apartments.get(1).getPrice()).isEqualTo(BigDecimal.valueOf(150.0));
        assertThat(apartments.get(1).getServices()).containsExactlyInAnyOrder("WiFi");
        assertThat(apartments.get(1).getCapacity()).isEqualTo(2);

    }

    @Test
    public void testGetApartmentByIdFound() {
        Apartment apt = new Apartment("Test", "Nice", BigDecimal.valueOf(100.0), Set.of("WiFi"), 2);
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apt));

        Optional<ApartmentDTO> result = apartmentService.getApartmentById(1L);
        assertThat(result).isPresent();
        assertEquals("Test", result.get().getName());
        assertEquals("Nice", result.get().getDescription());
        assertEquals(   BigDecimal.valueOf(100.0), result.get().getPrice());
        assertThat(result.get().getServices()).containsExactlyInAnyOrder("WiFi");
        assertEquals(2, result.get().getCapacity());

        verify(apartmentRepository, times(1)).findById(1L);
    }

    @Test
    public void testGetApartmentByIdNotFound() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.empty());
        
        Optional<ApartmentDTO> result = apartmentService.getApartmentById(1L);
        assertThat(result).isNotPresent();
    }

}
