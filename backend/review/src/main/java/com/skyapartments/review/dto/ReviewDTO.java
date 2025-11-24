package com.skyapartments.review.dto;

import java.time.LocalDate;

import com.skyapartments.review.model.Review;

public class ReviewDTO {

    private Long id;
    private Long userId;
    private String userName;
    private Long apartmentId;
    private LocalDate date;
    private String comment;
    private int rating;

    public ReviewDTO() {}

    public ReviewDTO(Long id, Long userId, String userName, Long apartmentId, String apartmentName, LocalDate date, String comment, int rating) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.apartmentId = apartmentId;
        this.date = date;
        this.comment = comment;
        this.rating = rating;
    }

    public ReviewDTO (Review review, String userName) {
        this.id = review.getId();
        this.userId = review.getUserId();
        this.userName = userName;
        this.apartmentId = review.getApartmentId();
        this.date = review.getDate();
        this.comment = review.getComment();
        this.rating = review.getRating();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public Long getApartmentId() {
        return apartmentId;
    }

    public void setApartmentId(Long apartmentId) {
        this.apartmentId = apartmentId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }
}
