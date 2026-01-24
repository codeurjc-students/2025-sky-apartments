package com.skyapartments.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.skyapartments.booking.model.ConditionType;
import com.skyapartments.booking.model.DateType;
import com.skyapartments.booking.model.Filter;

public class FilterDTO {
    private Long id;
    private String name;
    private String description;
    private Boolean activated;
    private Boolean increment;
    private BigDecimal value;
    private DateType dateType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String weekDays;
    private ConditionType conditionType;
    private Integer anticipationHours;
    private Integer minDays;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public FilterDTO() {
    }

    public FilterDTO(Filter filter) {
        this.id = filter.getId();
        this.name = filter.getName();
        this.description = filter.getDescription();
        this.activated = filter.getActivated();
        this.increment = filter.getIncrement();
        this.value = filter.getValue();
        this.dateType = filter.getDateType();
        this.startDate = filter.getStartDate();
        this.endDate = filter.getEndDate();
        this.weekDays = filter.getWeekDays();
        this.conditionType = filter.getConditionType();
        this.anticipationHours = filter.getAnticipationHours();
        this.minDays = filter.getMinDays();

    }
    
    // Getters and Setters
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Boolean getActivated() {
        return activated;
    }
    
    public void setActivated(Boolean activated) {
        this.activated = activated;
    }
    
    public Boolean getIncrement() {
        return increment;
    }
    
    public void setIncrement(Boolean increment) {
        this.increment = increment;
    }
    
    public BigDecimal getValue() {
        return value;
    }
    
    public void setValue(BigDecimal value) {
        this.value = value;
    }
    
    public DateType getDateType() {
        return dateType;
    }
    
    public void setDateType(DateType dateType) {
        this.dateType = dateType;
    }
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    
    public String getWeekDays() {
        return weekDays;
    }
    
    public void setWeekDays(String weekDays) {
        this.weekDays = weekDays;
    }
    
    public ConditionType getConditionType() {
        return conditionType;
    }
    
    public void setConditionType(ConditionType conditionType) {
        this.conditionType = conditionType;
    }
    
    public Integer getAnticipationHours() {
        return anticipationHours;
    }
    
    public void setAnticipationHours(Integer anticipationHours) {
        this.anticipationHours = anticipationHours;
    }
    
    public Integer getMinDays() {
        return minDays;
    }
    
    public void setMinDays(Integer minDays) {
        this.minDays = minDays;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
