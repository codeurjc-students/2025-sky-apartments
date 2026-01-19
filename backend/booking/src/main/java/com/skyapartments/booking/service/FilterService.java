package com.skyapartments.booking.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.skyapartments.booking.dto.FiltersByDateResponseDTO;
import com.skyapartments.booking.exception.BusinessValidationException;
import com.skyapartments.booking.exception.ResourceNotFoundException;
import com.skyapartments.booking.dto.FilterDTO;
import com.skyapartments.booking.model.ConditionType;
import com.skyapartments.booking.model.DateType;
import com.skyapartments.booking.model.Filter;
import com.skyapartments.booking.repository.FilterRepository;

@Service
public class FilterService {

    private final FilterRepository filterRepository;

    public FilterService(FilterRepository filterRepository) {
        this.filterRepository = filterRepository;
    }

    public Page<FilterDTO> findAll(Pageable pageable) {
        return filterRepository.findAllByOrderByIdAsc(pageable).map(filter -> new FilterDTO(filter));
    }

    public FilterDTO findById(Long id) {
        Filter filter = filterRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Filter not found with id: " + id));
        return new FilterDTO(filter);
    }
    
    public FilterDTO create(FilterDTO filterDTO) {
        Filter filter = new Filter(filterDTO);
        validateFilter(filter);
        Filter savedFilter = filterRepository.save(filter);
        return new FilterDTO(savedFilter);
    }
    
    public FilterDTO update(Long id, FilterDTO filterDTO) {
        if (!filterRepository.existsById(id)) {
            throw new ResourceNotFoundException("Filter not found with id: " + id);
        }
        Filter filter = new Filter(filterDTO);
        filter.setId(id);
        validateFilter(filter);
        Filter updatedFilter = filterRepository.save(filter);
        return new FilterDTO(updatedFilter);
    }
    
    public void delete(Long id) {
        if (!filterRepository.existsById(id)) {
            throw new ResourceNotFoundException("Filter not found with id: " + id);
        }
        filterRepository.deleteById(id);
    }

    public FiltersByDateResponseDTO getApplicableFiltersByDate(LocalDate checkInDate, LocalDate checkOutDate) {
        List<Filter> allFilters = filterRepository.findByActivatedTrueOrderByIdAsc();
        
        // Map to store filters for each date
        Map<LocalDate, List<FilterDTO>> filtersByDate = new LinkedHashMap<>();
        
        // Iterate through each night
        LocalDate currentDate = checkInDate;
        while (currentDate.isBefore(checkOutDate)) {
            List<FilterDTO> applicableFilters = new ArrayList<>();
            
            // Check which filters apply to this specific date
            for (Filter filter : allFilters) {
                if (filter.isApplicableOnDate(currentDate) && 
                    filter.meetsCondition(checkInDate, checkOutDate)) {
                    applicableFilters.add(new FilterDTO(filter));
                }
            }
            
            filtersByDate.put(currentDate, applicableFilters);
            currentDate = currentDate.plusDays(1);
        }
        
        int totalNights = (int) java.time.temporal.ChronoUnit.DAYS.between(checkInDate, checkOutDate);
        
        return new FiltersByDateResponseDTO(checkInDate, checkOutDate, totalNights, filtersByDate);
    }

    private void validateFilter(Filter filter) {
        if (filter.getName() == null || filter.getName().trim().isEmpty()) {
            throw new BusinessValidationException("Filter name is required");
        }
        
        if (filter.getValue() == null) {
            throw new BusinessValidationException("Filter value is required");
        }
        
        if (filter.getValue().compareTo(BigDecimal.ZERO) < 0 
            || filter.getValue().compareTo(new BigDecimal(100)) > 0) {
            throw new BusinessValidationException("Value must be between 0 and 100");
        }
        
        if (filter.getDateType() == null) {
            throw new BusinessValidationException("Date type is required");
        }
        
        if (filter.getDateType() == DateType.DATE_RANGE || 
            filter.getDateType() == DateType.DATE_RANGE_WEEK_DAYS) {
            if (filter.getStartDate() == null || filter.getEndDate() == null) {
                throw new BusinessValidationException(
                    "Start date and end date are required for " + filter.getDateType() + " type");
            }
            if (filter.getStartDate().isAfter(filter.getEndDate())) {
                throw new BusinessValidationException("Start date must be before end date");
            }
        }
        
        if (filter.getDateType() == DateType.WEEK_DAYS || 
            filter.getDateType() == DateType.DATE_RANGE_WEEK_DAYS) {
            if (filter.getWeekDays() == null || filter.getWeekDays().trim().isEmpty()) {
                throw new BusinessValidationException(
                    "Week days are required for " + filter.getDateType() + " type");
            }
            validateWeekDaysFormat(filter.getWeekDays());
        }

        if (filter.getConditionType() == null) {
            filter.setConditionType(ConditionType.NONE);
        }
        
        if (filter.getConditionType() == ConditionType.LAST_MINUTE) {
            if (filter.getAnticipationHours() == null || filter.getAnticipationHours() <= 0) {
                throw new BusinessValidationException("Anticipation hours must be greater than 0 for LAST_MINUTE type");
            }
        }
        
        if (filter.getConditionType() == ConditionType.LONG_STAY) {
            if (filter.getMinDays() == null || filter.getMinDays() <= 0) {
                throw new BusinessValidationException("Min days must be greater than 0 for LONG_STAY type");
            }
        }
        
        if (filter.getActivated() == null) {
            filter.setActivated(true);
        }
        
        if (filter.getIncrement() == null) {
            filter.setIncrement(false);
        }
    }

    private void validateWeekDaysFormat(String weekDays) {
        try {
            String[] days = weekDays.split(",");
            for (String day : days) {
                int dayNum = Integer.parseInt(day.trim());
                if (dayNum < 1 || dayNum > 7) {
                    throw new BusinessValidationException(
                        "Week days must be between 1 (Monday) and 7 (Sunday)");
                }
            }
        } catch (NumberFormatException e) {
            throw new BusinessValidationException("Invalid week days format. Use comma-separated numbers (e.g., '5,6,7')");
        }
    }
    
}
