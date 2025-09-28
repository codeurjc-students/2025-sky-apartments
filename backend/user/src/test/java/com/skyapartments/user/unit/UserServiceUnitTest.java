package com.skyapartments.user.unit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Optional;

import org.junit.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.skyapartments.user.dto.UpdateUserRequestDTO;
import com.skyapartments.user.dto.UserDTO;
import com.skyapartments.user.dto.UserRequestDTO;
import com.skyapartments.user.exception.BusinessValidationException;
import com.skyapartments.user.exception.ResourceNotFoundException;
import com.skyapartments.user.model.User;
import com.skyapartments.user.repository.UserRepository;
import com.skyapartments.user.service.UserService;

public class UserServiceUnitTest {
    private UserService userService;
    private PasswordEncoder passwordEncoder = mock (PasswordEncoder.class);
    private UserRepository userRepository = mock(UserRepository.class);

    public UserServiceUnitTest () {
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    public void createUser_Success() {
        UserRequestDTO dto = buildValidRequest();

        when(userRepository.existsByEmail(dto.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(dto.getPassword())).thenReturn("encodedPass");

        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setName("John");
        savedUser.setSurname("Doe");
        savedUser.setEmail("john.doe@example.com");
        savedUser.setPhoneNumber("123456789");
        savedUser.setEncodedPassword("encodedPassword");
        savedUser.setRoles(Collections.singletonList("USER"));
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserDTO result = userService.createUser(dto);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("John", result.getName());
        assertEquals("Doe", result.getSurname());
        assertEquals("john.doe@example.com", result.getEmail());
        assertEquals("123456789", result.getPhoneNumber());
        assertEquals(Collections.singletonList("USER"), result.getRoles());

        verify(userRepository, times(1)).existsByEmail(dto.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void createUser_PasswordsDoNotMatch_ShouldThrowException() {
        UserRequestDTO dto = buildValidRequest();
        dto.setRepeatPassword("DifferentPass");

        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> userService.createUser(dto)
        );

        assertEquals("Passwords do not match", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void createUser_EmailAlreadyRegistered_ShouldThrowException() {
        UserRequestDTO dto = buildValidRequest();

        when(userRepository.existsByEmail(dto.getEmail())).thenReturn(true);

        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> userService.createUser(dto)
        );

        assertEquals("Email is already registered", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void getUserById_ShouldReturnUserDTO_WhenUserExists() {
        // given
        User user = new User();
        user.setId(1L);
        user.setName("John");
        user.setSurname("Doe");
        user.setEmail("john.doe@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // when
        UserDTO result = userService.getUserById(1L);

        // then
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("John", result.getName());
        assertEquals("Doe", result.getSurname());
        assertEquals("john.doe@example.com", result.getEmail());

        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    public void getUserById_ShouldThrowResourceNotFoundException_WhenUserDoesNotExist() {
        // given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // when + then
        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> userService.getUserById(99L)
        );

        assertThat(ex.getMessage()).contains("User not found");
        verify(userRepository, times(1)).findById(99L);
    }

    @Test
    public void updateUser_ShouldUpdateSuccessfully_WhenPasswordsMatch() {
        // given
        User user = new User();
        user.setId(1L);
        user.setName("Old");
        user.setSurname("User");
        user.setEmail("old@example.com");
        user.setPhoneNumber("987654321");
        user.setEncodedPassword("oldPass");

        UpdateUserRequestDTO dto = buildValidUpdateRequest();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(dto.getPassword())).thenReturn("encodedPass");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        // when
        UserDTO result = userService.updateUser(1L, dto);

        // then
        assertNotNull(result);
        assertEquals("John", result.getName());
        assertEquals("Doe", result.getSurname());
        assertEquals("john.doe@example.com", result.getEmail());
        assertEquals("123456789", result.getPhoneNumber());

        verify(userRepository, times(1)).findById(1L);
        verify(passwordEncoder, times(1)).encode(dto.getPassword());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void updateUser_ShouldThrowResourceNotFoundException_WhenUserDoesNotExist() {
        UpdateUserRequestDTO dto = buildValidUpdateRequest();

        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> userService.updateUser(99L, dto)
        );

        assertThat(ex.getMessage()).contains("User not found");
        verify(userRepository, never()).save(any());
    }

    @Test
    public void updateUser_ShouldThrowBusinessValidationException_WhenPasswordsDoNotMatch() {
        User user = new User();
        user.setId(2L);

        UpdateUserRequestDTO dto = buildValidUpdateRequest();
        dto.setRepeatPassword("DifferentPass");

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));

        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> userService.updateUser(2L, dto)
        );

        assertThat(ex.getMessage()).contains("Passwords do not match");
        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

     @Test
    public void deleteUser_ShouldDeleteSuccessfully_WhenUserExists() {
        // given
        User user = new User();
        user.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // when
        userService.deleteUser(1L);

        // then
        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).delete(user);
    }

    @Test
    public void deleteUser_ShouldThrowResourceNotFoundException_WhenUserDoesNotExist() {
        // given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // when + then
        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> userService.deleteUser(99L)
        );

        assertThat(ex.getMessage()).contains("User not found");
        verify(userRepository, never()).delete(any());
    }

    @Test
    public void getUserByEmail_ShouldReturnUserDTO_WhenUserExists() {
        // given
        User user = new User();
        user.setId(1L);
        user.setName("John");
        user.setSurname("Doe");
        user.setEmail("john.doe@example.com");

        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(user));

        // when
        UserDTO result = userService.getUserByEmail("john.doe@example.com");

        // then
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("John", result.getName());
        assertEquals("Doe", result.getSurname());
        assertEquals("john.doe@example.com", result.getEmail());

        verify(userRepository, times(1)).findByEmail("john.doe@example.com");
    }

    @Test
    public void getUserByEmail_ShouldThrowResourceNotFoundException_WhenUserDoesNotExist() {
        // given
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        // when + then
        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> userService.getUserByEmail("notfound@example.com")
        );

        assertThat(ex.getMessage()).contains("User not found");
        verify(userRepository, times(1)).findByEmail("notfound@example.com");
    }

    private UserRequestDTO buildValidRequest() {
        UserRequestDTO dto = new UserRequestDTO();
        dto.setName("John");
        dto.setSurname("Doe");
        dto.setEmail("john.doe@example.com");
        dto.setPhoneNumber("123456789");
        dto.setPassword("Password@123");
        dto.setRepeatPassword("Password@123");
        return dto;
    }
    private UpdateUserRequestDTO buildValidUpdateRequest() {
        UpdateUserRequestDTO dto = new UpdateUserRequestDTO();
        dto.setName("John");
        dto.setSurname("Doe");
        dto.setEmail("john.doe@example.com");
        dto.setPhoneNumber("123456789");
        dto.setPassword("Password@123");
        dto.setRepeatPassword("Password@123");
        return dto;
    }
}