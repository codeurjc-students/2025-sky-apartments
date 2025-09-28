package com.skyapartments.user.service;

import java.util.Collections;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.skyapartments.user.dto.UpdateUserRequestDTO;
import com.skyapartments.user.dto.UserDTO;
import com.skyapartments.user.dto.UserRequestDTO;
import com.skyapartments.user.exception.BusinessValidationException;
import com.skyapartments.user.exception.ResourceNotFoundException;
import com.skyapartments.user.model.User;
import com.skyapartments.user.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserDTO createUser (UserRequestDTO requestDTO) {

        if (!requestDTO.getPassword().equals(requestDTO.getRepeatPassword())) {
            throw new BusinessValidationException("Passwords do not match");
        }

        if (userRepository.existsByEmail(requestDTO.getEmail())) {
            throw new BusinessValidationException("Email is already registered");
        }

        User user = new User();
        user.setName(requestDTO.getName());
        user.setSurname(requestDTO.getSurname());
        user.setEmail(requestDTO.getEmail());
        user.setPhoneNumber(requestDTO.getPhoneNumber());
        user.setEncodedPassword(passwordEncoder.encode(requestDTO.getPassword()));
        user.setRoles(Collections.singletonList("USER"));
        
        user = userRepository.save(user);

        return new UserDTO(user);
    }

    public UserDTO getUserById (Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new UserDTO(user);
    }

    public UserDTO updateUser(Long id, UpdateUserRequestDTO request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getSurname() != null) {
            user.setSurname(request.getSurname());
        }
        
        if (request.getEmail() != null) {
            if (!request.getEmail().equals(user.getEmail()) && 
                userRepository.existsByEmail(request.getEmail())) {
                throw new BusinessValidationException("Email is already in use by another user");
            }
            user.setEmail(request.getEmail());
        }
        
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        if (request.getPassword() != null || request.getRepeatPassword() != null) {
            if (request.getPassword() == null || request.getRepeatPassword() == null) {
                throw new BusinessValidationException("Both password and repeatPassword must be provided");
            }
            if (!request.getPassword().equals(request.getRepeatPassword())) {
                throw new BusinessValidationException("Passwords do not match");
            }
            user.setEncodedPassword(passwordEncoder.encode(request.getPassword()));
        }

        return new UserDTO(userRepository.save(user));
    }


    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        userRepository.delete(user);
    }

    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new UserDTO(user);
    }
}


