package com.skyapartments.booking.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class FiltersByDateResponseDTO {
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private int totalNights;
    private Map<LocalDate, List<FilterDTO>> filtersByDate;
    
    public FiltersByDateResponseDTO() {
    }
    
    public FiltersByDateResponseDTO(LocalDate checkInDate, LocalDate checkOutDate, 
                                int totalNights, Map<LocalDate, List<FilterDTO>> filtersByDate) {
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.totalNights = totalNights;
        this.filtersByDate = filtersByDate;
    }
    
    // Getters and Setters
    
    public LocalDate getCheckInDate() {
        return checkInDate;
    }
    
    public void setCheckInDate(LocalDate checkInDate) {
        this.checkInDate = checkInDate;
    }
    
    public LocalDate getCheckOutDate() {
        return checkOutDate;
    }
    
    public void setCheckOutDate(LocalDate checkOutDate) {
        this.checkOutDate = checkOutDate;
    }
    
    public int getTotalNights() {
        return totalNights;
    }
    
    public void setTotalNights(int totalNights) {
        this.totalNights = totalNights;
    }
    
    public Map<LocalDate, List<FilterDTO>> getFiltersByDate() {
        return filtersByDate;
    }
    
    public void setFiltersByDate(Map<LocalDate, List<FilterDTO>> filtersByDate) {
        this.filtersByDate = filtersByDate;
    }
}