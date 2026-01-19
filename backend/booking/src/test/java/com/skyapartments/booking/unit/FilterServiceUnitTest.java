package com.skyapartments.booking.unit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.skyapartments.booking.dto.FilterDTO;
import com.skyapartments.booking.dto.FiltersByDateResponseDTO;
import com.skyapartments.booking.exception.BusinessValidationException;
import com.skyapartments.booking.exception.ResourceNotFoundException;
import com.skyapartments.booking.repository.FilterRepository;
import com.skyapartments.booking.service.FilterService;
import com.skyapartments.booking.model.ConditionType;
import com.skyapartments.booking.model.DateType;
import com.skyapartments.booking.model.Filter;

public class FilterServiceUnitTest {

    private FilterService filterService;
    private FilterRepository filterRepository = mock(FilterRepository.class);

    public FilterServiceUnitTest() {
        this.filterService = new FilterService(filterRepository);
    }

    private Filter validFilter;
    private FilterDTO validFilterDTO;

    @BeforeEach
    void setUp() {
        validFilter = createValidFilter();
        validFilterDTO = createValidFilterDTO();
    }

    @Test
    @DisplayName("Should return all filters ordered by ID")
    void shouldReturnAllFiltersOrderedById() {
        Filter filter1 = createValidFilter();
        filter1.setId(1L);
        Filter filter2 = createValidFilter();
        filter2.setId(2L);
        Pageable pageable = PageRequest.of(0, 10);

        when(filterRepository.findAllByOrderByIdAsc(pageable))
            .thenReturn(new PageImpl<>(List.of(filter1, filter2), pageable, 2));
        Page<FilterDTO> result = filterService.findAll(pageable);
        assertNotNull(result);
        assertThat(result).hasSize(2);
        verify(filterRepository, times(1)).findAllByOrderByIdAsc(pageable);
    }

