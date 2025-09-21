package com.skyapartments.apartment.unit;

import com.skyapartments.apartment.dto.ApartmentDTO;
import com.skyapartments.apartment.exception.ResourceNotFoundException;
import com.skyapartments.apartment.model.Apartment;
import com.skyapartments.apartment.repository.ApartmentRepository;
import com.skyapartments.apartment.service.ApartmentService;
import com.skyapartments.apartment.service.ImageService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public class ApartmentServiceUnitTest {
    
    private ApartmentService apartmentService;
    private ApartmentRepository apartmentRepository = mock(ApartmentRepository.class);
    private ImageService imageService = mock(ImageService.class);

    public ApartmentServiceUnitTest() {
        apartmentService = new ApartmentService(apartmentRepository, imageService);
    }

    @Test
    public void getAllApartments_ShouldReturnApartmentList() {
        Apartment apt1 = new Apartment("Test Apartment 1", "Nice view",BigDecimal.valueOf(100.0), Set.of("WiFi", "Parking"), 4);
        Apartment apt2 = new Apartment("Test Apartment 2", "Cozy place", BigDecimal.valueOf(150.0), Set.of("WiFi"), 2);

        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apt1));
        when(apartmentRepository.findById(2L)).thenReturn(Optional.of(apt2));

        Pageable pageable = PageRequest.of(0, 10); // página 0 con 10 elementos
        Page<Apartment> apartmentPage = new PageImpl<>(List.of(apt1, apt2), pageable, 2);

        when(apartmentRepository.findAll(pageable)).thenReturn(apartmentPage);

        Page<ApartmentDTO> apartments = apartmentService.getAllApartments(pageable);

        assertThat(apartments).hasSize(2);

        assertThat(apartments.getContent().get(0).getName()).isEqualTo("Test Apartment 1");
        assertThat(apartments.getContent().get(0).getDescription()).isEqualTo("Nice view");
        assertThat(apartments.getContent().get(0).getPrice()).isEqualTo(BigDecimal.valueOf(100.0));
        assertThat(apartments.getContent().get(0).getServices()).containsExactlyInAnyOrder("WiFi", "Parking");
        assertThat(apartments.getContent().get(0).getCapacity()).isEqualTo(4);

        assertThat(apartments.getContent().get(1).getName()).isEqualTo("Test Apartment 2");
        assertThat(apartments.getContent().get(1).getDescription()).isEqualTo("Cozy place");
        assertThat(apartments.getContent().get(1).getPrice()).isEqualTo(BigDecimal.valueOf(150.0));
        assertThat(apartments.getContent().get(1).getServices()).containsExactlyInAnyOrder("WiFi");
        assertThat(apartments.getContent().get(1).getCapacity()).isEqualTo(2);

        verify(apartmentRepository, times(1)).findAll(pageable);
    }

    @Test
    public void getApartmentById_ShouldReturnApartmentDTO_WhenApartmentExists() {
        Apartment apt = new Apartment("Test", "Nice", BigDecimal.valueOf(100.0), Set.of("WiFi"), 2);
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apt));

        ApartmentDTO result = apartmentService.getApartmentById(1L);
        assertThat(result).isNotNull();
        assertEquals("Test", result.getName());
        assertEquals("Nice", result.getDescription());
        assertEquals(   BigDecimal.valueOf(100.0), result.getPrice());
        assertThat(result.getServices()).containsExactlyInAnyOrder("WiFi");
        assertEquals(2, result.getCapacity());

        verify(apartmentRepository, times(1)).findById(1L);
    }

    @Test
    public void getApartmentById_ShouldReturnEmpty_WhenApartmentNotExists() {
        //given
        when(apartmentRepository.findById(1L)).thenReturn(Optional.empty());

        //when & then
        ResourceNotFoundException exception = assertThrows(
            ResourceNotFoundException.class,
            () -> apartmentService.getApartmentById(1L)
        );
        assertThat(exception.getMessage()).isEqualTo("Apartment not found");
        verify(apartmentRepository, times(1)).findById(1L);
    }

}
