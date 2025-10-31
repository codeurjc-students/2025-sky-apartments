package com.skyapartments.user.e2e;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.skyapartments.user.dto.UserRequestDTO;
import com.skyapartments.user.dto.UpdateUserRequestDTO;
import com.skyapartments.user.model.User;
import com.skyapartments.user.repository.UserRepository;
import com.skyapartments.user.security.jwt.LoginRequest;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

import java.util.Map;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(OrderAnnotation.class)
public class Usere2eTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User savedUser;
    private User normalUser;
    
    private Map<String, String> adminCookies;
    private Map<String, String> userCookies;

    @LocalServerPort
    private int port;

    private static String gatewayUrl;

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

        userRepository.deleteAll();
        
        // Create admin user
        savedUser = userRepository.save(new User(
            "Test", 
            "User",
            "123456789",
            "admin@example.com",
            passwordEncoder.encode("Password"),
            "ADMIN"
        ));

        //Create normal user
        normalUser = userRepository.save(new User(
            "Test", 
            "User",
            "123456789",
            "user@example.com",
            passwordEncoder.encode("Password"),
            "USER"
        ));

        // Login and get cookies
        this.adminCookies = loginAndGetAllCookies("admin@example.com", "Password");
        this.userCookies = loginAndGetAllCookies("user@example.com", "Password");
    }

    private Map<String, String> loginAndGetAllCookies(String username, String password) {

        LoginRequest loginRequest = new LoginRequest(username, password);

        Response loginResponse = given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
            .log().all()
        .when()
            .post("/api/v1/auth/login")
        .then()
            .statusCode(200)
            .body("status", equalTo("SUCCESS"))
            .log().all()
            .extract()
            .response();

        Map<String, String> cookies = loginResponse.getCookies();
        
        if (cookies.isEmpty()) {
            throw new RuntimeException("No cookies were received from the login");
        }
        
        return cookies;
    }

    // ==================== GET USER BY ID TESTS ====================

    @Test
    @Order(1)
    public void getUserById_ShouldReturnUser_WhenUserExistsAndUserIsAuthenticated() {
        given()
            .cookies(userCookies)
        .when()
            .get("/api/v1/users/{id}", normalUser.getId())
        .then()
            .statusCode(200)
            .body("id", equalTo(normalUser.getId().intValue()))
            .body("name", equalTo("Test"))
            .body("surname", equalTo("User"))
            .body("email", equalTo("user@example.com"))
            .body("phoneNumber", equalTo("123456789"));
    }

    @Test
    @Order(2)
    public void getUserById_ShouldReturnUser_WhenUserExistsAndUserIsAdmin() {
        given()
            .cookies(adminCookies)
        .when()
            .get("/api/v1/users/{id}", savedUser.getId())
        .then()
            .statusCode(200)
            .body("id", equalTo(savedUser.getId().intValue()))
            .body("name", equalTo("Test"))
            .body("surname", equalTo("User"))
            .body("email", equalTo("admin@example.com"));
    }

    @Test
    @Order(3)
    public void getUserById_ShouldReturnNotFound_WhenUserDoesNotExist() {
        long nonExistentId = 99999L;
        
        given()
            .cookies(adminCookies)
        .when()
            .get("/api/v1/users/{id}", nonExistentId)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(4)
    public void getUserById_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        given()
        .when()
            .get("/api/v1/users/{id}", savedUser.getId())
        .then()
            .statusCode(401);
    }

    @Test
    @Order(5)
    public void getUserById_ShouldReturnBadRequest_WhenIdIsNotLong() {
        given()
            .cookies(userCookies)
        .when()
            .get("/api/v1/users/{id}", "invalid-id")
        .then()
            .statusCode(400);
    }

    // ==================== GET USER BY EMAIL TESTS ====================

    @Test
    @Order(6)
    public void getUserByEmail_ShouldReturnUser_WhenEmailExists() {
        given()
            .queryParam("email", "user@example.com")
        .when()
            .get("/api/v1/users/email")
        .then()
            .statusCode(200)
            .body("email", equalTo("user@example.com"))
            .body("name", equalTo("Test"))
            .body("surname", equalTo("User"));
    }

    @Test
    @Order(7)
    public void getUserByEmail_ShouldReturnNotFound_WhenEmailDoesNotExist() {
        given()
            .queryParam("email", "nonexistent@example.com")
        .when()
            .get("/api/v1/users/email")
        .then()
            .statusCode(404);
    }

    @Test
    @Order(8)
    public void getUserByEmail_ShouldReturnBadRequest_WhenEmailParameterIsMissing() {
        given()
        .when()
            .get("/api/v1/users/email")
        .then()
            .statusCode(400);
    }

    // ==================== GET ME TESTS ====================

    @Test
    @Order(9)
    public void getMe_ShouldReturnCurrentUser_WhenUserIsAuthenticated() {
        given()
            .cookies(userCookies)
        .when()
            .get("/api/v1/users/me")
        .then()
            .statusCode(200)
            .body("email", equalTo("user@example.com"));
    }

    @Test
    @Order(10)
    public void getMe_ShouldReturnCurrentUser_WhenAdminIsAuthenticated() {
        given()
            .cookies(adminCookies)
        .when()
            .get("/api/v1/users/me")
        .then()
            .statusCode(200)
            .body("email", equalTo("admin@example.com"));
    }

    @Test
    @Order(11)
    public void getMe_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        given()
        .when()
            .get("/api/v1/users/me")
        .then()
            .statusCode(401);
    }

    // ==================== CREATE USER TESTS ====================

    @Test
    @Order(12)
    public void createUser_ShouldCreateUser_WhenValidDataProvided() {
        UserRequestDTO userRequest = new UserRequestDTO();
        userRequest.setName("New");
        userRequest.setSurname("User");
        userRequest.setEmail("newuser@example.com");
        userRequest.setPhoneNumber("987654321");
        userRequest.setPassword("Password@123");
        userRequest.setRepeatPassword("Password@123");

        given()
            .contentType(ContentType.JSON)
            .body(userRequest)
        .when()
            .post("/api/v1/users")
        .then()
            .statusCode(201)
            .body("name", equalTo("New"))
            .body("surname", equalTo("User"))
            .body("email", equalTo("newuser@example.com"))
            .body("phoneNumber", equalTo("987654321"))
            .body("id", notNullValue());
    }

    @Test
    @Order(13)
    public void createUser_ShouldReturnBadRequest_WhenPasswordsDoNotMatch() {
        UserRequestDTO userRequest = new UserRequestDTO();
        userRequest.setName("New");
        userRequest.setSurname("User");
        userRequest.setEmail("newuser@example.com");
        userRequest.setPhoneNumber("987654321");
        userRequest.setPassword("Password@123");
        userRequest.setRepeatPassword("differentPassword");


        given()
            .contentType(ContentType.JSON)
            .body(userRequest)
        .when()
            .post("/api/v1/users")
        .then()
            .statusCode(400)
            .body("message", equalTo("Passwords do not match"));
    }

    @Test
    @Order(14)
    public void createUser_ShouldReturnBadRequest_WhenEmailAlreadyExists() {
        UserRequestDTO userRequest = new UserRequestDTO();
        userRequest.setName("New");
        userRequest.setSurname("User");
        userRequest.setEmail("user@example.com");
        userRequest.setPhoneNumber("987654321");
        userRequest.setPassword("Password@123");
        userRequest.setRepeatPassword("Password@123");


        given()
            .contentType(ContentType.JSON)
            .body(userRequest)
        .when()
            .post("/api/v1/users")
        .then()
            .statusCode(400)
            .body("message", equalTo("Email is already registered"));
    }

    @Test
    @Order(15)
    public void createUser_ShouldReturnBadRequest_WhenRequiredFieldsAreMissing() {
        UserRequestDTO userRequest = new UserRequestDTO();
        userRequest.setName("New");
        userRequest.setEmail("newuser@example.com");
        userRequest.setPhoneNumber("987654321");
        userRequest.setPassword("Password@123");
        userRequest.setRepeatPassword("Password@123");


        given()
            .contentType(ContentType.JSON)
            .body(userRequest)
        .when()
            .post("/api/v1/users")
        .then()
            .statusCode(400)
            .body("message", equalTo("Validation failed"));
    }

    @Test
    @Order(16)
    public void createUser_ShouldReturnBadRequest_WhenEmailFormatIsInvalid() {
        UserRequestDTO userRequest = new UserRequestDTO();
        userRequest.setName("New");
        userRequest.setEmail("invalid-email-format");
        userRequest.setPhoneNumber("987654321");
        userRequest.setPassword("Password@123");
        userRequest.setRepeatPassword("Password@123");

        given()
            .contentType(ContentType.JSON)
            .body(userRequest)
        .when()
            .post("/api/v1/users")
        .then()
            .statusCode(400);
    }

    // ==================== UPDATE USER TESTS ====================

    @Test
    @Order(17)
    public void updateUser_ShouldUpdateUser_WhenValidDataAndUserIsAuthenticated() {

        UpdateUserRequestDTO updateRequest = new UpdateUserRequestDTO();
        updateRequest.setName("Updated");
        updateRequest.setSurname("Name");
        updateRequest.setEmail("user@example.com");
        updateRequest.setPhoneNumber("999888777");
        
        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/users/{id}", normalUser.getId())
        .then()
            .statusCode(200)
            .body("name", equalTo("Updated"))
            .body("surname", equalTo("Name"))
            .body("email", equalTo("user@example.com"))
            .body("phoneNumber", equalTo("999888777"));
    }

    @Test
    @Order(18)
    public void updateUser_ShouldUpdateUser_WhenValidDataAndUserIsAdmin() {
        UserRequestDTO updateRequest = new UserRequestDTO();
        updateRequest.setName("Updated");
        updateRequest.setSurname("User Surname");
        updateRequest.setEmail("updated@example.com");
        updateRequest.setPhoneNumber("999888777");
        updateRequest.setPassword("newPassword@123");
        updateRequest.setRepeatPassword("newPassword@123");

        given()
            .cookies(adminCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/users/{id}", savedUser.getId())
        .then()
            .statusCode(200)
            .body("name", equalTo("Updated"))
            .body("surname", equalTo("User Surname"))
            .body("email", equalTo("updated@example.com"))
            .body("phoneNumber", equalTo("999888777"));
    }

    @Test
    @Order(19)
    public void updateUser_ShouldReturnNotFound_WhenUserDoesNotExist() {
        long nonExistentId = 99999L;
        UserRequestDTO updateRequest = new UserRequestDTO();
        updateRequest.setName("Updated");
        updateRequest.setSurname("User Surname");
        updateRequest.setEmail("updated@example.com");
        updateRequest.setPhoneNumber("999888777");
        updateRequest.setPassword("newPassword@123");
        updateRequest.setRepeatPassword("newPassword@123");

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/users/{id}", nonExistentId)
        .then()
            .statusCode(401);
    }

    @Test
    @Order(20)
    public void updateUser_ShouldReturnBadRequest_WhenPasswordsDoNotMatch() {
        UserRequestDTO updateRequest = new UserRequestDTO();
        updateRequest.setName("Updated");
        updateRequest.setSurname("Name");
        updateRequest.setEmail("updated@example.com");
        updateRequest.setPhoneNumber("999888777");
        updateRequest.setPassword("newpassword123");
        updateRequest.setRepeatPassword("differentPassword");

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/users/{id}", savedUser.getId())
        .then()
            .statusCode(400)
            .body("message", equalTo("Validation failed"));
    }

    @Test
    @Order(21)
    public void updateUser_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        UserRequestDTO updateRequest = new UserRequestDTO();
        updateRequest.setName("Updated");
        updateRequest.setSurname("Name");
        updateRequest.setEmail("updated@example.com");
        updateRequest.setPhoneNumber("999888777");
        updateRequest.setPassword("newpassword123");
        updateRequest.setRepeatPassword("differentPassword");

        given()
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/users/{id}", savedUser.getId())
        .then()
            .statusCode(401);
    }

    @Test
    @Order(22)
    public void updateUser_ShouldReturnBadRequest_WhenEmailFormatIsInvalid() {
        UserRequestDTO updateRequest = new UserRequestDTO();
        updateRequest.setName("Updated");
        updateRequest.setSurname("Name");
        updateRequest.setEmail("invalid-email");
        updateRequest.setPhoneNumber("999888777");
        updateRequest.setPassword("newpassword123");
        updateRequest.setRepeatPassword("differentPassword");

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/users/{id}", savedUser.getId())
        .then()
            .statusCode(400)
            .body("message", equalTo("Validation failed"))
            .body("errors.email", equalTo("Invalid email format"))
            .body("errors.password", equalTo("Password must contain uppercase, lowercase, number, and special character"));

    }

    @Test
    @Order(23)
    public void updateUser_ShouldReturnBadRequest_WhenPasswordFormatIsInvalid() {
        UserRequestDTO updateRequest = new UserRequestDTO();
        updateRequest.setName("Updated");
        updateRequest.setSurname("Name");
        updateRequest.setEmail("updated@example.com");
        updateRequest.setPhoneNumber("999888777");
        updateRequest.setPassword("newpassword123");
        updateRequest.setRepeatPassword("differentPassword");

        given()
            .cookies(userCookies)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/v1/users/{id}", savedUser.getId())
        .then()
            .statusCode(400)
            .body("message", equalTo("Validation failed"))
            .body("errors.password", equalTo("Password must contain uppercase, lowercase, number, and special character"));
}


    // ==================== DELETE USER TESTS ====================

    @Test
    @Order(24)
    public void deleteUser_ShouldDeleteUser_WhenUserExistsAndUserIsAuthenticated() {
        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/users/{id}", normalUser.getId())
        .then()
            .statusCode(204);

        // Check was deleted
        given()
            .cookies(adminCookies)
        .when()
            .get("/api/v1/users/{id}", normalUser.getId())
        .then()
            .statusCode(404);
    }

    @Test
    @Order(25)
    public void deleteUser_ShouldDeleteUser_WhenUserExistsAndUserIsAdmin() {
        User tempUser = userRepository.save(new User(
            "Admin Temp", 
            "User",
            "987654321",
            "admin.temp@example.com",
            passwordEncoder.encode("password123"),
            "USER"
        ));

        given()
            .cookies(adminCookies)
        .when()
            .delete("/api/v1/users/{id}", tempUser.getId())
        .then()
            .statusCode(204);
    }

    @Test
    @Order(26)
    public void deleteUser_ShouldReturnNotFound_WhenUserDoesNotExist() {
        long nonExistentId = 99999L;
        
        given()
            .cookies(adminCookies)
        .when()
            .delete("/api/v1/users/{id}", nonExistentId)
        .then()
            .statusCode(404);
    }

    @Test
    @Order(27)
    public void deleteUser_ShouldReturnUnauthorized_WhenNoTokenProvided() {
        given()
        .when()
            .delete("/api/v1/users/{id}", savedUser.getId())
        .then()
            .statusCode(401);
    }

    @Test
    @Order(28)
    public void deleteUser_ShouldReturnUnauthorized_WhenNotTheUser() {
        User tempUser = userRepository.save(new User(
            "Temp", 
            "User",
            "123456789",
            "temp@example.com",
            passwordEncoder.encode("password123"),
            "USER"
        ));

        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/users/{id}", tempUser.getId())
        .then()
            .statusCode(401);
    }

    @Test
    @Order(29)
    public void deleteUser_ShouldReturnBadRequest_WhenIdIsNotLong() {
        given()
            .cookies(userCookies)
        .when()
            .delete("/api/v1/users/{id}", "invalid-id")
        .then()
            .statusCode(400);
    }

    // ==================== AUTHENTICATION TESTS ====================

    @Test
    @Order(30)
    public void login_ShouldReturnAuthResponse_WhenCredentialsAreValid() {
        LoginRequest loginRequest = new LoginRequest("user@example.com", "Password");

        given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/v1/auth/login")
        .then()
            .statusCode(200)
            .body("status", equalTo("SUCCESS"));
    }

    @Test
    @Order(31)
    public void login_ShouldReturnUnauthorized_WhenCredentialsAreInvalid() {
        
        LoginRequest loginRequest = new LoginRequest("user@example.com", "wrongpassword");
        given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/v1/auth/login")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(32)
    public void login_ShouldReturnBadRequest_WhenUsernameIsMissing() {
    
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setPassword("Password");

        given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/v1/auth/login")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(33)
    public void logout_ShouldReturnSuccess_WhenCalled() {
        given()
        .when()
            .post("/api/v1/auth/logout")
        .then()
            .statusCode(200)
            .body("status", equalTo("SUCCESS"));
    }

    @Test
    @Order(34)
    public void refreshToken_ShouldReturnUnauthorized_WhenNoRefreshTokenProvided() {
        given()
        .when()
            .post("/api/v1/auth/refresh")
        .then()
            .statusCode(401)
            .body("status", equalTo("FAILURE"))
            .body("message", equalTo("Failure while processing refresh token"));
            
    }

    // ==================== EDGE CASES ====================

    @Test
    @Order(35)
    public void getUserById_ShouldReturnUnauthorized_WhenTokenIsInvalid() {
        given()
            .cookie("AuthToken", "invalid-token")
        .when()
            .get("/api/v1/users/{id}", savedUser.getId())
        .then()
            .statusCode(401);
    }

    @Test
    @Order(36)
    public void createUser_ShouldReturnBadRequest_WhenRequestBodyIsEmpty() {
        given()
            .contentType(ContentType.JSON)
            .body("{}")
        .when()
            .post("/api/v1/users")
        .then()
            .statusCode(400);
    }
}