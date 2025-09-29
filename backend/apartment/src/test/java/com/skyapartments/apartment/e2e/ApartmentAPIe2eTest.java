package com.skyapartments.apartment.e2e;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;

import com.skyapartments.apartment.model.Apartment;
import com.skyapartments.apartment.repository.ApartmentRepository;

import io.restassured.RestAssured;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.Set;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(OrderAnnotation.class)
public class ApartmentAPIe2eTest {

    @Autowired
    private ApartmentRepository apartmentRepository;

    @LocalServerPort
    private int port;

    private Apartment savedApartment;
    private static String gatewayUrl;

    @BeforeAll
    public static void init() {
        useRelaxedHTTPSValidation();
        
    }

    @BeforeEach
    void setUp() {

        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;

        //RestAssured.baseURI = gatewayUrl;
        
        apartmentRepository.deleteAll();

        Apartment apto = new Apartment(
            "Test Apartment", 
            "Nice view", 
            BigDecimal.valueOf(100.0), 
            Set.of("WiFi", "Parking"), 
            4
        );
        apto.setImageUrl("https://my-bucket.s3.amazonaws.com/test_image.jpg");
        savedApartment = apartmentRepository.save(apto);
        
    }

    @Test
    @Order(1)
    public void getAllApartments_ShouldReturnListOfApartments_WhenTheyExist() {
        given()
        .when()
            .get("/api/v1/apartments/")
        .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Test Apartment"))
            .body("[0].description", equalTo("Nice view"))
            .body("[0].price", equalTo(100.0f))
            .body("[0].capacity", equalTo(4))
            .body("[0].services", hasItems("WiFi", "Parking"));
    }

    @Test
    @Order(2)
    public void getAllApartments_ShouldReturn204_WhenNoApartments() {
        apartmentRepository.deleteAll();
        
        given()
        .when()
            .get("/api/v1/apartments/")
        .then()
            .statusCode(204);
    }

    @Test
    @Order(3)
    public void getApartmentById_ShouldReturnApartmentById_WhenIdExists() {
        given()
        .when()
            .get("/api/v1/apartments/{id}", savedApartment.getId())
        .then()
            .statusCode(200)
            .body("name", equalTo("Test Apartment"))
            .body("description", equalTo("Nice view"))
            .body("price", equalTo(100.0f))
            .body("capacity", equalTo(4))
            .body("services", hasItems("WiFi", "Parking"));
    }

