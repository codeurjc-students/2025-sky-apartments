package com.skyapartments.apartment.unit;

import com.skyapartments.apartment.dto.ApartmentDTO;
import com.skyapartments.apartment.dto.ApartmentRequestDTO;
import com.skyapartments.apartment.exception.BusinessValidationException;
import com.skyapartments.apartment.exception.ResourceNotFoundException;
import com.skyapartments.apartment.model.Apartment;
import com.skyapartments.apartment.repository.ApartmentRepository;
import com.skyapartments.apartment.repository.BookingClient;
import com.skyapartments.apartment.service.ApartmentService;
import com.skyapartments.apartment.service.ImageService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;




public class ApartmentServiceUnitTest {
    
    private ApartmentService apartmentService;
    private ApartmentRepository apartmentRepository = mock(ApartmentRepository.class);
    private ImageService imageService = mock(ImageService.class);
    private BookingClient bookingClient = mock(BookingClient.class);
    public ApartmentServiceUnitTest() {
        apartmentService = new ApartmentService(apartmentRepository, imageService, bookingClient);
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
    public void getAllApartments_ShouldReturnEmptyPage_WhenRepositoryIsEmpty() {
        // given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Apartment> emptyPage = Page.empty(pageable);

        when(apartmentRepository.findAll(pageable)).thenReturn(emptyPage);

        // when
        Page<ApartmentDTO> apartments = apartmentService.getAllApartments(pageable);

        // then
        assertThat(apartments).isEmpty();
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

     @Test
    void createApartment_ShouldSaveAndReturnDTO_WhenValidRequestWithoutImages() throws Exception {
        // given
        ApartmentRequestDTO request = new ApartmentRequestDTO();
        request.setName("Nuevo Apt");
        request.setDescription("Desc");
        request.setPrice(new BigDecimal("120.00"));
        request.setCapacity(2);
        request.setServices(Set.of("wifi"));

        when(apartmentRepository.existsByName("Nuevo Apt")).thenReturn(false);

        Apartment saved = new Apartment();
        saved.setId(1L);
        saved.setName("Nuevo Apt");
        saved.setDescription("Desc");
        saved.setPrice(new BigDecimal("120.00"));
        saved.setCapacity(2);
        saved.setServices(Set.of("wifi"));

        when(apartmentRepository.save(any(Apartment.class))).thenReturn(saved);

        // when
        ApartmentDTO result = apartmentService.createApartment(request);

        // then
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Nuevo Apt");
        verify(apartmentRepository, times(2)).save(any(Apartment.class)); // se guarda dos veces (antes y después de añadir imágenes)
        verify(imageService, never()).saveImage(any(), any());
    }

    @Test
    void createApartment_ShouldUploadImages_WhenRequestContainsImages() throws Exception {
        // given
        MultipartFile file1 = mock(MultipartFile.class);

        ApartmentRequestDTO request = new ApartmentRequestDTO();
        request.setName("Apt con fotos");
        request.setDescription("Desc");
        request.setPrice(new BigDecimal("300.00"));
        request.setCapacity(4);
        request.setServices(Set.of("piscina"));
        request.setImages(List.of(file1));

        when(apartmentRepository.existsByName("Apt con fotos")).thenReturn(false);

        Apartment saved = new Apartment();
        saved.setId(10L);
        saved.setName("Apt con fotos");

        when(apartmentRepository.save(any(Apartment.class))).thenReturn(saved);
        when(imageService.saveImage(file1, 10L)).thenReturn("url1");

        // when
        ApartmentDTO result = apartmentService.createApartment(request);

        // then
        assertThat(result.getImagesUrl()).contains("url1");
        verify(imageService, times(1)).saveImage(any(), eq(10L));
    }

    @Test
    void createApartment_ShouldThrowBusinessValidationException_WhenNameAlreadyExists() {
        // given
        ApartmentRequestDTO request = new ApartmentRequestDTO();
        request.setName("Duplicado");
        request.setDescription("Desc");
        request.setPrice(new BigDecimal("200.00"));
        request.setCapacity(3);
        request.setServices(Set.of("wifi"));

        when(apartmentRepository.existsByName("Duplicado")).thenReturn(true);

        // when + then
        BusinessValidationException ex = assertThrows(
            BusinessValidationException.class,
            () -> apartmentService.createApartment(request)
        );

        assertThat(ex.getMessage()).isEqualTo("An apartment with this name already exists");

        verify(apartmentRepository, never()).save(any());
    }

    @Test
    void createApartment_ShouldThrowRuntimeException_WhenImageUploadFails() throws Exception {
        MultipartFile file = mock(MultipartFile.class);

        ApartmentRequestDTO request = new ApartmentRequestDTO();
        request.setName("Apt con error");
        request.setDescription("Desc");
        request.setPrice(new BigDecimal("150.00"));
        request.setCapacity(2);
        request.setServices(Set.of("wifi"));
        request.setImages(List.of(file));

        when(apartmentRepository.existsByName("Apt con error")).thenReturn(false);

        Apartment saved = new Apartment();
        saved.setId(10L);
        saved.setName("Apt con error");

        when(apartmentRepository.save(any(Apartment.class))).thenReturn(saved);
        when(imageService.saveImage(file, 10L)).thenThrow(new RuntimeException("Storage down"));

        RuntimeException ex = assertThrows(
            RuntimeException.class,
            () -> apartmentService.createApartment(request)
        );

        assertThat(ex.getMessage()).contains("Error uploading image: Storage down");
        verify(imageService, times(1)).saveImage(file, 10L);
    }

    @Test
    void updateApartment_ShouldUpdateFieldsWithoutNewImages() throws Exception {
        // given
        Apartment apt = new Apartment();
        apt.setId(1L);
        apt.setName("Old Name");
        apt.setDescription("Old Desc");
        apt.setPrice(new BigDecimal("100"));
        apt.setCapacity(2);
        apt.setServices(Set.of("wifi"));
        apt.addImageUrl("old1.jpg");
        
        ApartmentRequestDTO request = new ApartmentRequestDTO();
        request.setName("New Name");
        request.setDescription("New Desc");
        request.setPrice(new BigDecimal("150"));
        request.setCapacity(3);
        request.setServices(Set.of("piscina"));
        // sin nuevas imágenes

        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apt));
        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(i -> i.getArguments()[0]);

        // when
        ApartmentDTO result = apartmentService.updateApartment(1L, request);

        // then
        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getCapacity()).isEqualTo(3);
        verify(imageService, times(1)).deleteImage(anyString());
        verify(imageService, never()).saveImage(any(), any());
    }

    @Test
    void updateApartment_ShouldUpdateAndUploadNewImages() throws Exception {
        // given
        Apartment apt = new Apartment();
        apt.setId(2L);
        apt.addImageUrl("old.jpg");

        ApartmentRequestDTO request = new ApartmentRequestDTO();
        MultipartFile file1 = mock(MultipartFile.class);
        request.setImages(List.of(file1));
        request.setName("Updated Apt");
        request.setDescription("Desc");
        request.setPrice(new BigDecimal("200"));
        request.setCapacity(4);
        request.setServices(Set.of("wifi"));

        when(apartmentRepository.findById(2L)).thenReturn(Optional.of(apt));
        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(i -> i.getArguments()[0]);
        when(imageService.saveImage(file1, 2L)).thenReturn("url1");

        // when
        ApartmentDTO result = apartmentService.updateApartment(2L, request);

        // then
        assertThat(result.getImagesUrl()).contains("url1");
        verify(imageService, times(1)).deleteImage("old.jpg");
        verify(imageService, times(1)).saveImage(any(), eq(2L));
    }

    @Test
    void updateApartment_ShouldThrowBusinessValidationException_WhenApartmentNotFound() {
        // given
        ApartmentRequestDTO request = new ApartmentRequestDTO();
        request.setName("Name");
        request.setDescription("Desc");
        request.setPrice(new BigDecimal("100"));
        request.setCapacity(2);
        request.setServices(Set.of("wifi"));

        when(apartmentRepository.findById(99L)).thenReturn(Optional.empty());

        // when + then
        BusinessValidationException exception = assertThrows(
            BusinessValidationException.class,
            () -> apartmentService.updateApartment(99L, request)
        );
        assertThat(exception.getMessage()).contains("Apartment not found with id 99");

        verify(apartmentRepository, never()).save(any());
    }

    @Test
    void updateApartment_ShouldThrowRuntimeException_WhenImageUploadFails() throws Exception {
        // given
        Apartment apt = new Apartment();
        apt.setId(5L);

        MultipartFile file = mock(MultipartFile.class);
        ApartmentRequestDTO request = new ApartmentRequestDTO();
        request.setImages(List.of(file));

        when(apartmentRepository.findById(5L)).thenReturn(Optional.of(apt));
        when(imageService.saveImage(file, 5L)).thenThrow(new RuntimeException("Storage down"));
        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(i -> i.getArguments()[0]);

        // when + then
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> apartmentService.updateApartment(5L, request)
        );
        assertThat(exception.getMessage()).contains("Error uploading image: Storage down");

        verify(imageService, times(1)).saveImage(file, 5L);
    }

    @Test
    void deleteApartment_ShouldDeleteImagesAndApartment_WhenApartmentExistsWithImages() {
        // given
        Apartment apt = new Apartment();
        apt.setId(1L);
        apt.addImageUrl("img1.jpg");

        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apt));

        // when
        apartmentService.deleteApartment(1L);

        // then
        verify(imageService, times(1)).deleteImage("img1.jpg");
        verify(apartmentRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteApartment_ShouldThrowResourceNotFoundException_WhenApartmentDoesNotExist() {
        // given
        when(apartmentRepository.findById(99L)).thenReturn(Optional.empty());

        // when + then
        ResourceNotFoundException exception = assertThrows(
            ResourceNotFoundException.class,
            () -> apartmentService.deleteApartment(99L)
        );
        assertThat(exception.getMessage()).contains("Apartment not found");

        verify(imageService, never()).deleteImage(anyString());
        verify(apartmentRepository, never()).deleteById(anyLong());
    }

    @Test
    public void searchApartments_ShouldReturnDTOs_WhenApartmentsMatchFilters() {
        // given
        Apartment apt1 = new Apartment();
        apt1.setId(1L);
        apt1.setName("Apt 1");
        apt1.setCapacity(3);
        apt1.setServices(Set.of("wifi", "piscina"));

        Apartment apt2 = new Apartment();
        apt2.setId(2L);
        apt2.setName("Apt 2");
        apt2.setCapacity(4);
        apt2.setServices(Set.of("wifi"));

        Set<String> services = Set.of("wifi");
        int minCapacity = 2;
        LocalDate startDate = LocalDate.of(2025, 9, 1);
        LocalDate endDate = LocalDate.of(2025, 9, 10);
        Pageable pageable = PageRequest.of(0, 10);

        Page<Apartment> apartmentPage = new PageImpl<>(List.of(apt1, apt2), pageable, 2);
        Set<Long> unavailable = Set.of(); // ningún apartamento está ocupado

        when(apartmentRepository.findAvailableWithOptionalFilters(
                services, services.size(), minCapacity, null, pageable))
            .thenReturn(apartmentPage);

        // when
        Page<ApartmentDTO> result = apartmentService.searchApartments(
                services, minCapacity, startDate, endDate, pageable);

        // then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Apt 1");
        assertThat(result.getContent().get(1).getCapacity()).isEqualTo(4);

        verify(apartmentRepository, times(1))
            .findAvailableWithOptionalFilters(services, services.size(), minCapacity, null, pageable);
    }


    @Test
    public void searchApartments_ShouldHandleNullServices() {
        // given
        Apartment apt = new Apartment();
        apt.setId(3L);
        apt.setName("Apt 3");
        apt.setCapacity(2);

        LocalDate startDate = LocalDate.of(2025, 9, 1);
        LocalDate endDate = LocalDate.of(2025, 9, 10);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Apartment> apartmentPage = new PageImpl<>(List.of(apt), pageable, 1);
        Set<Long> unavailable = Set.of();

        when(apartmentRepository.findAvailableWithOptionalFilters(
                null, 0, 1, null, pageable))
            .thenReturn(apartmentPage);

        // when
        Page<ApartmentDTO> result = apartmentService.searchApartments(
                null, 1, startDate, endDate, pageable);

        // then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Apt 3");

        verify(apartmentRepository, times(1))
            .findAvailableWithOptionalFilters(null, 0, 1, null, pageable);
    }


    @Test
    void searchApartments_ShouldReturnEmptyPage_WhenNoApartmentsFound() {
        // given
        Set<String> services = Set.of("wifi");
        int minCapacity = 2;
        LocalDate startDate = LocalDate.of(2025, 9, 1);
        LocalDate endDate = LocalDate.of(2025, 9, 10);
        Pageable pageable = PageRequest.of(0, 10);

        Page<Apartment> emptyPage = Page.empty(pageable);
        Set<Long> unavailable = Set.of();

        when(apartmentRepository.findAvailableWithOptionalFilters(
                services, services.size(), minCapacity, null, pageable))
            .thenReturn(emptyPage);

        // when
        Page<ApartmentDTO> result = apartmentService.searchApartments(
                services, minCapacity, startDate, endDate, pageable);

        // then
        assertThat(result.getContent()).isEmpty();
        verify(apartmentRepository, times(1))
            .findAvailableWithOptionalFilters(services, services.size(), minCapacity, null, pageable);
    }


    @Test
    void getAllServices_ShouldReturnDistinctServices() {
        // given
        Set<String> services = new HashSet<>();
        services.add("wifi");
        services.add("piscina");

        when(apartmentRepository.findDistinctServices()).thenReturn(services);

        // when
        Set<String> result = apartmentService.getAllServices();

        // then
        assertThat(result).hasSize(2).contains("wifi", "piscina");
        verify(apartmentRepository, times(1)).findDistinctServices();
    }

    @Test
    void getAllServices_ShouldReturnEmptySet_WhenNoServices() {
        // given
        when(apartmentRepository.findDistinctServices()).thenReturn(Set.of());

        // when
        Set<String> result = apartmentService.getAllServices();

        // then
        assertThat(result).isEmpty();
        verify(apartmentRepository, times(1)).findDistinctServices();
    }

     @Test
    void checkAvailability_ShouldThrowResourceNotFound_WhenApartmentDoesNotExist() {
        // given
        when(apartmentRepository.findById(99L)).thenReturn(Optional.empty());

        // when + then
        ResourceNotFoundException ex = assertThrows(
            ResourceNotFoundException.class,
            () -> apartmentService.checkAvailability(99L, LocalDate.now(), LocalDate.now().plusDays(3))
        );
        assertThat(ex.getMessage()).contains("Apartment not found");
    }

    @Test
    void checkAvailability_ShouldReturnTrue_WhenApartmentIsAvailable() {
        // given
        Long apartmentId = 1L;
        LocalDate start = LocalDate.of(2025, 9, 1);
        LocalDate end = LocalDate.of(2025, 9, 10);

        Apartment apartment = new Apartment();
        apartment.setId(apartmentId);

        when(apartmentRepository.findById(apartmentId)).thenReturn(Optional.of(apartment));

        // when
        Boolean available = apartmentService.checkAvailability(apartmentId, start, end);

        // then
        assertThat(available).isTrue();
        verify(apartmentRepository, times(1)).findById(apartmentId);
    }

    @Test
    void checkAvailability_ShouldThrowException_WhenApartmentNotFound() {
        // given
        Long apartmentId = 99L;
        LocalDate start = LocalDate.of(2025, 9, 1);
        LocalDate end = LocalDate.of(2025, 9, 10);

        when(apartmentRepository.findById(apartmentId)).thenReturn(Optional.empty());

        // when & then
        assertThrows(ResourceNotFoundException.class,
                () -> apartmentService.checkAvailability(apartmentId, start, end));

        verify(apartmentRepository, times(1)).findById(apartmentId);
    }

    @Test
    void checkAvailability_ShouldReturnFalse_WhenApartmentIsUnavailable() {
        // given
        Long apartmentId = 1L;
        LocalDate start = LocalDate.of(2025, 9, 1);
        LocalDate end = LocalDate.of(2025, 9, 10);

        Apartment apartment = new Apartment();
        apartment.setId(apartmentId);

        when(apartmentRepository.findById(apartmentId)).thenReturn(Optional.of(apartment));
        when(bookingClient.getUnavailableApartments(start, end)).thenReturn(Set.of(1L, 2L));

        // when
        Boolean available = apartmentService.checkAvailability(apartmentId, start, end);

        // then
        assertThat(available).isFalse();
        verify(apartmentRepository, times(1)).findById(apartmentId);
        verify(bookingClient, times(1)).getUnavailableApartments(start, end);
    }
    
}
