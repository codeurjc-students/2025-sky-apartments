package com.skyapartments.review.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;



public class BookingDTO {
    
    private Long id;
    private Long userId;
    private Long apartmentId;

    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal cost;
    private String state;
    private int guests;
    private LocalDateTime createdDate;

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getApartmentId() {
        return apartmentId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public BigDecimal getCost() {
        return cost;
    }

    public String getState() {
        return state;
    }

    public int getGuests() {
        return guests;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setApartmentId(long l) {
        this.apartmentId = l;
    }

    public void setUserId(long l) {
        this.userId = l;
    }

    public void setId(long l) {
        this.id = l;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public void setCost(BigDecimal cost) {
        this.cost = cost;
    }

    public void setState(String state) {
        this.state = state;
    }

    public void setGuests(int guests) {
        this.guests = guests;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    

}
