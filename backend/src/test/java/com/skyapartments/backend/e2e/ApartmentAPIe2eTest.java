package com.skyapartments.backend.e2e;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;



import com.skyapartments.backend.model.Apartment;
import com.skyapartments.backend.repository.ApartmentRepository;

import io.restassured.RestAssured;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class ApartmentAPIe2eTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    private ApartmentRepository apartmentRepository;

    @LocalServerPort
    private int port;

    private Apartment savedApartment;

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;

        apartmentRepository.deleteAll();
        savedApartment = apartmentRepository.save(new Apartment("Test Apartment", "Nice view", "123 Fake St"));
    }

    @Test
    public void shouldReturnListOfApartments() {
        given()
        .when()
            .get("/api/apartments/")
        .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Test Apartment"))
            .body("[0].description", equalTo("Nice view"))
            .body("[0].address", equalTo("123 Fake St"));
    }

    @Test
    void shouldReturn204WhenNoApartments() {
        // Delete all apartments
        apartmentRepository.deleteAll();
        
        given()
        .when()
            .get("/api/apartments/")
        .then()
            .statusCode(204);
    }

    @Test
    public void shouldReturnApartmentById() {
        given()
        .when()
            .get("/api/apartments/{id}", savedApartment.getId())
        .then()
            .statusCode(200)
            .body("name", equalTo("Test Apartment"))
            .body("description", equalTo("Nice view"))
            .body("address", equalTo("123 Fake St"));
    }

    @Test
    void shouldReturn404WhenApartmentNotFound() {
        long nonExistentId = 99999L;
        
        given()
        .when()
            .get("/api/apartments/{id}", nonExistentId)
        .then()
            .statusCode(404);
    }
}