    @Test
    @DisplayName("Should return empty list when no filters exist")
    void shouldReturnEmptyListWhenNoFilters() {
        Pageable pageable = PageRequest.of(0, 10);
        when(filterRepository.findAllByOrderByIdAsc(pageable)).thenReturn(new PageImpl<>(List.of(), pageable, 0));
        Page<FilterDTO> result = filterService.findAll(pageable);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should return filter when ID exists")
    void shouldReturnFilterWhenIdExists() {
        Long filterId = 1L;
        validFilter.setId(filterId);
        
        when(filterRepository.findById(filterId)).thenReturn(Optional.of(validFilter));
        FilterDTO result = filterService.findById(filterId);
        assertNotNull(result);
        assertEquals(filterId, result.getId());
        verify(filterRepository, times(1)).findById(filterId);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when ID does not exist")
    void shouldThrowExceptionWhenIdNotFound() {
        Long filterId = 999L;
        
        when(filterRepository.findById(filterId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, 
            () -> filterService.findById(filterId));
        
        verify(filterRepository, times(1)).findById(filterId);
    }

    @Test
    @DisplayName("Should create valid filter successfully")
    void shouldCreateValidFilterSuccessfully() {
        when(filterRepository.save(any(Filter.class))).thenReturn(validFilter);
        FilterDTO result = filterService.create(validFilterDTO);
        assertNotNull(result);
        verify(filterRepository, times(1)).save(any(Filter.class));
    }
    
    @Test
    @DisplayName("Should throw exception when name is null")
    void shouldThrowExceptionWhenNameIsNull() {
        validFilterDTO.setName(null);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
        
        verify(filterRepository, never()).save(any(Filter.class));
    }

    @Test
    @DisplayName("Should throw exception when name is empty")
    void shouldThrowExceptionWhenNameIsEmpty() {
        validFilterDTO.setName("   ");
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when value is null")
    void shouldThrowExceptionWhenValueIsNull() {
        validFilterDTO.setValue(null);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when value is negative")
    void shouldThrowExceptionWhenValueIsNegative() {
        validFilterDTO.setValue(new BigDecimal("-1"));
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when value exceeds 100")
    void shouldThrowExceptionWhenValueExceeds100() {
        validFilterDTO.setValue(new BigDecimal("101"));
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should accept value of 0")
    void shouldAcceptValueOfZero() {
        validFilterDTO.setValue(BigDecimal.ZERO);
        when(filterRepository.save(any(Filter.class))).thenReturn(validFilter);
        assertDoesNotThrow(() -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should accept value of 100")
    void shouldAcceptValueOf100() {
        validFilterDTO.setValue(new BigDecimal("100"));
        when(filterRepository.save(any(Filter.class))).thenReturn(validFilter);
        assertDoesNotThrow(() -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when dateType is null")
    void shouldThrowExceptionWhenDateTypeIsNull() {
        validFilterDTO.setDateType(null);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when DATE_RANGE without start date")
    void shouldThrowExceptionWhenDateRangeWithoutStartDate() {
        validFilterDTO.setDateType(DateType.DATE_RANGE);
        validFilterDTO.setStartDate(null);
        validFilterDTO.setEndDate(LocalDate.now().plusDays(5));
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when DATE_RANGE without end date")
    void shouldThrowExceptionWhenDateRangeWithoutEndDate() {
        validFilterDTO.setDateType(DateType.DATE_RANGE);
        validFilterDTO.setStartDate(LocalDate.now());
        validFilterDTO.setEndDate(null);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when start date is after end date")
    void shouldThrowExceptionWhenStartDateAfterEndDate() {
        validFilterDTO.setDateType(DateType.DATE_RANGE);
        validFilterDTO.setStartDate(LocalDate.now().plusDays(5));
        validFilterDTO.setEndDate(LocalDate.now());
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when WEEK_DAYS without weekDays value")
    void shouldThrowExceptionWhenWeekDaysWithoutValue() {
        validFilterDTO.setDateType(DateType.WEEK_DAYS);
        validFilterDTO.setWeekDays(null);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when WEEK_DAYS with empty weekDays")
    void shouldThrowExceptionWhenWeekDaysEmpty() {
        validFilterDTO.setDateType(DateType.WEEK_DAYS);
        validFilterDTO.setWeekDays("   ");
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should set default conditionType to NONE when null")
    void shouldSetDefaultConditionTypeToNone() {
        validFilterDTO.setConditionType(null);
        Filter savedFilter = createValidFilter();
        savedFilter.setConditionType(ConditionType.NONE);
        
        when(filterRepository.save(any(Filter.class))).thenReturn(savedFilter);
        FilterDTO result = filterService.create(validFilterDTO);
        assertNotNull(result);
        verify(filterRepository, times(1)).save(any(Filter.class));
    }

    @Test
    @DisplayName("Should throw exception when LAST_MINUTE without anticipation hours")
    void shouldThrowExceptionWhenLastMinuteWithoutAnticipationHours() {
        validFilterDTO.setConditionType(ConditionType.LAST_MINUTE);
        validFilterDTO.setAnticipationHours(null);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when LAST_MINUTE with zero anticipation hours")
    void shouldThrowExceptionWhenLastMinuteWithZeroHours() {
        validFilterDTO.setConditionType(ConditionType.LAST_MINUTE);
        validFilterDTO.setAnticipationHours(0);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when LAST_MINUTE with negative anticipation hours")
    void shouldThrowExceptionWhenLastMinuteWithNegativeHours() {
        validFilterDTO.setConditionType(ConditionType.LAST_MINUTE);
        validFilterDTO.setAnticipationHours(-1);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when LONG_STAY without min days")
    void shouldThrowExceptionWhenLongStayWithoutMinDays() {
        validFilterDTO.setConditionType(ConditionType.LONG_STAY);
        validFilterDTO.setMinDays(null);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when LONG_STAY with zero min days")
    void shouldThrowExceptionWhenLongStayWithZeroDays() {
        validFilterDTO.setConditionType(ConditionType.LONG_STAY);
        validFilterDTO.setMinDays(0);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should throw exception when LONG_STAY with negative min days")
    void shouldThrowExceptionWhenLongStayWithNegativeDays() {
        validFilterDTO.setConditionType(ConditionType.LONG_STAY);
        validFilterDTO.setMinDays(-1);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should set default activated to true when null")
    void shouldSetDefaultActivatedToTrue() {
        validFilterDTO.setActivated(null);
        Filter savedFilter = createValidFilter();
        savedFilter.setActivated(true);
        
        when(filterRepository.save(any(Filter.class))).thenReturn(savedFilter);
        assertDoesNotThrow(() -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should set default increment to false when null")
    void shouldSetDefaultIncrementToFalse() {
        validFilterDTO.setIncrement(null);
        Filter savedFilter = createValidFilter();
        savedFilter.setIncrement(false);
        
        when(filterRepository.save(any(Filter.class))).thenReturn(savedFilter);
        assertDoesNotThrow(() -> filterService.create(validFilterDTO));
    }

    @Test
    @DisplayName("Should update existing filter successfully")
    void shouldUpdateExistingFilterSuccessfully() {
        Long filterId = 1L;
        validFilter.setId(filterId);
        
        when(filterRepository.existsById(filterId)).thenReturn(true);
            when(filterRepository.save(any(Filter.class))).thenReturn(validFilter);

            FilterDTO result = filterService.update(filterId, validFilterDTO);

            assertNotNull(result);
            verify(filterRepository, times(1)).existsById(filterId);
            verify(filterRepository, times(1)).save(any(Filter.class));
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent filter")
    void shouldThrowExceptionWhenUpdatingNonExistentFilter() {
        Long filterId = 999L;
        
        when(filterRepository.existsById(filterId)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, 
            () -> filterService.update(filterId, validFilterDTO));
        
        verify(filterRepository, times(1)).existsById(filterId);
        verify(filterRepository, never()).save(any(Filter.class));
    }

    @Test
    @DisplayName("Should validate filter data when updating")
    void shouldValidateFilterDataWhenUpdating() {
        Long filterId = 1L;
        validFilterDTO.setValue(new BigDecimal("150"));
        
        when(filterRepository.existsById(filterId)).thenReturn(true);
        assertThrows(BusinessValidationException.class, 
            () -> filterService.update(filterId, validFilterDTO));
    }

    @Test
    @DisplayName("Should delete existing filter successfully")
    void shouldDeleteExistingFilterSuccessfully() {
        Long filterId = 1L;
        
        when(filterRepository.existsById(filterId)).thenReturn(true);
        doNothing().when(filterRepository).deleteById(filterId);
        assertDoesNotThrow(() -> filterService.delete(filterId));
        
        verify(filterRepository, times(1)).existsById(filterId);
        verify(filterRepository, times(1)).deleteById(filterId);
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent filter")
    void shouldThrowExceptionWhenDeletingNonExistentFilter() {
        Long filterId = 999L;
        
        when(filterRepository.existsById(filterId)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, 
            () -> filterService.delete(filterId));
        
        verify(filterRepository, times(1)).existsById(filterId);
        verify(filterRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Should return applicable filters for date range")
    void shouldReturnApplicableFiltersForDateRange() {
        LocalDate checkIn = LocalDate.of(2024, 1, 1);
        LocalDate checkOut = LocalDate.of(2024, 1, 3);
        
        Filter filter1 = createValidFilter();
        filter1.setActivated(true);
        
        when(filterRepository.findByActivatedTrueOrderByIdAsc())
            .thenReturn(List.of(filter1));
        FiltersByDateResponseDTO result = 
            filterService.getApplicableFiltersByDate(checkIn, checkOut);
        assertNotNull(result);
        assertEquals(checkIn, result.getCheckInDate());
        assertEquals(checkOut, result.getCheckOutDate());
        assertEquals(2, result.getTotalNights());
        assertNotNull(result.getFiltersByDate());
        
        verify(filterRepository, times(1)).findByActivatedTrueOrderByIdAsc();
    }

    @Test
    @DisplayName("Should return empty filters when no filters are activated")
    void shouldReturnEmptyFiltersWhenNoActivatedFilters() {
        LocalDate checkIn = LocalDate.of(2024, 1, 1);
        LocalDate checkOut = LocalDate.of(2024, 1, 2);
        
        when(filterRepository.findByActivatedTrueOrderByIdAsc())
            .thenReturn(List.of());
        FiltersByDateResponseDTO result = 
            filterService.getApplicableFiltersByDate(checkIn, checkOut);
        assertNotNull(result);
        assertEquals(1, result.getTotalNights());
        assertNotNull(result.getFiltersByDate());
    }

    @Test
    @DisplayName("Should calculate correct number of nights")
    void shouldCalculateCorrectNumberOfNights() {
        LocalDate checkIn = LocalDate.of(2024, 1, 1);
        LocalDate checkOut = LocalDate.of(2024, 1, 11);
        
        when(filterRepository.findByActivatedTrueOrderByIdAsc())
            .thenReturn(List.of());
        FiltersByDateResponseDTO result = 
            filterService.getApplicableFiltersByDate(checkIn, checkOut);
        assertEquals(10, result.getTotalNights());
    }

    @Test
    @DisplayName("Should process filters for each night separately")
    void shouldProcessFiltersForEachNightSeparately() {
        LocalDate checkIn = LocalDate.of(2024, 1, 1);
        LocalDate checkOut = LocalDate.of(2024, 1, 4);
        
        Filter filter = createValidFilter();
        filter.setActivated(true);
        
        when(filterRepository.findByActivatedTrueOrderByIdAsc())
            .thenReturn(List.of(filter));
        FiltersByDateResponseDTO result = 
            filterService.getApplicableFiltersByDate(checkIn, checkOut);
        assertEquals(3, result.getFiltersByDate().size());
    }
    
    private Filter createValidFilter() {
        Filter filter = new Filter();
        filter.setId(1L);
        filter.setName("Test Filter");
        filter.setDescription("Test Description");
        filter.setActivated(true);
        filter.setIncrement(false);
        filter.setValue(new BigDecimal("10"));
        filter.setDateType(DateType.DATE_RANGE);
        filter.setStartDate(LocalDate.now());
        filter.setEndDate(LocalDate.now().plusDays(10));
        filter.setWeekDays("1,2,3,4,5");
        filter.setConditionType(ConditionType.NONE);
        filter.setAnticipationHours(24);
        filter.setMinDays(3);
        return filter;
    }

    private FilterDTO createValidFilterDTO() {
        FilterDTO dto = new FilterDTO();
        dto.setName("Test Filter");
        dto.setDescription("Test Description");
        dto.setActivated(true);
        dto.setIncrement(false);
        dto.setValue(new BigDecimal("10"));
        dto.setDateType(DateType.DATE_RANGE);
        dto.setStartDate(LocalDate.now());
        dto.setEndDate(LocalDate.now().plusDays(10));
        dto.setWeekDays("1,2,3,4,5");
        dto.setConditionType(ConditionType.NONE);
        dto.setAnticipationHours(24);
        dto.setMinDays(3);
        return dto;
    }
}
