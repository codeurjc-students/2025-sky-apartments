package com.skyapartments.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.skyapartments.booking.model.Booking;

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

    public BookingDTO(Booking booking) {
        this.id = booking.getId();
        this.userId = booking.getUserId();
        this.apartmentId = booking.getApartmentId();
        this.startDate = booking.getStartDate();
        this.endDate = booking.getEndDate();
        this.cost = booking.getCost();
        this.state = booking.getState().name();
        this.guests = booking.getGuests();
        this.createdDate = booking.getCreatedDate();
    }

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

}
