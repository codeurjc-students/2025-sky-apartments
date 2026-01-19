package com.skyapartments.booking.e2e;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import com.skyapartments.booking.dto.BookingRequestDTO;
import com.skyapartments.booking.model.Booking;
import com.skyapartments.booking.model.BookingState;
import com.skyapartments.booking.repository.BookingRepository;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;


@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(OrderAnnotation.class)
public class Bookinge2eTest {

    @Autowired
    private BookingRepository bookingRepository;

    private Booking savedBooking;
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
        bookingRepository.deleteAll();

        UserLoginInfo adminInfo = loginAndGetUserInfo("admin@example.com", "Password@1234");
        this.adminCookies = adminInfo.cookies;
        this.adminUserId = adminInfo.userId;
        
        UserLoginInfo userInfo = loginAndGetUserInfo("user@example.com", "Password@1234");
        this.userCookies = userInfo.cookies;
        this.regularUserId = userInfo.userId;

   
        savedBooking = bookingRepository.save(new Booking(
            userInfo.userId, 
            1L, 
            LocalDate.now().plusDays(10), 
            LocalDate.now().plusDays(15),
            BigDecimal.valueOf(500.0),
            2
        ));
    }

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
            throw new RuntimeException("There weren´t receive cookies for username: " + username);
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

    private static class UserLoginInfo {
        final Map<String, String> cookies;
        final Long userId;
        
        UserLoginInfo(Map<String, String> cookies, Long userId) {
            this.cookies = cookies;
            this.userId = userId;
        }
    }

    // ==================== GET BOOKINGS BY USER ID TESTS ====================

    @Test
    @Order(1)
    public void getBookingsByUserId_ShouldReturnBookings_WhenUserHasBookingsAndIsAuthenticated() {
        given()
            .cookies(userCookies)
        .when()
            .get("/api/v1/bookings/user/{userId}", savedBooking.getUserId())
        .then()
            .log().all()
            .statusCode(200)
            .body("size()", greaterThan(0))
            .body("[0].userId", equalTo(regularUserId.intValue()))
            .body("[0].apartmentId", equalTo(savedBooking.getApartmentId().intValue()))
            .body("[0].state", equalTo("CONFIRMED"));
    }

    @Test
    @Order(2)
    public void getBookingsByUserId_ShouldReturn204_WhenUserHasNoBookings() {
        given()
            .cookies(adminCookies)
        .when()
            .get("/api/v1/bookings/user/{userId}", adminUserId)
        .then()
            .statusCode(204);
    }

    @Test
    @Order(3)
    public void getBookingsByUserId_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        given()
        .when()
            .get("/api/v1/bookings/user/{userId}", regularUserId)
        .then()
            .statusCode(401);
    }

    @Test
    @Order(4)
    public void getBookingsByUserId_ShouldReturnForbidden_WhenUserEmailDoesNotMatchUserId() {
        given()
            .cookies(userCookies)
        .when()
            .get("/api/v1/bookings/user/{userId}", adminUserId)
        .then()
            .statusCode(anyOf(equalTo(403), equalTo(500)));
    }

    @Test
    @Order(5)
    public void getBookingsByUserId_ShouldReturnNotFound_WhenUserDoesNotExist() {
        Long nonExistentUserId = 99999L;
        
        given()
            .cookies(userCookies)
        .when()
            .get("/api/v1/bookings/user/{userId}", nonExistentUserId)
        .then()
            .statusCode(anyOf(equalTo(404), equalTo(500)));
    }

    @Test
    @Order(6)
    public void getBookingsByUserId_ShouldReturnPaginatedResults() {
        for (int i = 1; i <= 15; i++) {
            bookingRepository.save(new Booking(
                regularUserId, 
                1L, 
                LocalDate.now().plusDays(20 + i), 
                LocalDate.now().plusDays(25 + i),
                BigDecimal.valueOf(100.0 * i),
                2
            ));
        }

        given()
            .cookies(userCookies)
            .queryParam("page", "0")
            .queryParam("pageSize", "5")
        .when()
            .get("/api/v1/bookings/user/{userId}", regularUserId)
        .then()
            .statusCode(200)
            .body("size()", equalTo(5));
    }

    // ==================== GET BOOKINGS BY APARTMENT ID TESTS ====================

    @Test
    @Order(7)
    public void getBookingsByApartmentId_ShouldReturnBookings_WhenApartmentHasBookingsAndUserIsAdmin() {
        given()
            .cookies(adminCookies)
        .when()
            .get("/api/v1/bookings/apartment/{apartmentId}", 1L)
        .then()
            .log().all()
            .statusCode(200)
            .body("size()", greaterThan(0))
            .body("[0].apartmentId", equalTo(1));
    }

    @Test
    @Order(8)
    public void getBookingsByApartmentId_ShouldReturn204_WhenApartmentHasNoBookingsAndUserIsAdmin() {
        
        given()
            .cookies(adminCookies)
        .when()
            .get("/api/v1/bookings/apartment/{apartmentId}", 2L)
        .then()
            .statusCode(204);
    }

    @Test
    @Order(9)
    public void getBookingsByApartmentId_ShouldReturnNotFound_WhenApartmentDoesNotExistAndUserIsAdmin() {
        Long nonExistentApartmentId = 99999L;
        
        given()
            .cookies(adminCookies)
        .when()
            .get("/api/v1/bookings/apartment/{apartmentId}", nonExistentApartmentId)
        .then()
            .statusCode(anyOf(equalTo(404), equalTo(500)));
    }

    @Test
    @Order(10)
    public void getBookingsByApartmentId_ShouldReturnPaginatedResults_WhenUserIsAdmin() {
        given()
            .cookies(adminCookies)
            .queryParam("page", "0")
            .queryParam("pageSize", "10")
        .when()
            .get("/api/v1/bookings/apartment/{apartmentId}", 1L)
        .then()
            .statusCode(200);
    }

    @Test
    @Order(11)
    public void getBookingsByApartmentId_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        given()
        .when()
            .get("/api/v1/bookings/apartment/{apartmentId}", 1L)
        .then()
            .statusCode(401);
    }

    @Test
    @Order(12)
    public void getBookingsByApartmentId_ShouldReturnForbidden_WhenUserIsNotAdmin() {
        given()
            .cookies(userCookies)
        .when()
            .get("/api/v1/bookings/apartment/{apartmentId}", 1L)
        .then()
            .statusCode(403);
    }

    @Test
    @Order(13)
    public void getBookingsByApartmentId_ShouldReturnUnauthorized_WhenTokenIsInvalid() {
        given()
            .cookie("AuthToken", "invalid-token")
        .when()
            .get("/api/v1/bookings/apartment/{apartmentId}", 1L)
        .then()
            .statusCode(401);
    }

    @Test
    @Order(14)
    public void getBookingsByApartmentId_ShouldReturnSecondPage_WhenUserIsAdminAndMultipleBookingsExist() {
        for (int i = 1; i <= 15; i++) {
            bookingRepository.save(new Booking(
                adminUserId, 
                1L, 
                LocalDate.now().plusDays(100 + i), 
                LocalDate.now().plusDays(105 + i),
                BigDecimal.valueOf(100.0 * i),
                2
            ));
        }

        given()
            .cookies(adminCookies)
            .queryParam("page", "1")
            .queryParam("pageSize", "5")
        .when()
            .get("/api/v1/bookings/apartment/{apartmentId}", 1L)
        .then()
            .statusCode(200);
    }

    // ==================== CREATE BOOKING TESTS ====================

    @Test
    @Order(15)
    public void createBooking_ShouldCreateBooking_WhenValidDataAndUserAuthenticated() {

        BookingRequestDTO bookingRequest = new BookingRequestDTO();
        bookingRequest.setUserId(regularUserId);
        bookingRequest.setApartmentId(1L);
        bookingRequest.setStartDate(LocalDate.now());
        bookingRequest.setEndDate(LocalDate.now().plusDays(3));
        bookingRequest.setGuests(2);

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .log().all()
            .statusCode(201)
            .body("id", notNullValue())
            .body("userId", equalTo(regularUserId.intValue()))
            .body("apartmentId", equalTo(1))
            .body("state", equalTo("CONFIRMED"))
            .body("cost", notNullValue());
    }

    @Test
    @Order(16)
    public void createBooking_ShouldDenyAccess_WhenValidDataAndAdminAuthenticated() {

        BookingRequestDTO bookingRequest = new BookingRequestDTO();
        bookingRequest.setUserId(adminUserId);
        bookingRequest.setApartmentId(1L);
        bookingRequest.setStartDate(LocalDate.now());
        bookingRequest.setEndDate(LocalDate.now().plusDays(3));
        bookingRequest.setGuests(3);

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(403);
    }

    @Test
    @Order(17)
    public void createBooking_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", "2024-12-01",
            "endDate", "2024-12-05",
            "guests", 2
        );

        given()
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(401);
    }

    @Test
    @Order(18)
    public void createBooking_ShouldReturnBadRequest_WhenUserIdIsNull() {
        Map<String, Object> bookingRequest = Map.of(
            "apartmentId", 1L,
            "startDate", "2024-12-01",
            "endDate", "2024-12-05",
            "guests", 2
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(19)
    public void createBooking_ShouldReturnBadRequest_WhenApartmentIdIsNull() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "startDate", "2024-12-01",
            "endDate", "2024-12-05",
            "guests", 2
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(20)
    public void createBooking_ShouldReturnBadRequest_WhenStartDateIsNull() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "endDate", "2024-12-05",
            "guests", 2
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(21)
    public void createBooking_ShouldReturnBadRequest_WhenEndDateIsNull() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", "2024-12-01",
            "guests", 2
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(22)
    public void createBooking_ShouldReturnBadRequest_WhenStartDateIsInPast() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", "2020-01-01",
            "endDate", "2024-12-05",
            "guests", 2
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(23)
    public void createBooking_ShouldReturnBadRequest_WhenEndDateIsNotInFuture() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", LocalDate.now().toString(),
            "endDate", LocalDate.now().toString(),
            "guests", 2
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(24)
    public void createBooking_ShouldReturnBadRequest_WhenGuestsIsZero() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", "2024-12-01",
            "endDate", "2024-12-05",
            "guests", 0 
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(25)
    public void createBooking_ShouldReturnBadRequest_WhenGuestsExceedsMaximum() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", "2024-12-01",
            "endDate", "2024-12-05",
            "guests", 11
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(26)
    public void createBooking_ShouldReturnForbidden_WhenUserEmailDoesNotMatchUserId() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", adminUserId,
            "apartmentId", 1L,
            "startDate", "2026-12-01",
            "endDate", "2026-12-05",
            "guests", 2
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(anyOf(equalTo(403), equalTo(500)));
    }

    @Test
    @Order(27)
    public void createBooking_ShouldReturnNotFound_WhenUserDoesNotExist() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", 99999L,
            "apartmentId", 1L,
            "startDate", "2026-12-01",
            "endDate", "2026-12-05",
            "guests", 2
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(anyOf(equalTo(404), equalTo(500)));
    }

    @Test
    @Order(28)
    public void createBooking_ShouldReturnNotFound_WhenApartmentDoesNotExist() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 99999L,
            "startDate", "2026-12-01",
            "endDate", "2026-12-05",
            "guests", 2
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(anyOf(equalTo(404), equalTo(500)));
    }

    // ==================== CANCEL BOOKING TESTS ====================

    @Test
    @Order(29)
    public void cancelBooking_ShouldCancelBooking_WhenOwnerAuthenticated() {
        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/bookings/{bookingId}", savedBooking.getId())
        .then()
            .log().all()
            .statusCode(200)
            .body("id", equalTo(savedBooking.getId().intValue()))
            .body("state", equalTo("CANCELLED"));
    }

    @Test
    @Order(30)
    public void cancelBooking_ShouldCancelBooking_WhenAdminAuthenticated() {
       
        Booking adminBooking = bookingRepository.save(new Booking(
            adminUserId, 
            1L, 
            LocalDate.now().plusDays(30), 
            LocalDate.now().plusDays(35),
            BigDecimal.valueOf(500.0),
            2
        ));

        given()
            .cookies(adminCookies)
        .when()
            .delete("/api/v1/bookings/{bookingId}", adminBooking.getId())
        .then()
            .statusCode(200)
            .body("state", equalTo("CANCELLED"));
    }

    @Test
    @Order(31)
    public void cancelBooking_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        given()
        .when()
            .delete("/api/v1/bookings/{bookingId}", savedBooking.getId())
        .then()
            .statusCode(401);
    }

    @Test
    @Order(32)
    public void cancelBooking_ShouldReturnNotFound_WhenBookingDoesNotExist() {
        Long nonExistentId = 99999L;
        
        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/bookings/{bookingId}", nonExistentId)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(33)
    public void cancelBooking_ShouldReturnForbidden_WhenUserNotOwner() {
        given()
            .cookies(adminCookies)
        .when()
            .delete("/api/v1/bookings/{bookingId}", savedBooking.getId())
        .then()
            .statusCode(anyOf(equalTo(403), equalTo(500))); 
    }

    @Test
    @Order(34)
    public void cancelBooking_ShouldReturnBadRequest_WhenBookingAlreadyCancelled() {
   
        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/bookings/{bookingId}", savedBooking.getId());

 
        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/bookings/{bookingId}", savedBooking.getId())
        .then()
            .statusCode(400);
    }

    // ==================== UPDATE BOOKING DATES TESTS ====================

    @Test
    @Order(35)
    public void updateBookingDates_ShouldUpdateDates_WhenValidDataAndOwnerAuthenticated() {
        LocalDate newStartDate = LocalDate.now().plusDays(50);
        LocalDate newEndDate = LocalDate.now().plusDays(55);

        given()
            .cookies(userCookies)
            .queryParam("startDate", newStartDate.toString())
            .queryParam("endDate", newEndDate.toString())
        .when()
            .put("/api/v1/bookings/{bookingId}/dates", savedBooking.getId())
        .then()
            .log().all()
            .statusCode(200)
            .body("id", equalTo(savedBooking.getId().intValue()))
            .body("startDate", equalTo(newStartDate.toString()))
            .body("endDate", equalTo(newEndDate.toString()))
            .body("cost", notNullValue());
    }

    @Test
    @Order(36)
    public void updateBookingDates_ShouldUpdateDates_WhenValidDataAndAdminAuthenticated() {
       
        Booking adminBooking = bookingRepository.save(new Booking(
            adminUserId, 
            1L, 
            LocalDate.now().plusDays(40), 
            LocalDate.now().plusDays(45),
            BigDecimal.valueOf(500.0),
            2
        ));

        LocalDate newStartDate = LocalDate.now().plusDays(60);
        LocalDate newEndDate = LocalDate.now().plusDays(65);

        given()
            .cookies(adminCookies)
            .queryParam("startDate", newStartDate.toString())
            .queryParam("endDate", newEndDate.toString())
        .when()
            .put("/api/v1/bookings/{bookingId}/dates", adminBooking.getId())
        .then()
            .statusCode(200)
            .body("startDate", equalTo(newStartDate.toString()))
            .body("endDate", equalTo(newEndDate.toString()));
    }

    @Test
    @Order(37)
    public void updateBookingDates_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        given()
            .queryParam("startDate", "2024-12-01")
            .queryParam("endDate", "2024-12-05")
        .when()
            .put("/api/v1/bookings/{bookingId}/dates", savedBooking.getId())
        .then()
            .statusCode(401);
    }

    @Test
    @Order(38)
    public void updateBookingDates_ShouldReturnNotFound_WhenBookingDoesNotExist() {
        Long nonExistentId = 99999L;
        
        given()
            .cookies(userCookies)
            .queryParam("startDate", "2024-12-01")
            .queryParam("endDate", "2024-12-05")
        .when()
            .put("/api/v1/bookings/{bookingId}/dates", nonExistentId)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(39)
    public void updateBookingDates_ShouldReturnForbidden_WhenUserNotOwner() {
        given()
            .cookies(adminCookies)
            .queryParam("startDate", "2024-12-01")
            .queryParam("endDate", "2024-12-05")
        .when()
            .put("/api/v1/bookings/{bookingId}/dates", savedBooking.getId())
        .then()
            .statusCode(anyOf(equalTo(403), equalTo(500)));
    }

    @Test
    @Order(40)
    public void updateBookingDates_ShouldReturnBadRequest_WhenEndDateBeforeStartDate() {
        given()
            .cookies(userCookies)
            .queryParam("startDate", "2024-12-10")
            .queryParam("endDate", "2024-12-05")
        .when()
            .put("/api/v1/bookings/{bookingId}/dates", savedBooking.getId())
        .then()
            .statusCode(400);
    }

    @Test
    @Order(41)
    public void updateBookingDates_ShouldReturnBadRequest_WhenBookingIsCancelled() {

        savedBooking.setState(BookingState.CANCELLED);
        bookingRepository.save(savedBooking);

        given()
            .cookies(userCookies)
            .queryParam("startDate", "2024-12-01")
            .queryParam("endDate", "2024-12-05")
        .when()
            .put("/api/v1/bookings/{bookingId}/dates", savedBooking.getId())
        .then()
            .statusCode(400);
    }

    @Test
    @Order(42)
    public void updateBookingDates_ShouldReturnBadRequest_WhenDateParametersAreMissing() {
        given()
            .cookies(userCookies)
            .queryParam("startDate", "2024-12-01")
           
        .when()
            .put("/api/v1/bookings/{bookingId}/dates", savedBooking.getId())
        .then()
            .statusCode(400);
    }

    @Test
    @Order(43)
    public void updateBookingDates_ShouldReturnBadRequest_WhenDatesOverlapWithExistingBooking() {
   
        Booking existingBooking = bookingRepository.save(new Booking(
            regularUserId, 
            1L, 
            LocalDate.now().plusDays(70), 
            LocalDate.now().plusDays(75),
            BigDecimal.valueOf(500.0),
            2
        ));

      
        given()
            .cookies(userCookies)
            .queryParam("startDate", LocalDate.now().plusDays(72).toString()) // Se solapa
            .queryParam("endDate", LocalDate.now().plusDays(77).toString())
        .when()
            .put("/api/v1/bookings/{bookingId}/dates", savedBooking.getId())
        .then()
            .statusCode(400);
    }

    // ==================== EDGE CASES AND BOUNDARY VALUES ====================

    @Test
    @Order(44)
    public void createBooking_ShouldWorkWithBoundaryValues_WhenGuestsAtMinimum() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", "2026-01-01",
            "endDate", "2026-01-02",
            "guests", 1
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(201)
            .body("guests", equalTo(1));
    }

    @Test
    @Order(45)
    public void createBooking_ShouldWorkWithBoundaryValues_WhenGuestsAtMaximum() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", "2026-02-01",
            "endDate", "2026-02-02",
            "guests", 10 
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(201)
            .body("guests", equalTo(10));
    }

    @Test
    @Order(46)
    public void createBooking_ShouldWorkWithBoundaryValues_WhenStartDateIsToday() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", LocalDate.now().toString(),
            "endDate", LocalDate.now().plusDays(1).toString(),
            "guests", 2
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(201);
    }

    // ==================== PAGINATION TESTS ====================

    @Test
    @Order(47)
    public void getBookingsByUserId_ShouldReturnSecondPage_WhenMultipleBookingsExist() {
        given()
            .cookies(userCookies)
            .queryParam("page", "1")
            .queryParam("pageSize", "10")
        .when()
            .get("/api/v1/bookings/user/{userId}", regularUserId)
        .then()
            .statusCode(anyOf(equalTo(200), equalTo(204)));
    }

    @Test
    @Order(48)
    public void getBookingsByApartmentId_ShouldReturnSecondPage_WhenMultipleBookingsExist() {
        given()
            .cookies(adminCookies)
            .queryParam("page", "1")
            .queryParam("pageSize", "5")
        .when()
            .get("/api/v1/bookings/apartment/{apartmentId}", 1L)
        .then()
            .statusCode(anyOf(equalTo(200), equalTo(204)));
    }

    // ==================== SECURITY TESTS ====================

    @Test
    @Order(49)
    public void bookingOperations_ShouldReturnUnauthorized_WhenTokenIsInvalid() {
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", "2025-05-01",
            "endDate", "2025-05-05",
            "guests", 2
        );

        given()
            .cookie("AuthToken", "invalid-token")
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings")
        .then()
            .statusCode(401);
    }

    @Test
    @Order(50)
    public void bookingOperations_ShouldReturnUnauthorized_WhenTokenIsExpired() {
        given()
            .cookie("AuthToken", "expired.jwt.token")
        .when()
            .get("/api/v1/bookings/user/{userId}", regularUserId)
        .then()
            .statusCode(401);
    }

    // ==================== DATA CONSISTENCY TESTS ====================

    @Test
    @Order(51)
    public void bookingWorkflow_ShouldMaintainDataConsistency_ThroughFullLifecycle() {
        // Crear booking
        Map<String, Object> bookingRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", 1L,
            "startDate", "2026-06-01",
            "endDate", "2026-06-05",
            "guests", 3
        );

        Response createResponse = given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(bookingRequest)
        .when()
            .post("/api/v1/bookings");

        createResponse.then().statusCode(201);
        Long bookingId = createResponse.jsonPath().getLong("id");

        given()
            .cookies(userCookies)
            .queryParam("startDate", "2025-06-10")
            .queryParam("endDate", "2025-06-15")
        .when()
            .put("/api/v1/bookings/{bookingId}/dates", bookingId)
        .then()
            .statusCode(200)
            .body("startDate", equalTo("2025-06-10"))
            .body("endDate", equalTo("2025-06-15"));

        given()
            .cookies(userCookies)
        .when()
            .get("/api/v1/bookings/user/{userId}", regularUserId)
        .then()
            .statusCode(200)
            .body("findAll { it.id == " + bookingId + " }.size()", equalTo(1));

        
        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/bookings/{bookingId}", bookingId)
        .then()
            .statusCode(200)
            .body("state", equalTo("CANCELLED"));
        given()
            .cookies(userCookies)
        .when()
            .get("/api/v1/bookings/user/{userId}", regularUserId)
        .then()
            .statusCode(200)
            .body("find { it.id == " + bookingId + " }.state", equalTo("CANCELLED"));
    }

    @Test
    @Order(52)
    public void getUnavailableApartments_ShouldReturnForbidden() {
    
        Booking cancelledBooking = bookingRepository.save(new Booking(
            regularUserId, 
            1L, 
            LocalDate.now().plusDays(100), 
            LocalDate.now().plusDays(105),
            BigDecimal.valueOf(500.0),
            2
        ));
        cancelledBooking.setState(BookingState.CANCELLED);
        bookingRepository.save(cancelledBooking);

        LocalDate startDate = LocalDate.now().plusDays(98);
        LocalDate endDate = LocalDate.now().plusDays(107);

        given()
            .queryParam("startDate", startDate.toString())
            .queryParam("endDate", endDate.toString())
        .when()
            .get("/api/v1/bookings/private/unavailable")
        .then()
            .statusCode(403);
    }

}
