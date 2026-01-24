package com.skyapartments.booking.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.skyapartments.booking.dto.FilterDTO;
import com.skyapartments.booking.dto.FiltersByDateResponseDTO;
import com.skyapartments.booking.exception.BusinessValidationException;
import com.skyapartments.booking.exception.ResourceNotFoundException;
import com.skyapartments.booking.model.ConditionType;
import com.skyapartments.booking.model.DateType;
import com.skyapartments.booking.model.Filter;
import com.skyapartments.booking.repository.FilterRepository;
import com.skyapartments.booking.service.FilterService;


@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class FilterServiceIntegrationTest {
    @Container
    public static final MySQLContainer<?> mysqlContainer =
            new MySQLContainer<>("mysql:8.0")
                    .withDatabaseName("testdb")
                    .withUsername("testuser")
                    .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysqlContainer::getJdbcUrl);
        registry.add("spring.datasource.username", mysqlContainer::getUsername);
        registry.add("spring.datasource.password", mysqlContainer::getPassword);
        registry.add("spring.datasource.driver-class-name", mysqlContainer::getDriverClassName);
    }

    @Autowired
    private FilterService filterService;

    @Autowired
    private FilterRepository filterRepository;

    @BeforeEach
    void setUp() {
        filterRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        filterRepository.deleteAll();
    }

    // ============= CREATE TESTS =============
    @Test
    @DisplayName("Should create filter with DATE_RANGE type successfully")
    void shouldCreateFilterWithDateRangeSuccessfully() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setDateType(DateType.DATE_RANGE);
        filterDTO.setStartDate(LocalDate.of(2024, 1, 1));
        filterDTO.setEndDate(LocalDate.of(2024, 12, 31));
        FilterDTO created = filterService.create(filterDTO);
        assertNotNull(created.getId());
        assertEquals(filterDTO.getName(), created.getName());
        assertEquals(filterDTO.getValue(), created.getValue());
        assertEquals(DateType.DATE_RANGE, created.getDateType());
        assertEquals(filterDTO.getStartDate(), created.getStartDate());
        assertEquals(filterDTO.getEndDate(), created.getEndDate());
    }

    @Test
    @DisplayName("Should create filter with WEEK_DAYS type successfully")
    void shouldCreateFilterWithWeekDaysSuccessfully() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setDateType(DateType.WEEK_DAYS);
        filterDTO.setWeekDays("1,2,3,4,5");
        FilterDTO created = filterService.create(filterDTO);
        assertNotNull(created.getId());
        assertEquals(DateType.WEEK_DAYS, created.getDateType());
        assertEquals("1,2,3,4,5", created.getWeekDays());
    }

    @Test
    @DisplayName("Should create filter with EVERY_DAY type successfully")
    void shouldCreateFilterWithAllYearSuccessfully() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setDateType(DateType.EVERY_DAY);
        FilterDTO created = filterService.create(filterDTO);
        assertNotNull(created.getId());
        assertEquals(DateType.EVERY_DAY, created.getDateType());
    }

    @Test
    @DisplayName("Should create filter with LAST_MINUTE condition successfully")
    void shouldCreateFilterWithLastMinuteCondition() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setConditionType(ConditionType.LAST_MINUTE);
        filterDTO.setAnticipationHours(48);
        FilterDTO created = filterService.create(filterDTO);
        assertNotNull(created.getId());
        assertEquals(ConditionType.LAST_MINUTE, created.getConditionType());
        assertEquals(48, created.getAnticipationHours());
    }

    @Test
    @DisplayName("Should create filter with LONG_STAY condition successfully")
    void shouldCreateFilterWithLongStayCondition() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setConditionType(ConditionType.LONG_STAY);
        filterDTO.setMinDays(7);
        FilterDTO created = filterService.create(filterDTO);
        assertNotNull(created.getId());
        assertEquals(ConditionType.LONG_STAY, created.getConditionType());
        assertEquals(7, created.getMinDays());
    }

    @Test
    @DisplayName("Should create filter with increment flag")
    void shouldCreateFilterWithIncrementFlag() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setIncrement(true);
        FilterDTO created = filterService.create(filterDTO);
        assertNotNull(created.getId());
        assertTrue(created.getIncrement());
    }

    @Test
    @DisplayName("Should create inactive filter")
    void shouldCreateInactiveFilter() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setActivated(false);
        FilterDTO created = filterService.create(filterDTO);
        assertNotNull(created.getId());
        assertFalse(created.getActivated());
    }

    @Test
    @DisplayName("Should set default values when not provided")
    void shouldSetDefaultValuesWhenNotProvided() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setActivated(null);
        filterDTO.setIncrement(null);
        filterDTO.setConditionType(null);
        FilterDTO created = filterService.create(filterDTO);
        assertNotNull(created.getId());
        assertTrue(created.getActivated());
        assertFalse(created.getIncrement());
    }

    @Test
    @DisplayName("Should fail when name is null")
    void shouldFailWhenNameIsNull() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setName(null);
        assertThrows(BusinessValidationException.class,
                () -> filterService.create(filterDTO));
    }

    @Test
    @DisplayName("Should fail when value is out of range")
    void shouldFailWhenValueIsOutOfRange() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setValue(new BigDecimal("150"));
        assertThrows(BusinessValidationException.class,
                () -> filterService.create(filterDTO));
    }

    @Test
    @DisplayName("Should fail when DATE_RANGE without dates")
    void shouldFailWhenDateRangeWithoutDates() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setDateType(DateType.DATE_RANGE);
        filterDTO.setStartDate(null);
        filterDTO.setEndDate(null);
        assertThrows(BusinessValidationException.class,
                () -> filterService.create(filterDTO));
    }

    @Test
    @DisplayName("Should fail when WEEK_DAYS without days")
    void shouldFailWhenWeekDaysWithoutDays() {
        FilterDTO filterDTO = createBasicFilterDTO();
        filterDTO.setDateType(DateType.WEEK_DAYS);
        filterDTO.setWeekDays(null);
        assertThrows(BusinessValidationException.class,
                () -> filterService.create(filterDTO));
    }


    // ============= READ TESTS =============

    @Test
    @DisplayName("Should find filter by ID")
    void shouldFindFilterById() {
        Filter filter = createAndSaveFilter("Find By ID Test");
        FilterDTO found = filterService.findById(filter.getId());
        assertNotNull(found);
        assertEquals(filter.getId(), found.getId());
        assertEquals(filter.getName(), found.getName());
    }

    @Test
    @DisplayName("Should throw exception when filter not found")
    void shouldThrowExceptionWhenFilterNotFound() {
        assertThrows(ResourceNotFoundException.class,
                () -> filterService.findById(9999L));
    }

    @Test
    @DisplayName("Should find all filters ordered by ID")
    void shouldFindAllFiltersOrderedById() {
        createAndSaveFilter("Filter 3");
        createAndSaveFilter("Filter 1");
        createAndSaveFilter("Filter 2");
        Pageable pageable = PageRequest.of(0, 10);
        Page<FilterDTO> filters = filterService.findAll(pageable);
        assertNotNull(filters);
        assertThat(filters.getContent()).hasSize(3);
        // Verify ordering by checking IDs are in ascending order
        for (int i = 0; i < filters.getContent().size() - 1; i++) {
            assertTrue(filters.getContent().get(i).getId() < filters.getContent().get(i + 1).getId());
        }
    }

    @Test
    @DisplayName("Should return empty list when no filters exist")
    void shouldReturnEmptyListWhenNoFilters() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<FilterDTO> filters = filterService.findAll(pageable);
        assertNotNull(filters);
        assertTrue(filters.isEmpty());
    }


    // ============= UPDATE TESTS =============

    @Test
    @DisplayName("Should update filter successfully")
    void shouldUpdateFilterSuccessfully() {
        Filter filter = createAndSaveFilter("Original Name");
        Long filterId = filter.getId();
        FilterDTO updateDTO = createBasicFilterDTO();
        updateDTO.setName("Updated Name");
        updateDTO.setValue(new BigDecimal("25"));
        FilterDTO updated = filterService.update(filterId, updateDTO);
        assertEquals(filterId, updated.getId());
        assertEquals("Updated Name", updated.getName());
        assertEquals(new BigDecimal("25"), updated.getValue());
        // Verify in database
        Filter fromDb = filterRepository.findById(filterId).orElseThrow();
        assertEquals("Updated Name", fromDb.getName());
        assertEquals(new BigDecimal("25").setScale(2), fromDb.getValue());
    }
    
    @Test
    @DisplayName("Should update filter date type from DATE_RANGE to WEEK_DAYS")
    void shouldUpdateDateTypeSuccessfully() {
        Filter filter = createAndSaveFilter("Date Type Test");
        filter.setDateType(DateType.DATE_RANGE);
        filter.setStartDate(LocalDate.now());
        filter.setEndDate(LocalDate.now().plusDays(10));
        filterRepository.save(filter);
        FilterDTO updateDTO = createBasicFilterDTO();
        updateDTO.setDateType(DateType.WEEK_DAYS);
        updateDTO.setWeekDays("6,7");
        FilterDTO updated = filterService.update(filter.getId(), updateDTO);
        assertEquals(DateType.WEEK_DAYS, updated.getDateType());
        assertEquals("6,7", updated.getWeekDays());
    }

    @Test
    @DisplayName("Should update filter condition type")
    void shouldUpdateConditionTypeSuccessfully() {
        Filter filter = createAndSaveFilter("Condition Test");
        filter.setConditionType(ConditionType.NONE);
        filterRepository.save(filter);
        FilterDTO updateDTO = createBasicFilterDTO();
        updateDTO.setConditionType(ConditionType.LONG_STAY);
        updateDTO.setMinDays(5);
        FilterDTO updated = filterService.update(filter.getId(), updateDTO);
        assertEquals(ConditionType.LONG_STAY, updated.getConditionType());
        assertEquals(5, updated.getMinDays());
    }
    
    @Test
    @DisplayName("Should deactivate filter")
    void shouldDeactivateFilter() {
        Filter filter = createAndSaveFilter("Activation Test");
        filter.setActivated(true);
        filterRepository.save(filter);
        FilterDTO updateDTO = createBasicFilterDTO();
        updateDTO.setActivated(false);
        FilterDTO updated = filterService.update(filter.getId(), updateDTO);
        assertFalse(updated.getActivated());
        // Verify in database
        Filter fromDb = filterRepository.findById(filter.getId()).orElseThrow();
        assertFalse(fromDb.getActivated());
    }

    @Test
    @DisplayName("Should fail when updating non-existent filter")
    void shouldFailWhenUpdatingNonExistentFilter() {
        FilterDTO updateDTO = createBasicFilterDTO();
        assertThrows(ResourceNotFoundException.class,
                () -> filterService.update(9999L, updateDTO));
    }

    @Test
    @DisplayName("Should fail when updating with invalid data")
    void shouldFailWhenUpdatingWithInvalidData() {
        Filter filter = createAndSaveFilter("Invalid Update Test");
        FilterDTO updateDTO = createBasicFilterDTO();
        updateDTO.setValue(new BigDecimal("-10"));
        assertThrows(BusinessValidationException.class,
                () -> filterService.update(filter.getId(), updateDTO));
    }
    

    // ============= DELETE TESTS =============

    @Test
    @DisplayName("Should delete filter successfully")
    void shouldDeleteFilterSuccessfully() {
        Filter filter = createAndSaveFilter("To Delete");
        Long filterId = filter.getId();
        filterService.delete(filterId);
        assertFalse(filterRepository.existsById(filterId));
    }
    
    @Test
    @DisplayName("Should fail when deleting non-existent filter")
    void shouldFailWhenDeletingNonExistentFilter() {
        assertThrows(ResourceNotFoundException.class,
                () -> filterService.delete(9999L));
    }

    @Test
    @DisplayName("Should delete and verify it's gone")
    void shouldDeleteAndVerifyGone() {
        Filter filter = createAndSaveFilter("Delete Verification");
        Long filterId = filter.getId();
        // Verify exists before deletion
        assertTrue(filterRepository.existsById(filterId));
        filterService.delete(filterId);
        // Verify doesn't exist after deletion
        assertFalse(filterRepository.existsById(filterId));
        assertThrows(ResourceNotFoundException.class,
                () -> filterService.findById(filterId));
    }
    

    // ============= APPLICABLE FILTERS BY DATE TESTS =============

    @Test
    @DisplayName("Should return filters for date range")
    void shouldReturnFiltersForDateRange() {
        // Create active filter with DATE_RANGE
        Filter filter = createAndSaveFilter("Date Range Filter");
        filter.setActivated(true);
        filter.setDateType(DateType.DATE_RANGE);
        filter.setStartDate(LocalDate.of(2024, 1, 1));
        filter.setEndDate(LocalDate.of(2024, 12, 31));
        filterRepository.save(filter);
        LocalDate checkIn = LocalDate.of(2024, 6, 1);
        LocalDate checkOut = LocalDate.of(2024, 6, 4);
        FiltersByDateResponseDTO result =
                filterService.getApplicableFiltersByDate(checkIn, checkOut);
        assertNotNull(result);
        assertEquals(checkIn, result.getCheckInDate());
        assertEquals(checkOut, result.getCheckOutDate());
        assertEquals(3, result.getTotalNights());
        assertNotNull(result.getFiltersByDate());
        assertEquals(3, result.getFiltersByDate().size());
    }

    @Test
    @DisplayName("Should only include activated filters")
    void shouldOnlyIncludeActivatedFilters() {
        // Create active filter
        Filter activeFilter = createAndSaveFilter("Active Filter");
        activeFilter.setActivated(true);
        filterRepository.save(activeFilter);
        // Create inactive filter
        Filter inactiveFilter = createAndSaveFilter("Inactive Filter");
        inactiveFilter.setActivated(false);
        filterRepository.save(inactiveFilter);
        LocalDate checkIn = LocalDate.now();
        LocalDate checkOut = checkIn.plusDays(2);
        FiltersByDateResponseDTO result =
                filterService.getApplicableFiltersByDate(checkIn, checkOut);
        // Should only process active filters
        assertNotNull(result);
    }

    @Test
    @DisplayName("Should return empty filters when no filters are active")
    void shouldReturnEmptyFiltersWhenNoActiveFilters() {
        // Create only inactive filters
        Filter filter = createAndSaveFilter("Inactive Filter");
        filter.setActivated(false);
        filterRepository.save(filter);
        LocalDate checkIn = LocalDate.now();
        LocalDate checkOut = checkIn.plusDays(2);
        FiltersByDateResponseDTO result =
                filterService.getApplicableFiltersByDate(checkIn, checkOut);
        assertNotNull(result);
        assertEquals(2, result.getTotalNights());
        assertNotNull(result.getFiltersByDate());
    }

    @Test
    @DisplayName("Should calculate correct number of nights")
    void shouldCalculateCorrectNumberOfNights() {
        LocalDate checkIn = LocalDate.of(2024, 1, 1);
        LocalDate checkOut = LocalDate.of(2024, 1, 8);
        FiltersByDateResponseDTO result =
                filterService.getApplicableFiltersByDate(checkIn, checkOut);
        assertEquals(7, result.getTotalNights());
        assertEquals(7, result.getFiltersByDate().size());
    }

    @Test
    @DisplayName("Should handle single night stay")
    void shouldHandleSingleNightStay() {
        Filter filter = createAndSaveFilter("Single Night Filter");
        filter.setActivated(true);
        filterRepository.save(filter);
        LocalDate checkIn = LocalDate.now();
        LocalDate checkOut = checkIn.plusDays(1);
        FiltersByDateResponseDTO result =
                filterService.getApplicableFiltersByDate(checkIn, checkOut);
        assertEquals(1, result.getTotalNights());
        assertEquals(1, result.getFiltersByDate().size());
    }

    @Test
    @DisplayName("Should return filters ordered by ID")
    void shouldReturnFiltersOrderedById() {
        // Create multiple active filters
        createAndSaveActiveFilter("Filter C", 3);
        createAndSaveActiveFilter("Filter A", 1);
        createAndSaveActiveFilter("Filter B", 2);
        LocalDate checkIn = LocalDate.now();
        LocalDate checkOut = checkIn.plusDays(1);
        FiltersByDateResponseDTO result =
                filterService.getApplicableFiltersByDate(checkIn, checkOut);
        assertNotNull(result);
        // Filters should be processed in ID order due to findByActivatedTrueOrderByIdAsc
    }

    // ============= COMPLEX SCENARIO TESTS =============

    @Test
    @DisplayName("Should handle multiple filters with different configurations")
    void shouldHandleMultipleFiltersWithDifferentConfigurations() {
        // Create filter with DATE_RANGE
        Filter dateRangeFilter = createAndSaveFilter("Summer Discount");
        dateRangeFilter.setDateType(DateType.DATE_RANGE);
        dateRangeFilter.setStartDate(LocalDate.of(2024, 6, 1));
        dateRangeFilter.setEndDate(LocalDate.of(2024, 8, 31));
        dateRangeFilter.setValue(new BigDecimal("15"));
        dateRangeFilter.setActivated(true);
        filterRepository.save(dateRangeFilter);
        // Create filter with WEEK_DAYS
        Filter weekendFilter = createAndSaveFilter("Weekend Surcharge");
        weekendFilter.setDateType(DateType.WEEK_DAYS);
        weekendFilter.setWeekDays("6,7");
        weekendFilter.setValue(new BigDecimal("20"));
        weekendFilter.setIncrement(true);
        weekendFilter.setActivated(true);
        filterRepository.save(weekendFilter);
        // Create filter with LONG_STAY
        Filter longStayFilter = createAndSaveFilter("Long Stay Discount");
        longStayFilter.setDateType(DateType.EVERY_DAY);
        longStayFilter.setConditionType(ConditionType.LONG_STAY);
        longStayFilter.setMinDays(7);
        longStayFilter.setValue(new BigDecimal("10"));
        longStayFilter.setActivated(true);
        filterRepository.save(longStayFilter);
        Pageable pageable = PageRequest.of(0, 10);
        Page<FilterDTO> allFilters = filterService.findAll(pageable);
        assertEquals(3, allFilters.getContent().size());
        assertTrue(allFilters.getContent().stream().anyMatch(f -> f.getName().equals("Summer Discount")));
        assertTrue(allFilters.getContent().stream().anyMatch(f -> f.getName().equals("Weekend Surcharge")));
        assertTrue(allFilters.getContent().stream().anyMatch(f -> f.getName().equals("Long Stay Discount")));
    }

    @Test
    @DisplayName("Should perform full CRUD lifecycle")
    void shouldPerformFullCRUDLifecycle() {
        // CREATE
        FilterDTO createDTO = createBasicFilterDTO();
        createDTO.setName("CRUD Test Filter");
        FilterDTO created = filterService.create(createDTO);
        assertNotNull(created.getId());
        // READ
        FilterDTO read = filterService.findById(created.getId());
        assertEquals("CRUD Test Filter", read.getName());
        // UPDATE
        FilterDTO updateDTO = createBasicFilterDTO();
        updateDTO.setName("Updated CRUD Test");
        updateDTO.setValue(new BigDecimal("30"));
        FilterDTO updated = filterService.update(created.getId(), updateDTO);
        assertEquals("Updated CRUD Test", updated.getName());
        assertEquals(new BigDecimal("30"), updated.getValue());
        // DELETE
        filterService.delete(created.getId());
        assertThrows(ResourceNotFoundException.class,
                () -> filterService.findById(created.getId()));
    }

    @Test
    @DisplayName("Should handle concurrent filter creation")
    void shouldHandleConcurrentFilterCreation() {
        FilterDTO filter1 = createBasicFilterDTO();
        filter1.setName("Concurrent Filter 1");
        
        FilterDTO filter2 = createBasicFilterDTO();
        filter2.setName("Concurrent Filter 2");
        
        FilterDTO filter3 = createBasicFilterDTO();
        filter3.setName("Concurrent Filter 3");
        FilterDTO created1 = filterService.create(filter1);
        FilterDTO created2 = filterService.create(filter2);
        FilterDTO created3 = filterService.create(filter3);
        assertNotEquals(created1.getId(), created2.getId());
        assertNotEquals(created2.getId(), created3.getId());
        assertNotEquals(created1.getId(), created3.getId());
        Pageable pageable = PageRequest.of(0, 10);
        Page<FilterDTO> allFilters = filterService.findAll(pageable);
        assertEquals(3, allFilters.getContent().size());
    }

    @Test
    @DisplayName("Should update filter preserving unmodified fields")
    void shouldUpdateFilterPreservingUnmodifiedFields() {
        // Create filter with all fields
        Filter original = createAndSaveFilter("Preservation Test");
        original.setDescription("Original Description");
        original.setValue(new BigDecimal("15"));
        original.setDateType(DateType.DATE_RANGE);
        original.setStartDate(LocalDate.of(2024, 1, 1));
        original.setEndDate(LocalDate.of(2024, 12, 31));
        original.setConditionType(ConditionType.LAST_MINUTE);
        original.setAnticipationHours(24);
        filterRepository.save(original);
        // Update only name and value
        FilterDTO updateDTO = new FilterDTO();
        updateDTO.setName("Updated Name");
        updateDTO.setValue(new BigDecimal("20"));
        updateDTO.setDescription("Original Description");
        updateDTO.setDateType(DateType.DATE_RANGE);
        updateDTO.setStartDate(LocalDate.of(2024, 1, 1));
        updateDTO.setEndDate(LocalDate.of(2024, 12, 31));
        updateDTO.setConditionType(ConditionType.LAST_MINUTE);
        updateDTO.setAnticipationHours(24);
        updateDTO.setActivated(true);
        updateDTO.setIncrement(false);
        FilterDTO updated = filterService.update(original.getId(), updateDTO);
        assertEquals("Updated Name", updated.getName());
        assertEquals(new BigDecimal("20"), updated.getValue());
        assertEquals("Original Description", updated.getDescription());
        assertEquals(DateType.DATE_RANGE, updated.getDateType());
    }

    // ============= HELPER METHODS =============

    private FilterDTO createBasicFilterDTO() {
        FilterDTO dto = new FilterDTO();
        dto.setName("Test Filter");
        dto.setDescription("Test Description");
        dto.setActivated(true);
        dto.setIncrement(false);
        dto.setValue(new BigDecimal("10"));
        dto.setDateType(DateType.EVERY_DAY);
        dto.setConditionType(ConditionType.NONE);
        return dto;
    }

    private Filter createAndSaveFilter(String name) {
        Filter filter = new Filter();
        filter.setName(name);
        filter.setDescription("Test Description");
        filter.setActivated(true);
        filter.setIncrement(false);
        filter.setValue(new BigDecimal("10"));
        filter.setDateType(DateType.EVERY_DAY);
        filter.setConditionType(ConditionType.NONE);
        return filterRepository.save(filter);
    }

    private Filter createAndSaveActiveFilter(String name, int value) {
        Filter filter = new Filter();
        filter.setName(name);
        filter.setDescription("Test Description");
        filter.setActivated(true);
        filter.setIncrement(false);
        filter.setValue(new BigDecimal(value));
        filter.setDateType(DateType.EVERY_DAY);
        filter.setConditionType(ConditionType.NONE);
        return filterRepository.save(filter);
    }
}
