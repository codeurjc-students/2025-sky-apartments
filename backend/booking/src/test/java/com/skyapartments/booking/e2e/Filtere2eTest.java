package com.skyapartments.booking.e2e;

import com.skyapartments.booking.model.ConditionType;
import com.skyapartments.booking.model.DateType;
import com.skyapartments.booking.model.Filter;
import com.skyapartments.booking.repository.FilterRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static io.restassured.RestAssured.useRelaxedHTTPSValidation;
import static org.hamcrest.Matchers.*;


@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "eureka.client.register-with-eureka=false",
        "eureka.client.fetch-registry=false"
    }
)
@TestMethodOrder(OrderAnnotation.class)
public class Filtere2eTest {
    @Autowired
    private FilterRepository filterRepository;

    private static String gatewayUrl;
    
    private Map<String, String> adminCookies;
    private Map<String, String> userCookies;

    private Long adminUserId;
    private Long regularUserId;

    @LocalServerPort
    private int port;

    @BeforeAll
    public static void init() {
        useRelaxedHTTPSValidation();

        gatewayUrl = "https://" + "localhost" + ":" + 443;
        RestAssured.baseURI = gatewayUrl;
        RestAssured.port = 443;
    }

    @BeforeEach
    void setUp() {

        filterRepository.deleteAll();

        UserLoginInfo adminInfo = loginAndGetUserInfo("admin@example.com", "Password@1234");
        this.adminCookies = adminInfo.cookies;
        this.adminUserId = adminInfo.userId;
        
        UserLoginInfo userInfo = loginAndGetUserInfo("user@example.com", "Password@1234");
        this.userCookies = userInfo.cookies;
        this.regularUserId = userInfo.userId;
    }

    @AfterEach
    void tearDown() {
        filterRepository.deleteAll();
    }

    // ============= GET ALL FILTERS TESTS =============

    @Test
    @Order(1)
    @DisplayName("GET /api/v1/filters - Should return all filters")
    void shouldReturnAllFilters() {
        // Arrange
        createTestFilter("Summer Discount", new BigDecimal("15"));
        createTestFilter("Weekend Surcharge", new BigDecimal("20"));

        // Act & Assert
        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters")
        .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("[0].name", notNullValue())
            .body("[1].name", notNullValue());
    }

    @Test
    @Order(2)
    @DisplayName("GET /api/v1/filters - Should return empty list when no filters exist")
    void shouldReturnEmptyListWhenNoFilters() {
        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters")
        .then()
            .statusCode(204);
    }

    @Test
    @Order(3)
    @DisplayName("GET /api/v1/filters - Should be accessible by regular users")
    void shouldBeAccessibleByRegularUsers() {
        createTestFilter("Test Filter", new BigDecimal("10"));

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters")
        .then()
            .statusCode(200)
            .body("size()", equalTo(1));
    }

    // ============= GET FILTER BY ID TESTS =============

    @Test
    @Order(4)
    @DisplayName("GET /api/v1/filters/{id} - Should return filter by ID")
    void shouldReturnFilterById() {
        Filter filter = createTestFilter("Find By ID", new BigDecimal("25"));

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters/{id}", filter.getId())
        .then()
            .statusCode(200)
            .body("id", equalTo(filter.getId().intValue()))
            .body("name", equalTo("Find By ID"))
            .body("value", equalTo(25.0F));
    }

