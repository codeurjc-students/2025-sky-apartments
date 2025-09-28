package com.skyapartments.user.controller;


import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;

import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.skyapartments.user.dto.UpdateUserRequestDTO;
import com.skyapartments.user.dto.UserDTO;
import com.skyapartments.user.dto.UserRequestDTO;
import com.skyapartments.user.exception.ResourceNotFoundException;
import com.skyapartments.user.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Get user by ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User found",
            content = @Content(mediaType = "application/json",
            schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "404", description = "User not found",
            content = @Content),
        @ApiResponse(responseCode = "400", description = "Invalid user ID",
            content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(
            @Parameter(description = "ID of the user to retrieve") @PathVariable Long id) {
    
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
        
    }

    @Hidden
    @GetMapping("/private/{id}")
    public ResponseEntity<UserDTO> getUserByIdPrivate(
            @Parameter(description = "ID of the user to retrieve") @PathVariable Long id) {
    
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @Hidden
    @GetMapping
    public ResponseEntity<Long> getUserIdByEmail(
            @Parameter(description = "Email of the user to retrieve") @RequestParam String email) {
    
        UserDTO user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user.getId());    
    }

    @Hidden
    @GetMapping("/email")
    public ResponseEntity<UserDTO> getUserByEmail(
            @Parameter(description = "Email of the user to retrieve") @RequestParam String email) {
    
        UserDTO user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user);    
    }

    @GetMapping("/me")
    public UserDTO me(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if(principal != null) {
                return userService.getUserByEmail(principal.getName());
        } else {
                throw new ResourceNotFoundException("User not logged in");
        }
    }

    @Operation(summary = "Update user", description = "Update an existing user by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User updated",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "404", description = "User not found",
                    content = @Content),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @Parameter(description = "ID of the user to update") @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequestDTO updateRequest,
            HttpServletRequest request
            ) {
        String email = request.getUserPrincipal().getName();
        if (userService.getUserByEmail(email).getId() != id) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
        UserDTO updatedUser = userService.updateUser(id, updateRequest);
        return ResponseEntity.ok(updatedUser);

    }

    @Operation(summary = "Delete user", description = "Delete a user by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "User deleted successfully",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "User not found",
                    content = @Content),
            @ApiResponse(responseCode = "400", description = "Invalid user ID",
                    content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @Parameter(description = "ID of the user to delete") @PathVariable Long id) {

        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Create user", description = "Create a new user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User created",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content)
    })
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserRequestDTO requestDTO) {
        UserDTO createdUser = userService.createUser(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }
}

