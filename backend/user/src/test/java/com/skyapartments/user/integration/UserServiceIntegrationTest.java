package com.skyapartments.user.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.skyapartments.user.dto.UpdateUserRequestDTO;
import com.skyapartments.user.dto.UserDTO;
import com.skyapartments.user.dto.UserRequestDTO;
import com.skyapartments.user.exception.BusinessValidationException;
import com.skyapartments.user.exception.ResourceNotFoundException;
import com.skyapartments.user.repository.UserRepository;
import com.skyapartments.user.service.UserService;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class UserServiceIntegrationTest {
    @Container
    public static final MySQLContainer<?> mysqlContainer =
            new MySQLContainer<>("mysql:8.0")
                    .withDatabaseName("testdb")
                    .withUsername("testuser")
                    .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // MySQL
        registry.add("spring.datasource.url", mysqlContainer::getJdbcUrl);
        registry.add("spring.datasource.username", mysqlContainer::getUsername);
        registry.add("spring.datasource.password", mysqlContainer::getPassword);
        registry.add("spring.datasource.driver-class-name", mysqlContainer::getDriverClassName);
    }

    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserRequestDTO validUserRequest;

    @BeforeEach
    void setup() {
        userService = new UserService(userRepository, passwordEncoder);
        userRepository.deleteAll();
        validUserRequest = new UserRequestDTO();
        validUserRequest.setName("John");
        validUserRequest.setSurname("Doe");
        validUserRequest.setEmail("john.doe@example.com");
        validUserRequest.setPhoneNumber("123456789");
        validUserRequest.setPassword("password123");
        validUserRequest.setRepeatPassword("password123");
    }


    @Test
    public void createUser_success() {
        UserDTO userDTO = userService.createUser(validUserRequest);

        assertNotNull(userDTO.getId());
        assertEquals("John", userDTO.getName());
        assertEquals("USER", userDTO.getRoles().get(0));
        assertEquals("john.doe@example.com", userDTO.getEmail());
        assertEquals("123456789", userDTO.getPhoneNumber());
    }

    @Test
    public void createUser_passwordsDoNotMatch_throwsException() {
        validUserRequest.setRepeatPassword("different");

        BusinessValidationException exception = assertThrows(BusinessValidationException.class,
                () -> userService.createUser(validUserRequest));

        assertEquals("Passwords do not match", exception.getMessage());
    }

    @Test
    public void createUser_emailAlreadyExists_throwsException() {
        userService.createUser(validUserRequest);

        BusinessValidationException exception = assertThrows(BusinessValidationException.class,
                () -> userService.createUser(validUserRequest));

        assertEquals("Email is already registered", exception.getMessage());
    }

    @Test
    public void getUserById_success() {
        UserDTO created = userService.createUser(validUserRequest);

        UserDTO found = userService.getUserById(created.getId());

        assertEquals(created.getEmail(), found.getEmail());
    }

    @Test
    public void getUserById_notFound_throwsException() {
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> userService.getUserById(999L));

        assertEquals("User not found", ex.getMessage());
    }

    @Test
    public void updateUser_success() {
        UserDTO created = userService.createUser(validUserRequest);

        UpdateUserRequestDTO updateRequest = new UpdateUserRequestDTO();
        updateRequest.setName("Jane");
        updateRequest.setSurname("Doe");
        updateRequest.setEmail("jane.doe@example.com");
        updateRequest.setPhoneNumber("987654321");
        updateRequest.setPassword("password123");
        updateRequest.setRepeatPassword("password123");

        UserDTO updated = userService.updateUser(created.getId(), updateRequest);

        assertEquals("Jane", updated.getName());
        assertEquals("USER", updated.getRoles().get(0));
        assertEquals("jane.doe@example.com", updated.getEmail());
        assertEquals("987654321", updated.getPhoneNumber());
    }

    @Test
    public void updateUser_passwordsDoNotMatch_throwsException() {
        UserDTO created = userService.createUser(validUserRequest);

        UpdateUserRequestDTO updateRequest = new UpdateUserRequestDTO();
        updateRequest.setName("Jane");
        updateRequest.setSurname("Doe");
        updateRequest.setEmail("jane.doe@example.com");
        updateRequest.setPhoneNumber("987654321");
        updateRequest.setPassword("newPassword");
        updateRequest.setRepeatPassword("differentPassword");

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> userService.updateUser(created.getId(), updateRequest));

        assertEquals("Passwords do not match", ex.getMessage());
    }

    @Test
    public void updateUser_userNotFound_throwsException() {
        UpdateUserRequestDTO updateRequest = new UpdateUserRequestDTO();
        updateRequest.setName("Jane");
        updateRequest.setSurname("Doe");
        updateRequest.setEmail("jane.doe@example.com");
        updateRequest.setPhoneNumber("987654321");
        updateRequest.setPassword("password123");
        updateRequest.setRepeatPassword("password123");

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> userService.updateUser(999L, updateRequest));

        assertEquals("User not found", ex.getMessage());
    }

    @Test
    public void deleteUser_success() {
        UserDTO created = userService.createUser(validUserRequest);

        userService.deleteUser(created.getId());

        assertFalse(userRepository.existsById(created.getId()));
    }

    @Test
    public void deleteUser_notFound_throwsException() {
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> userService.deleteUser(999L));

        assertEquals("User not found", ex.getMessage());
    }

    @Test
    public void getUserByEmail_success() {
        UserDTO created = userService.createUser(validUserRequest);

        UserDTO found = userService.getUserByEmail(created.getEmail());

        assertEquals(created.getId(), found.getId());
    }

    @Test
    public void getUserByEmail_notFound_throwsException() {
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> userService.getUserByEmail("nonexistent@example.com"));

        assertEquals("User not found", ex.getMessage());
    }

}
