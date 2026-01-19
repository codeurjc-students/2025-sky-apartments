package com.skyapartments.booking.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.skyapartments.booking.dto.FilterDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Filter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Column(nullable = false)
    private Boolean activated = true;
    
    @Column(nullable = false)
    private Boolean increment; // true = increment, false = discount
    
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal value;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DateType dateType;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    @Column(length = 20)
    private String weekDays; // ex: "5,6,7" for friday, saturday, sunday
    
    @Enumerated(EnumType.STRING)
    private ConditionType conditionType;
    
    private Integer anticipationHours;
    
    private Integer minDays;

    public Filter() {
    }

    public Filter(FilterDTO filterDTO) {
        this.id = filterDTO.getId();
        this.name = filterDTO.getName();
        this.description = filterDTO.getDescription();
        this.activated = filterDTO.getActivated();
        this.increment = filterDTO.getIncrement();
        this.value = filterDTO.getValue();
        this.dateType = filterDTO.getDateType();
        this.startDate = filterDTO.getStartDate();
        this.endDate = filterDTO.getEndDate();
        this.weekDays = filterDTO.getWeekDays();
        this.conditionType = filterDTO.getConditionType();
        this.anticipationHours = filterDTO.getAnticipationHours();
        this.minDays = filterDTO.getMinDays();
    }

    public Filter(Long id, String name, String description, Boolean activated, Boolean increment, BigDecimal value,
            DateType dateType, LocalDate startDate, LocalDate endDate, String weekDays, ConditionType conditionType,
            Integer anticipationHours, Integer minDays) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.activated = activated;
        this.increment = increment;
        this.value = value;
        this.dateType = dateType;
        this.startDate = startDate;
        this.endDate = endDate;
        this.weekDays = weekDays;
        this.conditionType = conditionType;
        this.anticipationHours = anticipationHours;
        this.minDays = minDays;
    }

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

    public boolean isApplicableOnDate(LocalDate date) {
        if (!activated) return false;
        
        switch (dateType) {
            case EVERY_DAY:
                return true;
                
            case DATE_RANGE:
                if (startDate == null || endDate == null) return false;
                return !date.isBefore(startDate) && !date.isAfter(endDate);
                
            case WEEK_DAYS:
                return isWeekDayMatch(date);
                
            case DATE_RANGE_WEEK_DAYS:
                if (startDate == null || endDate == null) return false;
                boolean inRange = !date.isBefore(startDate) && !date.isAfter(endDate);
                return inRange && isWeekDayMatch(date);
                
            default:
                return false;
        }
    }

    private boolean isWeekDayMatch(LocalDate date) {
        if (weekDays == null || weekDays.trim().isEmpty()) {
            return false;
        }
        
        int currentDayOfWeek = date.getDayOfWeek().getValue(); // 1=Monday, 7=Sunday
        
        // Dividir por comas y verificar cada día
        String[] days = weekDays.split(",");
        for (String day : days) {
            try {
                if (Integer.parseInt(day.trim()) == currentDayOfWeek) {
                    return true;
                }
            } catch (NumberFormatException e) {
                // Si hay un formato inválido, continuar con el siguiente
                continue;
            }
        }
        
        return false;
    }
    
    public boolean meetsCondition(LocalDate checkInDate, LocalDate checkOutDate) {
        if (conditionType == null || conditionType == ConditionType.NONE) {
            return true;
        }
        
        switch (conditionType) {
            case LAST_MINUTE:
                if (anticipationHours == null) return false;
                long hoursUntilReservation = java.time.Duration.between(
                    LocalDateTime.now(),
                    checkInDate.atStartOfDay()
                ).toHours();
                return hoursUntilReservation <= anticipationHours;
                
            case LONG_STAY:
                if (minDays == null) return false;
                long reservationDays = java.time.temporal.ChronoUnit.DAYS
                    .between(checkInDate, checkOutDate);
                return reservationDays >= minDays;
                
            default:
                return true;
        }
    }
}
