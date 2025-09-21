package com.skyapartments.apartment.integration;

import com.skyapartments.apartment.dto.ApartmentDTO;
import com.skyapartments.apartment.exception.ResourceNotFoundException;
import com.skyapartments.apartment.model.Apartment;
import com.skyapartments.apartment.repository.ApartmentRepository;
import com.skyapartments.apartment.service.ApartmentService;
import com.skyapartments.apartment.service.ImageService;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
    public static final GenericContainer<?> minioContainer =    //cambiar a protected
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

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private ImageService imageService;

    private ApartmentService apartmentService;
    
    private Apartment apt1;

    @BeforeEach
    void setUp() throws Exception {
        apartmentRepository.deleteAll();
        apartmentService = new ApartmentService(apartmentRepository, imageService);
        apt1 = new Apartment("Test Apartment 1", "Nice view", BigDecimal.valueOf(100.00), Set.of("WiFi", "Parking"), 4);
        apt1 = apartmentRepository.save(apt1);
    }

    @Test
    void shouldReturnAllApartments() {

        Pageable pageable = PageRequest.of(0, 10);

        Page<ApartmentDTO> apartments = apartmentService.getAllApartments(pageable);

        assertThat(apartments).hasSize(1);
        assertThat(apartments.getContent().get(0).getName()).isEqualTo("Test Apartment 1");
        assertThat(apartments.getContent().get(0).getDescription()).isEqualTo("Nice view");
        assertThat(apartments.getContent().get(0).getPrice()).isEqualByComparingTo(BigDecimal.valueOf(100.00));
        assertThat(apartments.getContent().get(0).getServices()).containsExactlyInAnyOrder("WiFi", "Parking");
        assertThat(apartments.getContent().get(0).getCapacity()).isEqualTo(4);
    }

    @Test
    void shouldReturnApartmentById() {
        ApartmentDTO apartment = apartmentService.getApartmentById(apt1.getId());

        assertThat(apartment).isNotNull();
        assertThat(apartment.getName()).isEqualTo("Test Apartment 1");
        assertThat(apartment.getDescription()).isEqualTo("Nice view");
        assertThat(apartment.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(100));
        assertThat(apartment.getServices()).containsExactlyInAnyOrder("WiFi", "Parking");
        assertThat(apartment.getCapacity()).isEqualTo(4);
    }

    @Test
    void shouldReturnEmptyWhenApartmentNotFound() {
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> apartmentService.getApartmentById(9999L)
        );
        assertThat(ex.getMessage()).isEqualTo("Apartment not found");
    }
}
