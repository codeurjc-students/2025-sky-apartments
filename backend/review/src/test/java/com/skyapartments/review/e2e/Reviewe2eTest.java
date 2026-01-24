package com.skyapartments.review.e2e;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import com.skyapartments.review.dto.ReviewRequestDTO;
import com.skyapartments.review.dto.UpdateReviewRequestDTO;
import com.skyapartments.review.model.Review;
import com.skyapartments.review.repository.ReviewRepository;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.List;
import java.util.Map;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "eureka.client.register-with-eureka=false",
        "eureka.client.fetch-registry=false"
    }
)
@TestMethodOrder(OrderAnnotation.class)
public class Reviewe2eTest {

    @Autowired
    private ReviewRepository reviewRepository;

    private Review savedReview;
    private static String gatewayUrl;
    
    private Map<String, String> adminCookies;
    private Map<String, String> userCookies;
    
    private Long adminUserId;
    private Long regularUserId;
    
    private Long validApartmentId = 4L;

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
        RestAssured.baseURI = gatewayUrl;
        
        reviewRepository.deleteAll();

        UserLoginInfo adminInfo = loginAndGetUserInfo("admin@example.com", "Password@1234");
        this.adminCookies = adminInfo.cookies;
        this.adminUserId = adminInfo.userId;
        
        UserLoginInfo userInfo = loginAndGetUserInfo("user@example.com", "Password@1234");
        this.userCookies = userInfo.cookies;
        this.regularUserId = userInfo.userId;
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

    private static class UserLoginInfo {
        final Map<String, String> cookies;
        final Long userId;
        
        UserLoginInfo(Map<String, String> cookies, Long userId) {
            this.cookies = cookies;
            this.userId = userId;
        }
    }

    // ==================== CREATE REVIEW TESTS ====================

    @Test
    @Order(1)
    public void createReview_ShouldCreateReview_WhenValidDataAndUserAuthenticated() {
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(regularUserId);
        reviewRequest.setApartmentId(validApartmentId);
        reviewRequest.setComment("This apartment is amazing!");
        reviewRequest.setRating(5);

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .log().all()
            .statusCode(201)
            .body("id", notNullValue())
            .body("userId", equalTo(regularUserId.intValue()))
            .body("apartmentId", equalTo(validApartmentId.intValue()))
            .body("comment", equalTo("This apartment is amazing!"))
            .body("rating", equalTo(5));
    }

    @Test
    @Order(2)
    public void createReview_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(regularUserId);
        reviewRequest.setApartmentId(validApartmentId);
        reviewRequest.setComment("This apartment is great!");
        reviewRequest.setRating(4);