    @Test
    @Order(5)
    @DisplayName("GET /api/v1/filters/{id} - Should return 404 when filter not found")
    void shouldReturn404WhenFilterNotFound() {
        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters/{id}", 9999L)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(6)
    @DisplayName("GET /api/v1/filters/{id} - Should be accessible by regular users")
    void getByIdShouldBeAccessibleByRegularUsers() {
        Filter filter = createTestFilter("User Access", new BigDecimal("10"));

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters/{id}", filter.getId())
        .then()
            .statusCode(200)
            .body("id", equalTo(filter.getId().intValue()));
    }

    // ============= CREATE FILTER TESTS =============

    @Test
    @Order(7)
    @DisplayName("POST /api/v1/filters - Should create filter successfully")
    void shouldCreateFilterSuccessfully() {
        Map<String, Object> filterRequest = Map.of(
            "name", "New Discount",
            "description", "Test discount",
            "value", 15,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE",
            "activated", true,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(201)
            .body("id", notNullValue())
            .body("name", equalTo("New Discount"))
            .body("value", equalTo(15))
            .body("activated", equalTo(true));
    }

    @Test
    @Order(8)
    @DisplayName("POST /api/v1/filters - Should create filter with DATE_RANGE type")
    void shouldCreateFilterWithDateRange() {
        Map<String, Object> filterRequest = Map.of(
            "name", "Summer Special",
            "description", "Summer discount",
            "value", 20,
            "dateType", "DATE_RANGE",
            "startDate", "2024-06-01",
            "endDate", "2024-08-31",
            "conditionType", "NONE",
            "activated", true,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(201)
            .body("name", equalTo("Summer Special"))
            .body("dateType", equalTo("DATE_RANGE"))
            .body("startDate", equalTo("2024-06-01"))
            .body("endDate", equalTo("2024-08-31"));
    }

    @Test
    @Order(9)
    @DisplayName("POST /api/v1/filters - Should create filter with WEEK_DAYS type")
    void shouldCreateFilterWithWeekDays() {
        Map<String, Object> filterRequest = Map.of(
            "name", "Weekend Surcharge",
            "description", "Weekend extra charge",
            "value", 15,
            "dateType", "WEEK_DAYS",
            "weekDays", "6,7",
            "conditionType", "NONE",
            "activated", true,
            "increment", true
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(201)
            .body("name", equalTo("Weekend Surcharge"))
            .body("dateType", equalTo("WEEK_DAYS"))
            .body("weekDays", equalTo("6,7"))
            .body("increment", equalTo(true));
    }

    @Test
    @Order(10)
    @DisplayName("POST /api/v1/filters - Should create filter with LAST_MINUTE condition")
    void shouldCreateFilterWithLastMinuteCondition() {
        Map<String, Object> filterRequest = Map.of(
            "name", "Last Minute Deal",
            "description", "Last minute discount",
            "value", 30,
            "dateType", "EVERY_DAY",
            "conditionType", "LAST_MINUTE",
            "anticipationHours", 48,
            "activated", true,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(201)
            .body("name", equalTo("Last Minute Deal"))
            .body("conditionType", equalTo("LAST_MINUTE"))
            .body("anticipationHours", equalTo(48));
    }

    @Test
    @Order(11)
    @DisplayName("POST /api/v1/filters - Should create filter with LONG_STAY condition")
    void shouldCreateFilterWithLongStayCondition() {
        Map<String, Object> filterRequest = Map.of(
            "name", "Long Stay Discount",
            "description", "Discount for long stays",
            "value", 25,
            "dateType", "EVERY_DAY",
            "conditionType", "LONG_STAY",
            "minDays", 7,
            "activated", true,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(201)
            .body("name", equalTo("Long Stay Discount"))
            .body("conditionType", equalTo("LONG_STAY"))
            .body("minDays", equalTo(7));
    }

    @Test
    @Order(12)
    @DisplayName("POST /api/v1/filters - Should return 400 when name is missing")
    void shouldReturn400WhenNameIsMissing() {
        Map<String, Object> filterRequest = Map.of(
            "description", "Test",
            "value", 10,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE"
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(13)
    @DisplayName("POST /api/v1/filters - Should return 400 when value is out of range")
    void shouldReturn400WhenValueOutOfRange() {
        Map<String, Object> filterRequest = Map.of(
            "name", "Invalid Value",
            "value", 150,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE"
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(14)
    @DisplayName("POST /api/v1/filters - Should return 400 when DATE_RANGE without dates")
    void shouldReturn400WhenDateRangeWithoutDates() {
        Map<String, Object> filterRequest = Map.of(
            "name", "Invalid Date Range",
            "value", 10,
            "dateType", "DATE_RANGE",
            "conditionType", "NONE"
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(15)
    @DisplayName("POST /api/v1/filters - Should return 400 when WEEK_DAYS without days")
    void shouldReturn400WhenWeekDaysWithoutDays() {
        Map<String, Object> filterRequest = Map.of(
            "name", "Invalid Week Days",
            "value", 10,
            "dateType", "WEEK_DAYS",
            "conditionType", "NONE"
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(400);
    }

    // ============= UPDATE FILTER TESTS =============

    @Test
    @Order(16)
    @DisplayName("PUT /api/v1/filters/{id} - Should update filter successfully")
    void shouldUpdateFilterSuccessfully() {
        Filter filter = createTestFilter("Original Name", new BigDecimal("10"));

        Map<String, Object> updateRequest = Map.of(
            "name", "Updated Name",
            "description", "Updated description",
            "value", 20,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE",
            "activated", true,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/filters/{id}", filter.getId())
        .then()
            .statusCode(200)
            .body("id", equalTo(filter.getId().intValue()))
            .body("name", equalTo("Updated Name"))
            .body("value", equalTo(20));
    }

    @Test
    @Order(17)
    @DisplayName("PUT /api/v1/filters/{id} - Should update filter date type")
    void shouldUpdateFilterDateType() {
        Filter filter = createTestFilter("Change Date Type", new BigDecimal("15"));

        Map<String, Object> updateRequest = Map.of(
            "name", "Change Date Type",
            "value", 15,
            "dateType", "WEEK_DAYS",
            "weekDays", "1,2,3,4,5",
            "conditionType", "NONE",
            "activated", true,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/filters/{id}", filter.getId())
        .then()
            .statusCode(200)
            .body("dateType", equalTo("WEEK_DAYS"))
            .body("weekDays", equalTo("1,2,3,4,5"));
    }

    @Test
    @Order(18)
    @DisplayName("PUT /api/v1/filters/{id} - Should deactivate filter")
    void shouldDeactivateFilter() {
        Filter filter = createTestFilter("Active Filter", new BigDecimal("10"));

        Map<String, Object> updateRequest = Map.of(
            "name", "Active Filter",
            "value", 10,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE",
            "activated", false,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/filters/{id}", filter.getId())
        .then()
            .statusCode(200)
            .body("activated", equalTo(false));
    }

    @Test
    @Order(19)
    @DisplayName("PUT /api/v1/filters/{id} - Should return 400 when updating non-existent filter")
    void shouldReturn400WhenUpdatingNonExistentFilter() {
        Map<String, Object> updateRequest = Map.of(
            "name", "Non Existent",
            "value", 10,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE"
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/filters/{id}", 9999L)
        .then()
            .statusCode(400);
    }

    @Test
    @Order(20)
    @DisplayName("PUT /api/v1/filters/{id} - Should return 400 with invalid data")
    void shouldReturn400WhenUpdatingWithInvalidData() {
        Filter filter = createTestFilter("Valid Filter", new BigDecimal("10"));

        Map<String, Object> updateRequest = Map.of(
            "name", "Invalid Update",
            "value", -10,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE"
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/filters/{id}", filter.getId())
        .then()
            .statusCode(400);
    }

    // ============= DELETE FILTER TESTS =============

    @Test
    @Order(21)
    @DisplayName("DELETE /api/v1/filters/{id} - Should delete filter successfully")
    void shouldDeleteFilterSuccessfully() {
        Filter filter = createTestFilter("To Delete", new BigDecimal("10"));

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .delete("/api/v1/filters/{id}", filter.getId())
        .then()
            .statusCode(204);

        // Verify deletion
        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters/{id}", filter.getId())
        .then()
            .statusCode(404);
    }

    @Test
    @Order(22)
    @DisplayName("DELETE /api/v1/filters/{id} - Should return 404 when deleting non-existent filter")
    void shouldReturn404WhenDeletingNonExistentFilter() {
        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .delete("/api/v1/filters/{id}", 9999L)
        .then()
            .statusCode(404);
    }

    // ============= GET APPLICABLE FILTERS TESTS =============

    @Test
    @Order(23)
    @DisplayName("GET /api/v1/filters/applicable - Should return applicable filters for date range")
    void shouldReturnApplicableFiltersForDateRange() {
        createActiveFilterWithDateRange(
            "Summer Discount",
            new BigDecimal("15"),
            LocalDate.of(2024, 6, 1),
            LocalDate.of(2024, 8, 31)
        );

        LocalDate checkIn = LocalDate.now().plusDays(5);
        LocalDate checkOut = checkIn.plusDays(3);

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .queryParam("checkIn", checkIn.toString())
            .queryParam("checkOut", checkOut.toString())
        .when()
            .get("/api/v1/filters/applicable")
        .then()
            .statusCode(200)
            .body("checkInDate", equalTo(checkIn.toString()))
            .body("checkOutDate", equalTo(checkOut.toString()))
            .body("totalNights", equalTo(3))
            .body("filtersByDate", notNullValue());
    }

    @Test
    @Order(24)
    @DisplayName("GET /api/v1/filters/applicable - Should calculate correct number of nights")
    void shouldCalculateCorrectNumberOfNights() {
        LocalDate checkIn = LocalDate.now().plusDays(1);
        LocalDate checkOut = checkIn.plusDays(7);

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .queryParam("checkIn", checkIn.toString())
            .queryParam("checkOut", checkOut.toString())
        .when()
            .get("/api/v1/filters/applicable")
        .then()
            .statusCode(200)
            .body("totalNights", equalTo(7));
    }

    @Test
    @Order(25)
    @DisplayName("GET /api/v1/filters/applicable - Should return 400 when check-in is after check-out")
    void shouldReturn400WhenCheckInAfterCheckOut() {
        LocalDate checkIn = LocalDate.now().plusDays(10);
        LocalDate checkOut = LocalDate.now().plusDays(5);

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .queryParam("checkIn", checkIn.toString())
            .queryParam("checkOut", checkOut.toString())
        .when()
            .get("/api/v1/filters/applicable")
        .then()
            .statusCode(400)
            .body(containsString("Check-in date must be before check-out date"));
    }

    @Test
    @Order(26)
    @DisplayName("GET /api/v1/filters/applicable - Should return 400 when check-in equals check-out")
    void shouldReturn400WhenCheckInEqualsCheckOut() {
        LocalDate date = LocalDate.now().plusDays(5);

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .queryParam("checkIn", date.toString())
            .queryParam("checkOut", date.toString())
        .when()
            .get("/api/v1/filters/applicable")
        .then()
            .statusCode(400)
            .body(containsString("Check-in date must be before check-out date"));
    }

    @Test
    @Order(27)
    @DisplayName("GET /api/v1/filters/applicable - Should return 400 when check-in is in the past")
    void shouldReturn400WhenCheckInInPast() {
        LocalDate checkIn = LocalDate.now().minusDays(1);
        LocalDate checkOut = LocalDate.now().plusDays(3);

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .queryParam("checkIn", checkIn.toString())
            .queryParam("checkOut", checkOut.toString())
        .when()
            .get("/api/v1/filters/applicable")
        .then()
            .statusCode(400)
            .body(containsString("Check-in date cannot be in the past"));
    }

    @Test
    @Order(28)
    @DisplayName("GET /api/v1/filters/applicable - Should be accessible by regular users")
    void applicableFiltersShouldBeAccessibleByRegularUsers() {
        LocalDate checkIn = LocalDate.now().plusDays(5);
        LocalDate checkOut = checkIn.plusDays(3);

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .queryParam("checkIn", checkIn.toString())
            .queryParam("checkOut", checkOut.toString())
        .when()
            .get("/api/v1/filters/applicable")
        .then()
            .statusCode(200)
            .body("totalNights", equalTo(3));
    }

    // ============= COMPLEX SCENARIO TESTS =============

    @Test
    @Order(29)
    @DisplayName("E2E - Complete CRUD workflow")
    void shouldCompleteFullCRUDWorkflow() {
        // CREATE
        Map<String, Object> createRequest = Map.of(
            "name", "CRUD Test Filter",
            "description", "Testing CRUD",
            "value", 10,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE",
            "activated", true,
            "increment", false
        );

        Response createResponse = given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(createRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(201)
            .extract()
            .response();

        int filterId = createResponse.jsonPath().getInt("id");

        // READ
        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters/{id}", filterId)
        .then()
            .statusCode(200)
            .body("name", equalTo("CRUD Test Filter"));

        // UPDATE
        Map<String, Object> updateRequest = Map.of(
            "name", "Updated CRUD Test",
            "value", 25,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE",
            "activated", true,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/filters/{id}", filterId)
        .then()
            .statusCode(200)
            .body("name", equalTo("Updated CRUD Test"))
            .body("value", equalTo(25));

        // DELETE
        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .delete("/api/v1/filters/{id}", filterId)
        .then()
            .statusCode(204);

        // VERIFY DELETION
        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters/{id}", filterId)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(30)
    @DisplayName("E2E - Multiple filters with different types")
    void shouldHandleMultipleFiltersWithDifferentTypes() {
        // Create DATE_RANGE filter
        Map<String, Object> dateRangeFilter = Map.of(
            "name", "Summer Discount",
            "value", 15,
            "dateType", "DATE_RANGE",
            "startDate", "2024-06-01",
            "endDate", "2024-08-31",
            "conditionType", "NONE",
            "activated", true,
            "increment", false
        );

        // Create WEEK_DAYS filter
        Map<String, Object> weekDaysFilter = Map.of(
            "name", "Weekend Surcharge",
            "value", 20,
            "dateType", "WEEK_DAYS",
            "weekDays", "6,7",
            "conditionType", "NONE",
            "activated", true,
            "increment", true
        );

        // Create LONG_STAY filter
        Map<String, Object> longStayFilter = Map.of(
            "name", "Long Stay Discount",
            "value", 10,
            "dateType", "EVERY_DAY",
            "conditionType", "LONG_STAY",
            "minDays", 7,
            "activated", true,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(dateRangeFilter)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(201);

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(weekDaysFilter)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(201);

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(longStayFilter)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(201);

        // Verify all filters were created
        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters")
        .then()
            .statusCode(200)
            .body("size()", equalTo(3))
            .body("findAll { it.name == 'Summer Discount' }.size()", equalTo(1))
            .body("findAll { it.name == 'Weekend Surcharge' }.size()", equalTo(1))
            .body("findAll { it.name == 'Long Stay Discount' }.size()", equalTo(1));
    }

    @Test
    @Order(31)
    @DisplayName("E2E - Filter activation and deactivation workflow")
    void shouldHandleFilterActivationWorkflow() {
        // Create active filter
        Map<String, Object> filterRequest = Map.of(
            "name", "Activation Test",
            "value", 10,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE",
            "activated", true,
            "increment", false
        );

        Response createResponse = given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(201)
            .body("activated", equalTo(true))
            .extract()
            .response();

        int filterId = createResponse.jsonPath().getInt("id");

        // Deactivate filter
        Map<String, Object> deactivateRequest = Map.of(
            "name", "Activation Test",
            "value", 10,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE",
            "activated", false,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(deactivateRequest)
        .when()
            .put("/api/v1/filters/{id}", filterId)
        .then()
            .statusCode(200)
            .body("activated", equalTo(false));

        // Reactivate filter
        Map<String, Object> reactivateRequest = Map.of(
            "name", "Activation Test",
            "value", 10,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE",
            "activated", true,
            "increment", false
        );

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(reactivateRequest)
        .when()
            .put("/api/v1/filters/{id}", filterId)
        .then()
            .statusCode(200)
            .body("activated", equalTo(true));
    }

    // == AUTHENTICATION & AUTHORIZATION TESTS ==

    @Test
    @Order(32)
    @DisplayName("Should return 401 when accessing endpoints without authentication")
    void shouldReturn401WhenNoAuthentication() {
        // GET all filters (should be accessible by anyone)
        given()
            .contentType(ContentType.JSON)
        .when()
            .get("/api/v1/filters")
        .then()
            .statusCode(anyOf(equalTo(200), equalTo(204)));

        // CREATE filter
        Map<String, Object> filterRequest = Map.of(
            "name", "No Auth Filter",
            "value", 10,
            "dateType", "EVERY_DAY",
            "conditionType", "NONE"
        );

        given()
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .post("/api/v1/filters")
        .then()
            .statusCode(401);
        
        // UPDATE filter
        given()
            .contentType(ContentType.JSON)
            .body(filterRequest)
        .when()
            .put("/api/v1/filters/{id}", 1L)
        .then()
            .statusCode(401);

        // DELETE filter
        given()
            .contentType(ContentType.JSON)
        .when()
            .delete("/api/v1/filters/{id}", 1L)
        .then()
            .statusCode(401);

            
    }

    // ============= HELPER METHODS =============

    private UserLoginInfo loginAndGetUserInfo(String username, String password) {
        Map<String, String> loginRequest = Map.of(
            "username", username,
            "password", password
        );

        Response loginResponse = given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/v1/auth/login")
        .then()
            .statusCode(200)
            .body("status", equalTo("SUCCESS"))
            .extract()
            .response();

        Map<String, String> cookies = loginResponse.getCookies();
        
        if (cookies.isEmpty()) {
            throw new RuntimeException("No cookies received for username: " + username);
        }

        Response userInfoResponse = given()
            .cookies(cookies)
        .when()
            .get("/api/v1/users/me")
        .then()
            .statusCode(200)
            .body("id", notNullValue())
            .body("email", equalTo(username))
            .extract()
            .response();

        Long userId = userInfoResponse.jsonPath().getLong("id");
        
        return new UserLoginInfo(cookies, userId);
    }

    private Filter createTestFilter(String name, BigDecimal value) {
        Filter filter = new Filter();
        filter.setName(name);
        filter.setDescription("Test Description");
        filter.setActivated(true);
        filter.setIncrement(false);
        filter.setValue(value);
        filter.setDateType(DateType.EVERY_DAY);
        filter.setConditionType(ConditionType.NONE);
        return filterRepository.save(filter);
    }

    private Filter createActiveFilter(String name, BigDecimal value, boolean activated) {
        Filter filter = new Filter();
        filter.setName(name);
        filter.setDescription("Test Description");
        filter.setActivated(activated);
        filter.setIncrement(false);
        filter.setValue(value);
        filter.setDateType(DateType.EVERY_DAY);
        filter.setConditionType(ConditionType.NONE);
        return filterRepository.save(filter);
    }

    private Filter createActiveFilterWithDateRange(String name, BigDecimal value, 
                                                    LocalDate startDate, LocalDate endDate) {
        Filter filter = new Filter();
        filter.setName(name);
        filter.setDescription("Test Description");
        filter.setActivated(true);
        filter.setIncrement(false);
        filter.setValue(value);
        filter.setDateType(DateType.DATE_RANGE);
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);
        filter.setConditionType(ConditionType.NONE);
        return filterRepository.save(filter);
    }

    private static class UserLoginInfo {
        final Map<String, String> cookies;
        final Long userId;
        
        UserLoginInfo(Map<String, String> cookies, Long userId) {
            this.cookies = cookies;
            this.userId = userId;
        }
    }
}
