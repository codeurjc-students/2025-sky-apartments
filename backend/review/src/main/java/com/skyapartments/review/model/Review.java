package com.skyapartments.review.model;


import java.time.LocalDate;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.skyapartments.review.dto.ReviewRequestDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;

@Entity
@EntityListeners(AuditingEntityListener.class)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "apartment_id", nullable = false)
    private Long apartmentId;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDate date;

    @Lob
    @Column(nullable = false)
    private String comment;

    private int rating;

    public Review() {
    }

    public Review(Long userId, Long apartmentId, String comment, int rating) {
        this.userId = userId;
        this.apartmentId = apartmentId;
        this.comment = comment;
        this.rating = rating;
    }

    public Review (ReviewRequestDTO dto) {
        this.userId = dto.getUserId();
        this.apartmentId = dto.getApartmentId();
        this.comment = dto.getComment();
        this.rating = dto.getRating();
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getApartmentId() {
        return apartmentId;
    }

    public void setApartmentId(Long apartmentId) {
        this.apartmentId = apartmentId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }
    
}