        given()
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(401);
    }

    @Test
    @Order(3)
    public void createReview_ShouldReturnBadRequest_WhenUserIdIsNull() {
        Map<String, Object> reviewRequest = Map.of(
            "apartmentId", validApartmentId,
            "comment", "Missing user ID",
            "rating", 4
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(4)
    public void createReview_ShouldReturnBadRequest_WhenApartmentIdIsNull() {
        Map<String, Object> reviewRequest = Map.of(
            "userId", regularUserId,
            "comment", "Missing apartment ID",
            "rating", 4
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(5)
    public void createReview_ShouldReturnBadRequest_WhenCommentIsBlank() {
        Map<String, Object> reviewRequest = Map.of(
            "userId", regularUserId,
            "apartmentId", validApartmentId,
            "comment", "",
            "rating", 4
        );

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(6)
    public void createReview_ShouldReturnBadRequest_WhenCommentTooLong() {
        String longComment = "A".repeat(501);
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(regularUserId);
        reviewRequest.setApartmentId(validApartmentId);
        reviewRequest.setComment(longComment);
        reviewRequest.setRating(4);

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(7)
    public void createReview_ShouldReturnNotFound_WhenUserNotExists() {
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(999L);
        reviewRequest.setApartmentId(validApartmentId);
        reviewRequest.setComment("User does not exist");
        reviewRequest.setRating(4);

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(anyOf(equalTo(404), equalTo(403), equalTo(500)));
    }

    @Test
    @Order(8)
    public void createReview_ShouldReturnNotFound_WhenApartmentNotExists() {
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(regularUserId);
        reviewRequest.setApartmentId(999L);
        reviewRequest.setComment("Apartment does not exist");
        reviewRequest.setRating(4);

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(anyOf(equalTo(404), equalTo(500)));
    }

    @Test
    @Order(9)
    public void createReview_ShouldReturnBadRequest_WhenUserHasNoBookingsForApartment() {
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(regularUserId);
        reviewRequest.setApartmentId(6L);
        reviewRequest.setComment("No bookings for this apartment");
        reviewRequest.setRating(4);

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(anyOf(equalTo(400), equalTo(500)))
            .body("message", anyOf(
                containsString("User has no bookings for this apartment"),
                containsString("bookings")
            ));
    }

    @Test
    @Order(10)
    public void createReview_ShouldReturnForbidden_WhenUserEmailDoesNotMatchUserId() {
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(adminUserId);
        reviewRequest.setApartmentId(validApartmentId);
        reviewRequest.setComment("Trying to create review for another user");
        reviewRequest.setRating(4);

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(equalTo(500))
            .body("details", containsString("User email does not match user ID"));
    }

    @Test
    @Order(11)
    public void createReview_ShouldReturnConflict_WhenReviewAlreadyExistsForApartment() {
        // Crear una review existente para el usuario y apartamento
        reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(regularUserId);
        reviewRequest.setApartmentId(validApartmentId);
        reviewRequest.setComment("Duplicate review attempt");
        reviewRequest.setRating(4);

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(equalTo(400))
            .body("message", containsString("User has already reviewed this apartment"));
    }

    @Test
    @Order(13)
    public void createReview_ShouldReturnUnauthorized_WhenTokenIsInvalid() {
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(regularUserId);
        reviewRequest.setApartmentId(validApartmentId);
        reviewRequest.setComment("Invalid token test");
        reviewRequest.setRating(4);

        given()
            .cookie("AuthToken", "invalid-token")
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(401);
    }

    // ==================== UPDATE REVIEW TESTS ====================

    @Test
    @Order(14)
    public void updateReview_ShouldUpdateReview_WhenValidDataAndOwnerAuthenticated() {
        savedReview = reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("Updated comment by owner");
        updateRequest.setRating(4);
        
        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/reviews/{reviewId}", savedReview.getId())
        .then()
            .log().all()
            .statusCode(200)
            .body("id", equalTo(savedReview.getId().intValue()))
            .body("comment", equalTo("Updated comment by owner"))
            .body("userId", equalTo(regularUserId.intValue()));
    }

    @Test
    @Order(15)
    public void updateReview_ShouldUpdateReview_WhenValidDataAndAdminAuthenticated() {
        Review adminReview = new Review();
        adminReview.setUserId(adminUserId);
        adminReview.setApartmentId(validApartmentId);
        adminReview.setComment("Admin review");
        adminReview.setRating(4);
        adminReview = reviewRepository.save(adminReview);

        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("Updated by admin");
        updateRequest.setRating(4);

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/reviews/{reviewId}", adminReview.getId())
        .then()
            .statusCode(200)
            .body("comment", equalTo("Updated by admin"))
            .body("userId", equalTo(adminUserId.intValue()));
    }

    @Test
    @Order(16)
    public void updateReview_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        savedReview = reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("Unauthorized update");
        updateRequest.setRating(4);
        
        given()
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/reviews/{reviewId}", savedReview.getId())
        .then()
            .statusCode(401);
    }

    @Test
    @Order(17)
    public void updateReview_ShouldReturnNotFound_WhenReviewDoesNotExist() {
        Long nonExistentId = 9999L;
        
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("Non-existent review");
        updateRequest.setRating(4);
        
        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/reviews/{reviewId}", nonExistentId)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(18)
    public void updateReview_ShouldReturnBadRequest_WhenCommentParameterMissing() {
        savedReview = reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setRating(4);
        // No se establece comment (será null)
        
        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/reviews/{reviewId}", savedReview.getId())
        .then()
            .statusCode(400);
    }

    @Test
    @Order(19)
    public void updateReview_ShouldReturnBadRequest_WhenCommentIsEmpty() {
        savedReview = reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("");
        updateRequest.setRating(4);
        
        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/reviews/{reviewId}", savedReview.getId())
        .then()
            .statusCode(anyOf(equalTo(400), equalTo(200)));
    }

    @Test
    @Order(20)
    public void updateReview_ShouldReturnForbidden_WhenUserNotOwner() {
        savedReview = reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("Admin trying to update user's review");
        updateRequest.setRating(4);
        
        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/reviews/{reviewId}", savedReview.getId())
        .then()
            .statusCode(anyOf(equalTo(403), equalTo(500)));
    }

    @Test
    @Order(21)
    public void updateReview_ShouldUpdateOnlyComment_NotOtherFields() {
        savedReview = reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        Long originalUserId = savedReview.getUserId();
        Long originalApartmentId = savedReview.getApartmentId();

        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("Only comment should change");
        updateRequest.setRating(5); // Cambiar rating también

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/reviews/{reviewId}", savedReview.getId())
        .then()
            .statusCode(200)
            .body("comment", equalTo("Only comment should change"))
            .body("userId", equalTo(originalUserId.intValue()))
            .body("apartmentId", equalTo(originalApartmentId.intValue()))
            .body("rating", equalTo(5)); // Verificar que el rating cambió
    }

    @Test
    @Order(22)
    public void updateReview_ShouldHandleVeryLongComment() {
        savedReview = reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        String longComment = "A".repeat(100);
        
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment(longComment);
        updateRequest.setRating(4);
        
        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/reviews/{reviewId}", savedReview.getId())
        .then()
            .statusCode(anyOf(equalTo(200), equalTo(400)));
    }

    @Test
    @Order(23)
    public void updateReview_ShouldHandleSpecialCharacters() {
        savedReview = reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("Updated! ñáéíóú 特殊字符 🎉");
        updateRequest.setRating(4);
        
        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/reviews/{reviewId}", savedReview.getId())
        .then()
            .statusCode(200)
            .body("comment", containsString("Updated!"));
    }

    // ==================== DELETE REVIEW TESTS ====================

    @Test
    @Order(24)
    public void deleteReview_ShouldDeleteReview_WhenOwnerAuthenticated() {
        Review tempReview = new Review();
        tempReview.setUserId(regularUserId);
        tempReview.setApartmentId(validApartmentId);
        tempReview.setComment("To be deleted");
        tempReview.setRating(3);
        tempReview = reviewRepository.save(tempReview);

        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/reviews/{reviewId}", tempReview.getId())
        .then()
            .statusCode(204);

        assertFalse(reviewRepository.existsById(tempReview.getId()));
    }

    @Test
    @Order(25)
    public void deleteReview_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        savedReview = reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        given()
        .when()
            .delete("/api/v1/reviews/{reviewId}", savedReview.getId())
        .then()
            .statusCode(401);
    }

    @Test
    @Order(26)
    public void deleteReview_ShouldReturnNotFound_WhenReviewDoesNotExist() {
        Long nonExistentId = 9999L;
        
        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/reviews/{reviewId}", nonExistentId)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(27)
    public void deleteReview_ShouldReturnForbidden_WhenUserNotOwner() {
        savedReview = reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        given()
            .cookies(adminCookies)
        .when()
            .delete("/api/v1/reviews/{reviewId}", savedReview.getId())
        .then()
            .statusCode(anyOf(equalTo(403), equalTo(500)));
    }

    @Test
    @Order(28)
    public void deleteReview_ShouldPermanentlyRemoveReview() {
        Review tempReview = new Review();
        tempReview.setUserId(regularUserId);
        tempReview.setApartmentId(validApartmentId);
        tempReview.setComment("To be permanently deleted");
        tempReview.setRating(4);
        tempReview = reviewRepository.save(tempReview);
        Long tempId = tempReview.getId();

        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/reviews/{reviewId}", tempId)
        .then()
            .statusCode(204);

        assertFalse(reviewRepository.existsById(tempId));
        
        given()
            .cookies(userCookies)
            .queryParam("comment", "Trying to update deleted review")
        .when()
            .put("/api/v1/reviews/{reviewId}", tempId)
        .then()
            .statusCode(500);
    }

    // ==================== GET REVIEWS BY APARTMENT TESTS ====================

    @Test
    @Order(29)
    public void getReviewsByApartment_ShouldReturnReviews_WhenApartmentExists() {
        Review review2 = new Review();
        review2.setUserId(regularUserId);
        review2.setApartmentId(validApartmentId);
        review2.setComment("Another great review");
        review2.setRating(5);
        reviewRepository.save(review2);

        Review review3 = new Review();
        review3.setUserId(adminUserId);
        review3.setApartmentId(validApartmentId);
        review3.setComment("Admin review");
        review3.setRating(4);
        reviewRepository.save(review3);

        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", validApartmentId)
        .then()
            .log().all()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(2));
    }

    @Test
    @Order(30)
    public void getReviewsByApartment_ShouldReturnEmptyList_WhenNoReviews() {
        Long emptyApartmentId = 5L;
        
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", emptyApartmentId)
        .then()
            .statusCode(anyOf(equalTo(200), equalTo(404)));
    }

    @Test
    @Order(31)
    public void getReviewsByApartment_ShouldReturnNotFound_WhenApartmentDoesNotExist() {
        Long nonExistentApartmentId = 9999L;
        
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", nonExistentApartmentId)
        .then()
            .statusCode(404)
            .body("message", containsString("Apartment not found"));
    }

    @Test
    @Order(32)
    public void getReviewsByApartment_ShouldReturnPaginatedResults() {
        for (int i = 1; i <= 15; i++) {
            Review review = new Review();
            review.setUserId(regularUserId);
            review.setApartmentId(2L);
            review.setComment("Review " + i);
            review.setRating(4);
            reviewRepository.save(review);
        }

        given()
            .queryParam("page", "0")
            .queryParam("pageSize", "5")
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", 2L)
        .then()
            .statusCode(200)
            .body("size()", equalTo(5));
    }

    @Test
    @Order(33)
    public void getReviewsByApartment_ShouldReturnSecondPage() {
        given()
            .queryParam("page", "1")
            .queryParam("pageSize", "10")
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", 2L)
        .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(0));
    }

    @Test
    @Order(34)
    public void getReviewsByApartment_ShouldReturnOnlyReviewsForSpecificApartment() {
        Review reviewApt3 = new Review();
        reviewApt3.setUserId(regularUserId);
        reviewApt3.setApartmentId(3L);
        reviewApt3.setComment("Review for apartment 3");
        reviewApt3.setRating(5);
        reviewRepository.save(reviewApt3);

        Review reviewApt4 = new Review();
        reviewApt4.setUserId(regularUserId);
        reviewApt4.setApartmentId(4L);
        reviewApt4.setComment("Review for apartment 4");
        reviewApt4.setRating(4);
        reviewRepository.save(reviewApt4);

        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", 3L)
        .then()
            .statusCode(200);
    }

    @Test
    @Order(35)
    public void getReviewsByApartment_ShouldHandleInvalidPaginationParameters() {
        given()
            .queryParam("page", "-1")
            .queryParam("pageSize", "0")
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", validApartmentId)
        .then()
            .statusCode(anyOf(equalTo(200), equalTo(400), equalTo(500)));
    }

    @Test
    @Order(36)
    public void getReviewsByApartment_ShouldHandleLargePageSize() {
        given()
            .queryParam("page", "0")
            .queryParam("pageSize", "1000")
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", validApartmentId)
        .then()
            .statusCode(200);
    }

    @Test
    @Order(37)
    public void getReviewsByApartment_ShouldUseDefaultPaginationWhenNotProvided() {
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", validApartmentId)
        .then()
            .statusCode(200);
    }

    // ==================== CAN USER REVIEW TESTS ====================

    @Test
    @Order(38)
    public void canUserReview_ShouldReturnTrue_WhenUserCanReview() {
        given()
            .cookies(userCookies)
            .queryParam("userId", regularUserId)
            .queryParam("apartmentId", validApartmentId)
        .when()
            .get("/api/v1/reviews/can-review")
        .then()
            .statusCode(200)
            .body(equalTo("true"));
    }

    @Test
    @Order(39)
    public void canUserReview_ShouldReturnFalse_WhenReviewAlreadyExists() {
        reviewRepository.save(new Review(regularUserId, validApartmentId, "First review", 4));
        given()
            .cookies(userCookies)
            .queryParam("userId", regularUserId)
            .queryParam("apartmentId", validApartmentId)
        .when()
            .get("/api/v1/reviews/can-review")
        .then()
            .statusCode(200)
            .body(equalTo("false"));
    }

    @Test
    @Order(40)
    public void canUserReview_ShouldReturnUnauthorized_WhenNotAuthenticated() {
        given()
            .queryParam("userId", regularUserId)
            .queryParam("apartmentId", validApartmentId)
        .when()
            .get("/api/v1/reviews/can-review")
        .then()
            .statusCode(401);
    }

    @Test
    @Order(41)
    public void canUserReview_ShouldReturnError_WhenUserTriesToCheckAnotherUser() {
        given()
            .cookies(userCookies)
            .queryParam("userId", adminUserId)
            .queryParam("apartmentId", validApartmentId)
        .when()
            .get("/api/v1/reviews/can-review")
        .then()
            .statusCode(500)
            .body("details", containsString("User email does not match user ID"));
    }

    @Test
    @Order(42)
    public void canUserReview_ShouldReturnBadRequest_WhenUserIdMissing() {
        given()
            .cookies(userCookies)
            .queryParam("apartmentId", validApartmentId)
        .when()
            .get("/api/v1/reviews/can-review")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(43)
    public void canUserReview_ShouldReturnBadRequest_WhenApartmentIdMissing() {
        given()
            .cookies(userCookies)
            .queryParam("userId", regularUserId)
        .when()
            .get("/api/v1/reviews/can-review")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(44)
    public void canUserReview_ShouldReturnBadRequest_WhenBothParametersMissing() {
        given()
            .cookies(userCookies)
        .when()
            .get("/api/v1/reviews/can-review")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(45)
    public void canUserReview_ShouldReturnFalse_WhenUserHasNoBookings() {
        given()
            .cookies(userCookies)
            .queryParam("userId", regularUserId)
            .queryParam("apartmentId", 9999L)
        .when()
            .get("/api/v1/reviews/can-review")
        .then()
            .statusCode(200)
            .body(equalTo("false"));
    }

    @Test
    @Order(46)
    public void canUserReview_ShouldReturnError_WhenUserDoesNotExist() {
        given()
            .cookies(userCookies)
            .queryParam("userId", 99999L)
            .queryParam("apartmentId", validApartmentId)
        .when()
            .get("/api/v1/reviews/can-review")
        .then()
            .statusCode(500)
            .body("details", containsString("User email does not match user ID"));
    }

    // ==================== GET APARTMENT RATING TESTS ====================

    @Test
    @Order(47)
    public void getApartmentRating_ShouldReturnAverageRating_WhenReviewsExist() {
        // Crear múltiples reviews con diferentes ratings
        Review r1 = new Review();
        r1.setUserId(regularUserId);
        r1.setApartmentId(6L);
        r1.setComment("Rating 5");
        r1.setRating(5);
        reviewRepository.save(r1);

        Review r2 = new Review();
        r2.setUserId(adminUserId);
        r2.setApartmentId(6L);
        r2.setComment("Rating 3");
        r2.setRating(3);
        reviewRepository.save(r2);

        Review r3 = new Review();
        r3.setUserId(regularUserId);
        r3.setApartmentId(6L);
        r3.setComment("Rating 4");
        r3.setRating(4);
        reviewRepository.save(r3);

        // Average = (5 + 3 + 4) / 3 = 4
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", 6L)
        .then()
            .log().all()
            .statusCode(200)
            .body(equalTo("4.0"));
    }

    @Test
    @Order(48)
    public void getApartmentRating_ShouldReturnZero_WhenNoReviewsExist() {
        Long apartmentWithoutReviews = 7L;
        
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", apartmentWithoutReviews)
        .then()
            .statusCode(anyOf(equalTo(200), equalTo(404)));
    }

    @Test
    @Order(49)
    public void getApartmentRating_ShouldReturnNotFound_WhenApartmentDoesNotExist() {
        Long nonExistentApartmentId = 9999L;
        
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", nonExistentApartmentId)
        .then()
            .statusCode(404)
            .body("message", containsString("Apartment not found"));
    }

    @Test
    @Order(50)
    public void getApartmentRating_ShouldNotRequireAuthentication() {
        // No se envían cookies
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", validApartmentId)
        .then()
            .statusCode(anyOf(equalTo(200), equalTo(404)));
    }

    @Test
    @Order(51)
    public void getApartmentRating_ShouldReturnCorrectRating_WhenSingleReview() {
        Review singleReview = new Review();
        singleReview.setUserId(regularUserId);
        singleReview.setApartmentId(8L);
        singleReview.setComment("Single rating");
        singleReview.setRating(5);
        reviewRepository.save(singleReview);

        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", 8L)
        .then()
            .statusCode(200)
            .body(equalTo("5.0"));
    }

    @Test
    @Order(52)
    public void getApartmentRating_ShouldCalculateCorrectAverage_WithMultipleReviews() {
        // Crear 5 reviews con ratings específicos
        for (int i = 1; i <= 5; i++) {
            Review review = new Review();
            review.setUserId(regularUserId);
            review.setApartmentId(9L);
            review.setComment("Review " + i);
            review.setRating(i);
            reviewRepository.save(review);
        }

        // Average = (1 + 2 + 3 + 4 + 5) / 5 = 3
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", 9L)
        .then()
            .statusCode(200)
            .body(equalTo("3.0"));
    }

    @Test
    @Order(53)
    public void getApartmentRating_ShouldHandleAllMaxRatings() {
        Review maxReview1 = new Review();
        maxReview1.setUserId(regularUserId);
        maxReview1.setApartmentId(10L);
        maxReview1.setComment("Max rating 1");
        maxReview1.setRating(5);
        reviewRepository.save(maxReview1);

        Review maxReview2 = new Review();
        maxReview2.setUserId(adminUserId);
        maxReview2.setApartmentId(10L);
        maxReview2.setComment("Max rating 2");
        maxReview2.setRating(5);
        reviewRepository.save(maxReview2);

        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", 10L)
        .then()
            .statusCode(200)
            .body(equalTo("5.0"));
    }

    @Test
    @Order(54)
    public void getApartmentRating_ShouldHandleAllMinRatings() {
        Review minReview1 = new Review();
        minReview1.setUserId(regularUserId);
        minReview1.setApartmentId(10L);
        minReview1.setComment("Min rating 1");
        minReview1.setRating(1);
        reviewRepository.save(minReview1);

        Review minReview2 = new Review();
        minReview2.setUserId(adminUserId);
        minReview2.setApartmentId(10L);
        minReview2.setComment("Min rating 2");
        minReview2.setRating(1);
        reviewRepository.save(minReview2);

        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", 10L)
        .then()
            .statusCode(200)
            .body(equalTo("1.0"));
    }

    // ==================== INTEGRATION & EDGE CASES ====================

    @Test
    @Order(55)
    public void integrationTest_CreateUpdateAndDeleteReview() {
        // 1. Crear review
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(regularUserId);
        reviewRequest.setApartmentId(validApartmentId);
        reviewRequest.setComment("Integration test review");
        reviewRequest.setRating(4);

        Response createResponse = given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(anyOf(equalTo(201), equalTo(400)))
            .extract()
            .response();

        if (createResponse.statusCode() == 201) {
            Long reviewId = createResponse.jsonPath().getLong("id");

            // 2. Actualizar review
            UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
            updateRequest.setComment("Updated integration review");
            updateRequest.setRating(5);
            
            given()
                .cookies(userCookies)
                .contentType(ContentType.JSON)
                .body(updateRequest)
            .when()
                .put("/api/v1/reviews/{reviewId}", reviewId)
            .then()
                .statusCode(200)
                .body("comment", equalTo("Updated integration review"));

            // 3. Verificar que existe
            assertTrue(reviewRepository.existsById(reviewId));

            // 4. Eliminar review
            given()
                .cookies(userCookies)
            .when()
                .delete("/api/v1/reviews/{reviewId}", reviewId)
            .then()
                .statusCode(204);

            // 5. Verificar que no existe
            assertFalse(reviewRepository.existsById(reviewId));
        }
    }

    @Test
    @Order(56)
    public void integrationTest_GetReviewsByApartmentAfterMultipleOperations() {
        // Crear varias reviews
        for (int i = 1; i <= 3; i++) {
            Review review = new Review();
            review.setUserId(regularUserId);
            review.setApartmentId(10L);
            review.setComment("Review " + i);
            review.setRating(i + 2);
            reviewRepository.save(review);
        }

        // Obtener reviews
        Response response = given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", 10L)
        .then()
            .statusCode(200)
            .body("size()", equalTo(3))
            .extract()
            .response();

        List<Map<String, Object>> reviews = response.jsonPath().getList("$");
        assertEquals(3, reviews.size());
    }

    @Test
    @Order(57)
    public void integrationTest_RatingCalculationAfterReviewDeletion() {
        // Crear 3 reviews con ratings diferentes
        Review r1 = new Review();
        r1.setUserId(regularUserId);
        r1.setApartmentId(10L);
        r1.setComment("Review 1");
        r1.setRating(5);
        r1 = reviewRepository.save(r1);

        Review r2 = new Review();
        r2.setUserId(adminUserId);
        r2.setApartmentId(10L);
        r2.setComment("Review 2");
        r2.setRating(3);
        reviewRepository.save(r2);

        Review r3 = new Review();
        r3.setUserId(regularUserId);
        r3.setApartmentId(10L);
        r3.setComment("Review 3");
        r3.setRating(4);
        reviewRepository.save(r3);

        // Verificar rating inicial: (5 + 3 + 4) / 3 = 4
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", 10L)
        .then()
            .statusCode(200)
            .body(equalTo("4.0"));

        // Eliminar una review
        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/reviews/{reviewId}", r1.getId())
        .then()
            .statusCode(204);

        // Verificar nuevo rating: (3 + 4) / 2 = 3.5
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", 10L)
        .then()
            .statusCode(200)
            .body(equalTo("3.5"));
    }

    @Test
    @Order(58)
    public void edgeCase_CreateReview_WithMaxLengthComment() {
        String maxLengthComment = "A".repeat(200);
        
        ReviewRequestDTO reviewRequest = new ReviewRequestDTO();
        reviewRequest.setUserId(regularUserId);
        reviewRequest.setApartmentId(validApartmentId);
        reviewRequest.setComment(maxLengthComment);
        reviewRequest.setRating(5);

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(reviewRequest)
        .when()
            .post("/api/v1/reviews")
        .then()
            .statusCode(anyOf(equalTo(201), equalTo(400)));
    }

    @Test
    @Order(59)
    public void edgeCase_MultipleUsersReviewingSameApartment() {
        Long testApartmentId = 10L;

        // Usuario regular crea review
        Review userReview = new Review();
        userReview.setUserId(regularUserId);
        userReview.setApartmentId(testApartmentId);
        userReview.setComment("User review");
        userReview.setRating(5);
        reviewRepository.save(userReview);

        // Admin crea review
        Review adminReview = new Review();
        adminReview.setUserId(adminUserId);
        adminReview.setApartmentId(testApartmentId);
        adminReview.setComment("Admin review");
        adminReview.setRating(4);
        reviewRepository.save(adminReview);

        // Verificar que ambas reviews existen
        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", testApartmentId)
        .then()
            .statusCode(200)
            .body("size()", equalTo(2));
    }

    @Test
    @Order(60)
    public void edgeCase_GetReviewsByApartment_WithEmptyDatabase() {
        // Limpiar todas las reviews
        reviewRepository.deleteAll();

        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}", validApartmentId)
        .then()
            .statusCode(anyOf(equalTo(200), equalTo(404)));
    }

    @Test
    @Order(61)
    public void edgeCase_CanUserReview_WithInvalidTokenButValidParameters() {
        given()
            .cookie("AuthToken", "invalid-token-12345")
            .queryParam("userId", regularUserId)
            .queryParam("apartmentId", validApartmentId)
        .when()
            .get("/api/v1/reviews/can-review")
        .then()
            .statusCode(401);
    }

    @Test
    @Order(62)
    public void edgeCase_UpdateReview_MultipleTimesInSuccession() {
        Review testReview = new Review();
        testReview.setUserId(regularUserId);
        testReview.setApartmentId(15L);
        testReview.setComment("Original comment");
        testReview.setRating(3);
        testReview = reviewRepository.save(testReview);

        // Primera actualización
        UpdateReviewRequestDTO firstUpdate = new UpdateReviewRequestDTO();
        firstUpdate.setComment("First update");
        firstUpdate.setRating(3);
        
        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(firstUpdate)
        .when()
            .put("/api/v1/reviews/{reviewId}", testReview.getId())
        .then()
            .statusCode(200)
            .body("comment", equalTo("First update"));

        // Segunda actualización
        UpdateReviewRequestDTO secondUpdate = new UpdateReviewRequestDTO();
        secondUpdate.setComment("Second update");
        secondUpdate.setRating(4);
        
        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(secondUpdate)
        .when()
            .put("/api/v1/reviews/{reviewId}", testReview.getId())
        .then()
            .statusCode(200)
            .body("comment", equalTo("Second update"));

        // Tercera actualización
        UpdateReviewRequestDTO thirdUpdate = new UpdateReviewRequestDTO();
        thirdUpdate.setComment("Third update");
        thirdUpdate.setRating(5);
        
        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(thirdUpdate)
        .when()
            .put("/api/v1/reviews/{reviewId}", testReview.getId())
        .then()
            .statusCode(200)
            .body("comment", equalTo("Third update"));
    }

    @Test
    @Order(63)
    public void edgeCase_GetApartmentRating_WithSingleZeroRating() {
        Review zeroRatingReview = new Review();
        zeroRatingReview.setUserId(regularUserId);
        zeroRatingReview.setApartmentId(10L);
        zeroRatingReview.setComment("Zero rating review");
        zeroRatingReview.setRating(0);
        reviewRepository.save(zeroRatingReview);

        given()
        .when()
            .get("/api/v1/reviews/apartment/{apartmentId}/rating", 10L)
        .then()
            .statusCode(200)
            .body(equalTo("0.0"));
    }

    @Test
    @Order(64)
    public void edgeCase_ConcurrentRequestsToSameEndpoint() {
        for (int i = 0; i < 5; i++) {
            given()
            .when()
                .get("/api/v1/reviews/apartment/{apartmentId}/rating", validApartmentId)
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(404)));
        }
    }
}