    @Test
    @Order(4)
    public void getApartmentById_ShouldReturn404_WhenApartmentNotFound() {
        long nonExistentId = 99999L;
        
        given()
        .when()
            .get("/api/v1/apartments/{id}", nonExistentId)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(5)
    public void getApartmentById_ShouldReturn400_WhenIdNotLong() {
        
        given()
        .when()
            .get("/api/v1/apartments/{id}", 'a')
        .then()
            .statusCode(400)
            .body("message", equalTo("El parámetro 'id' debe ser de tipo Long. Valor recibido: 'a'"));
    }

    @Test
    @Order(6)
    public void createApartment_ShouldCreateApartment_WhenInputIsValid() {

        given()
            .contentType("multipart/form-data")
            .formParam("name", "Ocean View")
            .formParam("description", "Apartment with sea views")
            .formParam("price", "180.00")
            .formParam("capacity", "3")
            .formParam("services", "WiFi")
            .formParam("services", "Air Conditioning")
            .multiPart("image", "photo1.jpg",
                    new ByteArrayInputStream("fakeimage1".getBytes()),
                    MediaType.IMAGE_JPEG_VALUE)
        .when()
            .post("/api/v1/apartments")
        .then()
            .log().all()
            .statusCode(201)
            .body("id", notNullValue())
            .body("name", equalTo("Ocean View"))
            .body("description", equalTo("Apartment with sea views"))
            .body("price", equalTo(180.00f))
            .body("capacity", equalTo(3))
            .body("services", hasItems("WiFi", "Air Conditioning"))
            .body("imageUrl", notNullValue());

    }
    @Test
    @Order(7)
    public void createApartment_ShouldReturnBadRequest_WhenNameIsBlank() {
        given()
            .contentType("multipart/form-data")
            .multiPart("name", "") // invalid name
            .multiPart("description", "No name apartment")
            .multiPart("price", "100.00")
            .multiPart("capacity", "2")
            .multiPart("image", "photo1.jpg", new ByteArrayInputStream("fakeimage".getBytes()), MediaType.IMAGE_JPEG_VALUE)
        .when()
            .post("/api/v1/apartments")
        .then()
            .statusCode(400)
            .body("errors.name", equalTo("Name cannot be blank"));
    }

    @Test
    @Order(8)
    public void createApartment_ShouldReturnBadRequest_WhenNoImagesProvided() {
        given()
            .contentType("multipart/form-data")
            .multiPart("name", "No Images Apt")
            .multiPart("description", "Missing images")
            .multiPart("price", "150.00")
            .multiPart("capacity", "2")
        .when()
            .post("/api/v1/apartments")
        .then()
            .statusCode(400)
            .body("errors.imagePresent", equalTo("At least one image is required"));
    }

    @Test
    @Order(9)
    public void createApartment_ShouldReturnBadRequest_WhenPriceIsNegative() {
        given()
            .contentType("multipart/form-data")
            .multiPart("name", "Negative Price Apt")
            .multiPart("description", "Invalid price apartment")
            .multiPart("price", "-50.00")
            .multiPart("capacity", "2")
            .multiPart("image", "photo1.jpg", new ByteArrayInputStream("fakeimage1".getBytes()), MediaType.IMAGE_JPEG_VALUE)
        .when()
            .post("/api/v1/apartments")
        .then()
            .statusCode(400)
            .body("errors.price", containsString("greater than 0"));
    }

    @Test
    @Order(10)
    public void createApartment_ShouldReturnBadRequest_WhenCapacityIsZero() {
        given()
            .contentType("multipart/form-data")
            .multiPart("name", "Zero Capacity Apt")
            .multiPart("description", "Invalid capacity apartment")
            .multiPart("price", "100.00")
            .multiPart("capacity", "0")
            .multiPart("image", "photo1.jpg", new ByteArrayInputStream("fakeimage1".getBytes()), MediaType.IMAGE_JPEG_VALUE)
        .when()
            .post("/api/v1/apartments")
        .then()
            .statusCode(400)
            .body("errors.capacity", containsString("at least 1"));
    }
    
    @Test
    @Order(11)
    public void updateApartment_ShouldUpdateApartment_WhenValidData() {
        given()
            .contentType("multipart/form-data")
            .formParam("name", "Updated Apartment Name")
            .formParam("description", "Updated description")
            .formParam("price", "250.00")
            .formParam("capacity", "6")
            .formParam("services", "WiFi")
            .formParam("services", "Balcony")
            .multiPart("image", "photo1.jpg", new ByteArrayInputStream("fakeimage1".getBytes()), MediaType.IMAGE_JPEG_VALUE)
        .when()
            .put("/api/v1/apartments/{id}", savedApartment.getId())
        .then()
            .log().all()
            .statusCode(200)
            .body("id", equalTo(savedApartment.getId().intValue()))
            .body("name", equalTo("Updated Apartment Name"))
            .body("description", equalTo("Updated description"))
            .body("price", equalTo(250.00f))
            .body("capacity", equalTo(6))
            .body("services", hasItems("WiFi", "Balcony"));
    }

    @Test
    @Order(12)
    public void updateApartment_ShouldReturnNotFound_WhenApartmentDoesNotExist() {
        long nonExistentId = 99999L;
        
        given()
            .contentType("multipart/form-data")
            .formParam("name", "Non-existent Apartment")
            .formParam("description", "This apartment doesn't exist")
            .formParam("price", "150.00")
            .formParam("capacity", "4")
            .multiPart("image", "photo.jpg",
                    new ByteArrayInputStream("fake_image".getBytes()),
                    MediaType.IMAGE_JPEG_VALUE)
        .when()
            .put("/api/v1/apartments/{id}", nonExistentId)
        .then()
            .statusCode(400)
            .body("message", equalTo("Apartment not found with id " + nonExistentId));
    }

    @Test
    @Order(13)
    public void updateApartment_ShouldReturnBadRequest_WhenDataIsInvalid() {
        given()
            .contentType("multipart/form-data")
            .formParam("name", "")
            .formParam("description", "Updated description")
            .formParam("price", "-100.00")
            .formParam("capacity", "0")
            .multiPart("image", "photo.jpg",
                    new ByteArrayInputStream("fake_image".getBytes()),
                    MediaType.IMAGE_JPEG_VALUE)
        .when()
            .put("/api/v1/apartments/{id}", savedApartment.getId())
        .then()
            .statusCode(400);
    }

    // ==================== DELETE APARTMENT TESTS ====================

    @Test
    @Order(14)
    public void deleteApartment_ShouldDeleteApartment_WhenApartmentExists() {

        Apartment tempApartment = apartmentRepository.save(new Apartment(
            "Temp Apartment", 
            "To be deleted", 
            BigDecimal.valueOf(150.0), 
            Set.of("WiFi"), 
            2
        ));

        given()
        .when()
            .delete("/api/v1/apartments/{id}", tempApartment.getId())
        .then()
            .statusCode(204);

        // Check was deleted
        given()
        .when()
            .get("/api/v1/apartments/{id}", tempApartment.getId())
        .then()
            .statusCode(404);
    }

    @Test
    @Order(15)
    public void deleteApartment_ShouldReturnNotFound_WhenApartmentDoesNotExist() {
        long nonExistentId = 99999L;
        
        given()
        .when()
            .delete("/api/v1/apartments/{id}", nonExistentId)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(16)
    public void deleteApartment_ShouldReturnBadRequest_WhenIdIsNotLong() {
        given()
        .when()
            .delete("/api/v1/apartments/{id}", "invalid-id")
        .then()
            .statusCode(400);
    }


    @Test
    @Order(17)
    public void searchApartments_ShouldReturnFilteredApartments_WhenServicesFilter() {
        apartmentRepository.save(new Apartment(
            "WiFi Apartment", 
            "Has WiFi", 
            BigDecimal.valueOf(120.0), 
            Set.of("WiFi"), 
            2
        ));
        
        apartmentRepository.save(new Apartment(
            "Parking Apartment", 
            "Has Parking", 
            BigDecimal.valueOf(130.0), 
            Set.of("Parking"), 
            3
        ));

        given()
            .queryParam("services", "WiFi")
        .when()
            .get("/api/v1/apartments/search")
        .then()
            .statusCode(200)
            .body("size()", greaterThan(0))
            .body("findAll { it.services.contains('WiFi') }.size()", greaterThan(0));
    }

    @Test
    @Order(18)
    public void searchApartments_ShouldReturnFilteredApartments_WhenMinCapacityFilter() {
        given()
            .queryParam("minCapacity", "4")
        .when()
            .get("/api/v1/apartments/search")
        .then()
            .statusCode(200)
            .body("findAll { it.capacity >= 4 }.size()", greaterThan(0));
    }

    @Test
    @Order(19)
    public void searchApartments_ShouldReturnFilteredApartments_WhenDateRangeFilter() {
        given()
            .queryParam("startDate", "2024-06-01")
            .queryParam("endDate", "2024-06-07")
        .when()
            .get("/api/v1/apartments/search")
        .then()
            .statusCode(200);
    }

    @Test
    @Order(20)
    public void searchApartments_ShouldReturnAllApartments_WhenNoFilters() {
        given()
        .when()
            .get("/api/v1/apartments/search")
        .then()
            .statusCode(200)
            .body("size()", greaterThan(0));
    }

    @Test
    @Order(21)
    public void searchApartments_ShouldReturn204_WhenNoApartmentsMatchCriteria() {
        given()
            .queryParam("services", "NonExistentService")
            .queryParam("minCapacity", "999")
        .when()
            .get("/api/v1/apartments/search")
        .then()
            .statusCode(204);
    }

    @Test
    @Order(22)
    public void searchApartments_ShouldReturnPaginatedResults() {
        given()
            .queryParam("page", "0")
            .queryParam("pageSize", "5")
        .when()
            .get("/api/v1/apartments/search")
        .then()
            .statusCode(200)
            .body("size()", lessThanOrEqualTo(5));
    }

    @Test
    @Order(23)
    public void getAllServices_ShouldReturnSetOfServices_WhenServicesExist() {
        given()
        .when()
            .get("/api/v1/apartments/services")
        .then()
            .statusCode(200)
            .body("size()", greaterThan(0))
            .body(".", hasItems("WiFi", "Parking"));
    }

    @Test
    @Order(24)
    public void getAllServices_ShouldReturn204_WhenNoServicesExist() {
        apartmentRepository.deleteAll();
        
        given()
        .when()
            .get("/api/v1/apartments/services")
        .then()
            .statusCode(204);
    }

    @Test
    @Order(25)
    public void checkAvailability_ShouldReturnTrue_WhenApartmentIsAvailable() {
        given()
            .queryParam("startDate", "2024-06-01")
            .queryParam("endDate", "2024-06-07")
        .when()
            .get("/api/v1/apartments/{id}/availability", savedApartment.getId())
        .then()
            .statusCode(200)
            .body(equalTo("true"));
    }

    @Test
    @Order(26)
    public void checkAvailability_ShouldReturnNotFound_WhenApartmentDoesNotExist() {
        long nonExistentId = 99999L;
        
        given()
            .queryParam("startDate", "2024-06-01")
            .queryParam("endDate", "2024-06-07")
        .when()
            .get("/api/v1/apartments/{id}/availability", nonExistentId)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(27)
    public void checkAvailability_ShouldReturnBadRequest_WhenDatesAreMissing() {
        given()
        .when()
            .get("/api/v1/apartments/{id}/availability", savedApartment.getId())
        .then()
            .statusCode(400);
    }

    @Test
    @Order(28)
    public void checkAvailability_ShouldReturnBadRequest_WhenDatesAreInvalid() {
        given()
            .queryParam("startDate", "invalid-date")
            .queryParam("endDate", "2024-06-07")
        .when()
            .get("/api/v1/apartments/{id}/availability", savedApartment.getId())
        .then()
            .statusCode(400);
    }

    @Test
    @Order(29)
    public void checkAvailability_ShouldReturnBadRequest_WhenIdIsNotLong() {
        given()
            .queryParam("startDate", "2024-06-01")
            .queryParam("endDate", "2024-06-07")
        .when()
            .get("/api/v1/apartments/{id}/availability", "invalid-id")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(30)
    public void getAllApartments_ShouldReturnPaginatedResults_WhenPageParametersProvided() {
        for (int i = 1; i <= 15; i++) {
            apartmentRepository.save(new Apartment(
                "Apartment " + i, 
                "Description " + i, 
                BigDecimal.valueOf(100.0 + i), 
                Set.of("WiFi"), 
                2
            ));
        }

        given()
            .queryParam("page", "1")
            .queryParam("pageSize", "5")
        .when()
            .get("/api/v1/apartments/")
        .then()
            .statusCode(200)
            .body("size()", equalTo(5));
    }

    @Test
    @Order(31)
    public void getAllApartments_ShouldReturnSecondPage_WhenPageIs1() {
        given()
            .queryParam("page", "1")
            .queryParam("pageSize", "5")
        .when()
            .get("/api/v1/apartments/")
        .then()
            .statusCode(204);
    }

    @Test
    @Order(32)
    public void searchApartments_ShouldHandleMultipleServices() {
        given()
            .queryParam("services", "WiFi")
            .queryParam("services", "Parking")
        .when()
            .get("/api/v1/apartments/search")
        .then()
            .statusCode(200);
    }

    @Test
    @Order(33)
    public void searchApartments_ShouldHandleInvalidDateFormat() {
        given()
            .queryParam("startDate", "invalid-date")
            .queryParam("endDate", "2024-06-07")
        .when()
            .get("/api/v1/apartments/search")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(34)
    public void searchApartments_ShouldHandleEndDateBeforeStartDate() {
        given()
            .queryParam("startDate", "2024-06-07")
            .queryParam("endDate", "2024-06-01")
        .when()
            .get("/api/v1/apartments/search")
        .then()
            .statusCode(400)
            .body("message", equalTo("End date must be after start date"));
    }
}
