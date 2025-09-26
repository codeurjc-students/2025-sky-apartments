package com.skyapartments.apartment.integration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.skyapartments.apartment.dto.ApartmentDTO;
import com.skyapartments.apartment.dto.ApartmentRequestDTO;
import com.skyapartments.apartment.exception.BusinessValidationException;
import com.skyapartments.apartment.exception.ResourceNotFoundException;
import com.skyapartments.apartment.model.Apartment;
import com.skyapartments.apartment.repository.ApartmentRepository;
import com.skyapartments.apartment.service.ApartmentService;
import com.skyapartments.apartment.service.ImageService;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class ApartmentServiceIntegrationTest {

    @Container
    public static final MySQLContainer<?> mysqlContainer =
            new MySQLContainer<>("mysql:8.0")
                    .withDatabaseName("testdb")
                    .withUsername("testuser")
                    .withPassword("testpass");

    @Container
    public static final GenericContainer<?> minioContainer =
            new GenericContainer<>("minio/minio:latest")
                    .withExposedPorts(9000)
                    .withCommand("server /data")
                    .withEnv("MINIO_ACCESS_KEY", "minio")
                    .withEnv("MINIO_SECRET_KEY", "minio123")
                    .waitingFor(Wait.forHttp("/minio/health/live").forStatusCode(200));

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // MySQL
        registry.add("spring.datasource.url", mysqlContainer::getJdbcUrl);
        registry.add("spring.datasource.username", mysqlContainer::getUsername);
        registry.add("spring.datasource.password", mysqlContainer::getPassword);
        registry.add("spring.datasource.driver-class-name", mysqlContainer::getDriverClassName);

        registry.add("minio.url", 
            () -> "http://" + minioContainer.getHost() + ":" + minioContainer.getMappedPort(9000));
        registry.add("minio.access-key", () -> "minio");
        registry.add("minio.secret-key", () -> "minio123");
        registry.add("minio.bucket", () -> "apartments-images");

    }

    private ApartmentService apartmentService;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private ImageService imageService;

    private Apartment apt1;
    private ApartmentRequestDTO request;
    private MockMultipartFile imageFile;

    @BeforeEach
    void setUp() throws Exception {
        apartmentRepository.deleteAll();
        apartmentService = new ApartmentService(apartmentRepository, imageService);
        apt1 = new Apartment("Test Apartment 1", "Nice view", BigDecimal.valueOf(100.00), Set.of("WiFi", "Parking"), 4);
        apt1 = apartmentRepository.save(apt1);
        imageFile = new MockMultipartFile(
                "image",
                "picture.jpg",
                "image/jpeg",
                "fake-image-content".getBytes()
        );
        String imageUrl = imageService.saveImage(imageFile, apt1.getId());
        apt1.setImageUrl(imageUrl);
        apt1 = apartmentRepository.save(apt1);
        apartmentRepository.save(new Apartment("Test Apartment 2", "Sea view", BigDecimal.valueOf(150.00), Set.of("WiFi", "Sea"), 2));
        request = new ApartmentRequestDTO();
        request.setName("Test Apartment 1");
        request.setDescription("Nice view");
        request.setCapacity(4);
        request.setPrice(BigDecimal.valueOf(100.00));
        request.setServices(Set.of("WiFi", "Parking"));
    }

    @Test
    public void getAllApartment_ShouldReturnAllApartments() {

        Pageable pageable = PageRequest.of(0, 10);

        Page<ApartmentDTO> apartments = apartmentService.getAllApartments(pageable);

        assertThat(apartments).hasSize(2);

        assertThat(apartments.getContent().get(0).getName()).isEqualTo("Test Apartment 1");
        assertThat(apartments.getContent().get(0).getDescription()).isEqualTo("Nice view");
        assertThat(apartments.getContent().get(0).getPrice()).isEqualByComparingTo(BigDecimal.valueOf(100.00));
        assertThat(apartments.getContent().get(0).getServices()).containsExactlyInAnyOrder("WiFi", "Parking");
        assertThat(apartments.getContent().get(0).getCapacity()).isEqualTo(4);
        assertThat(apartments.getContent().get(0).getImageUrl()).isNotEmpty();

        assertThat(apartments.getContent().get(1).getName()).isEqualTo("Test Apartment 2");
        assertThat(apartments.getContent().get(1).getDescription()).isEqualTo("Sea view");
        assertThat(apartments.getContent().get(1).getPrice()).isEqualByComparingTo(BigDecimal.valueOf(150.00));
        assertThat(apartments.getContent().get(1).getServices()).containsExactlyInAnyOrder("WiFi", "Sea");
        assertThat(apartments.getContent().get(1).getCapacity()).isEqualTo(2);
        assertThat(apartments.getContent().get(1).getImageUrl()).isBlank();
    }

    @Test
    public void getAllApartment_ShouldReturnEmptyList_WhenNoApartmentsExist() {
        apartmentRepository.deleteAll();
        Pageable pageable =  PageRequest.of(0, 10);
        Page<ApartmentDTO> apartments = apartmentService.getAllApartments(pageable);

        assertThat(apartments).isEmpty();
    }

    @Test
    public void getApartmentById_ShouldReturnApartmentById_WhenApartmentExists() {
        ApartmentDTO apartment = apartmentService.getApartmentById(apt1.getId());

        assertThat(apartment).isNotNull();
        assertThat(apartment.getName()).isEqualTo("Test Apartment 1");
        assertThat(apartment.getDescription()).isEqualTo("Nice view");
        assertThat(apartment.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(100));
        assertThat(apartment.getServices()).containsExactlyInAnyOrder("WiFi", "Parking");
        assertThat(apartment.getCapacity()).isEqualTo(4);
        assertThat(apartment.getImageUrl()).isNotEmpty();
    }

    @Test
    public void getApartmentById_ShouldReturnEmpty_WhenApartmentNotFound() {
        //ApartmentDTO apartment = apartmentService.getApartmentById(9999L);

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> apartmentService.getApartmentById(9999L)
        );
        assertThat(ex.getMessage()).isEqualTo("Apartment not found");
    }

    @Test
    public void createApartment_ShouldSaveAndReturnDTO_WhenValidRequestWithoutImages() {
        apartmentRepository.deleteAll();
        ApartmentDTO dto = apartmentService.createApartment(request);

        assertThat(dto.getId()).isNotNull();
        assertThat(dto.getName()).isEqualTo("Test Apartment 1");
        assertThat(dto.getDescription()).isEqualTo("Nice view");
        assertThat(dto.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(100.00));
        assertThat(dto.getServices()).containsExactlyInAnyOrder("WiFi", "Parking");
        assertThat(dto.getCapacity()).isEqualTo(4);
        assertThat(dto.getImageUrl()).isBlank();
    }

    @Test
    public void createApartment_ShouldCreateApartmentWithImages() {
        apartmentRepository.deleteAll();

        request.setImage(imageFile);
        
        ApartmentDTO dto = apartmentService.createApartment(request);

        assertThat(dto.getId()).isNotNull();
        assertThat(dto.getName()).isEqualTo("Test Apartment 1");
        assertThat(dto.getServices()).containsExactlyInAnyOrder("Parking", "WiFi");
        assertThat(dto.getImageUrl()).isNotEmpty();
    }

    @Test
    public void createApartment_ShouldThrowBusinessValidationException_WhenApartmentNameAlreadyExists() {

        BusinessValidationException ex = assertThrows(
            BusinessValidationException.class,
            () -> apartmentService.createApartment(request)
        );

        assertThat(ex.getMessage()).isEqualTo("An apartment with this name already exists");

    }

    @Test
    public void updateApartment_ShouldUpdateApartmentWithoutImages() throws Exception {

        request.setName("Updated Apartment");
        request.setDescription("Updated description");
        request.setCapacity(6);
        request.setPrice(BigDecimal.valueOf(300));
        request.setServices(Set.of("Air Conditioning"));
        // Act
        ApartmentDTO updated = apartmentService.updateApartment(apt1.getId(), request);

        // Assert
        assertThat(updated.getId()).isEqualTo(apt1.getId());
        assertThat(updated.getName()).isEqualTo("Updated Apartment");
        assertThat(updated.getDescription()).isEqualTo("Updated description");
        assertThat(updated.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(300));
        assertThat(updated.getCapacity()).isEqualTo(6);
        assertThat(updated.getServices()).containsExactly("Air Conditioning");
        assertThat(updated.getImageUrl()).isBlank();
    }

    @Test
    public void updateApartment_ShouldUpdateApartmentWithNewImages() throws Exception {

        request.setName("Updated Apartment");
        request.setDescription("Updated description");
        request.setCapacity(6);
        request.setPrice(BigDecimal.valueOf(300));
        request.setServices(Set.of("Air Conditioning"));
        request.setImage(imageFile);
        // Act
        ApartmentDTO updated = apartmentService.updateApartment(apt1.getId(), request);

        // Assert
        assertThat(updated.getId()).isEqualTo(apt1.getId());
        assertThat(updated.getName()).isEqualTo("Updated Apartment");
        assertThat(updated.getDescription()).isEqualTo("Updated description");
        assertThat(updated.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(300));
        assertThat(updated.getCapacity()).isEqualTo(6);
        assertThat(updated.getServices()).containsExactly("Air Conditioning");
        assertThat(updated.getImageUrl()).isNotEmpty();
        assertThat(updated.getImageUrl()).contains("picture.jpg");
        assertThat(imageService.imageExists(apt1.getImageUrl())).isFalse();
    }

    @Test
    public void updateApartment_ShouldThrowException_WhenUpdatingNonExistingApartment() {
        BusinessValidationException ex = assertThrows(
            BusinessValidationException.class,
            () -> apartmentService.updateApartment(9999L, request)
        );

        assertThat(ex.getMessage()).contains("Apartment not found with id");
    }

    @Test
    public void deleteApartment_ShouldDeleteApartmentWithImages() throws Exception {
        
        apartmentService.deleteApartment(apt1.getId());

        assertThat(apartmentRepository.findById(apt1.getId())).isEmpty();
        assertThat(imageService.imageExists(apt1.getImageUrl())).isFalse();
    }

    @Test
    public void deleteApartment_ShouldThrowException_WhenDeletingNonExistingApartment() {
        ResourceNotFoundException ex = assertThrows(
            ResourceNotFoundException.class,
            () -> apartmentService.deleteApartment(9999L)
        );

        assertThat(ex.getMessage()).contains("Apartment not found");
    }

    @Test
    public void searchApartments_ShouldReturnApartmentsMatchingServicesAndCapacity() throws Exception {
        Pageable pageable = PageRequest.of(0, 10);
        // Act: search apartments with Wifi and minCapacity 3
        Set<String> services = Set.of("WiFi");
        Page<ApartmentDTO> results = apartmentService.searchApartments(
                services,
                3,
                null,  // startDate null -> no filter
                null,   // endDate null -> no filter
                pageable
        );

        // Assert
        assertThat(results).hasSize(1);
        assertThat(results.getContent().get(0).getName()).isEqualTo("Test Apartment 1");
        assertThat(results.getContent().get(0).getCapacity()).isGreaterThanOrEqualTo(3);
        assertThat(results.getContent().get(0).getServices()).contains("WiFi");
    }

    @Test
    public void searchApartments_ShouldReturnAllApartments_WhenNoFilters() throws Exception {
        Pageable pageable = PageRequest.of(0, 10);
        Page<ApartmentDTO> results = apartmentService.searchApartments(null, 0, null, null, pageable);

        // Assert
        assertThat(results.get()).hasSize(2);
        assertThat(results.get()).extracting(ApartmentDTO::getName).containsExactlyInAnyOrder("Test Apartment 1", "Test Apartment 2");
    }

    @Test
    public void getAllServices_ShouldReturnAllDistinctServices() {
        // Act
        Set<String> services = apartmentService.getAllServices();

        // Assert
        assertThat(services).containsExactlyInAnyOrder("WiFi", "Parking", "Sea");
    }

    @Test
    public void checkAvailability_ShouldReturnTrueWhenApartmentIsAvailable() {
        
        // No bookings yet
        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(3);

        // Act
        Boolean available = apartmentService.checkAvailability(apt1.getId(), start, end);

        // Assert
        assertThat(available).isTrue();
    }


    @Test
    public void shouldThrowExceptionWhenApartmentNotFound() {
        // Arrange
        Long nonExistentId = 999L;
        LocalDate start = LocalDate.now();
        LocalDate end = LocalDate.now().plusDays(1);

        ResourceNotFoundException ex = assertThrows(
            ResourceNotFoundException.class,
            () -> apartmentService.checkAvailability(nonExistentId, start, end)
        );

        assertThat(ex.getMessage()).contains("Apartment not found");

    }
}
