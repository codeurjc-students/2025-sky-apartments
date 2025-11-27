package com.skyapartments.booking.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.skyapartments.booking.dto.ContactMessageDTO;
import com.skyapartments.booking.service.EmailService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/contact")
public class ContactController {
    
    private final EmailService emailService;
    
    public ContactController(EmailService emailService) {
        this.emailService = emailService;
    }
    
    @PostMapping
    public ResponseEntity<Map<String, String>> sendContactMessage(
            @Valid @RequestBody ContactMessageDTO contactMessage) {
        try {
            emailService.sendContactMessage(
                contactMessage.getName(),
                contactMessage.getEmail(),
                contactMessage.getSubject(),
                contactMessage.getMessage()
            );
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Message sent successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to send message: " + e.getMessage());
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }
}