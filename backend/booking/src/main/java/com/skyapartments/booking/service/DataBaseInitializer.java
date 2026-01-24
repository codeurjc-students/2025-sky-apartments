package com.skyapartments.booking.service;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.skyapartments.booking.model.Booking;
import com.skyapartments.booking.model.BookingState;
import com.skyapartments.booking.model.ConditionType;
import com.skyapartments.booking.model.DateType;
import com.skyapartments.booking.model.Filter;
import com.skyapartments.booking.repository.BookingRepository;
import com.skyapartments.booking.repository.FilterRepository;

import jakarta.annotation.PostConstruct;


@Component
public class DataBaseInitializer {
    
    private final BookingRepository bookingRepository;
    private final FilterRepository filterRepository;

    public DataBaseInitializer(BookingRepository bookingRepository, FilterRepository filterRepository) {
        this.bookingRepository = bookingRepository;
        this.filterRepository = filterRepository;
    }

    @PostConstruct
    public void initializeDatabase() throws Exception {
        bookingRepository.save(new Booking(1L, 1L, LocalDate.of(2025, 1, 10), LocalDate.of(2025, 1, 15), new BigDecimal("500.00"), 2));
        bookingRepository.save(new Booking(2L, 1L, LocalDate.of(2025, 2, 5), LocalDate.of(2025, 2, 12), new BigDecimal("750.00"), 4));
        bookingRepository.save(new Booking(3L, 3L, LocalDate.of(2025, 3, 20), LocalDate.of(2025, 3, 22), new BigDecimal("200.00"), 1));
        Booking b1 = bookingRepository.save(new Booking(1L, 4L, LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 10), new BigDecimal("1200.00"), 3));
        bookingRepository.save(new Booking(1L, 5L, LocalDate.of(2025, 11, 15), LocalDate.of(2025, 11, 18), new BigDecimal("400.00"), 2));

        bookingRepository.save(new Booking(3L, 2L, LocalDate.of(2025, 1, 20), LocalDate.of(2025, 1, 25), new BigDecimal("600.00"), 3));
        bookingRepository.save(new Booking(4L, 6L, LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 7), new BigDecimal("850.00"), 2));
        bookingRepository.save(new Booking(5L, 7L, LocalDate.of(2025, 2, 14), LocalDate.of(2025, 2, 21), new BigDecimal("900.00"), 4));
        bookingRepository.save(new Booking(6L, 8L, LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 5), new BigDecimal("450.00"), 2));
        bookingRepository.save(new Booking(7L, 9L, LocalDate.of(2025, 3, 10), LocalDate.of(2025, 3, 17), new BigDecimal("1100.00"), 3));
        
        bookingRepository.save(new Booking(1L, 10L, LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 20), new BigDecimal("700.00"), 2));
        bookingRepository.save(new Booking(2L, 2L, LocalDate.of(2025, 5, 1), LocalDate.of(2025, 5, 8), new BigDecimal("950.00"), 4));
        bookingRepository.save(new Booking(3L, 4L, LocalDate.of(2025, 5, 10), LocalDate.of(2025, 5, 15), new BigDecimal("650.00"), 3));
        bookingRepository.save(new Booking(4L, 1L, LocalDate.of(2025, 6, 1), LocalDate.of(2025, 6, 10), new BigDecimal("1300.00"), 5));
        bookingRepository.save(new Booking(5L, 3L, LocalDate.of(2025, 6, 15), LocalDate.of(2025, 6, 22), new BigDecimal("1000.00"), 4));
        
        bookingRepository.save(new Booking(6L, 5L, LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 10), new BigDecimal("1400.00"), 5));
        bookingRepository.save(new Booking(7L, 6L, LocalDate.of(2025, 7, 15), LocalDate.of(2025, 7, 22), new BigDecimal("1100.00"), 3));
        bookingRepository.save(new Booking(1L, 7L, LocalDate.of(2025, 8, 1), LocalDate.of(2025, 8, 7), new BigDecimal("900.00"), 2));
        bookingRepository.save(new Booking(2L, 8L, LocalDate.of(2025, 8, 10), LocalDate.of(2025, 8, 20), new BigDecimal("1500.00"), 4));
        bookingRepository.save(new Booking(3L, 9L, LocalDate.of(2025, 8, 25), LocalDate.of(2025, 8, 30), new BigDecimal("750.00"), 2));
        
        bookingRepository.save(new Booking(4L, 10L, LocalDate.of(2025, 9, 1), LocalDate.of(2025, 9, 5), new BigDecimal("550.00"), 2));
        bookingRepository.save(new Booking(5L, 1L, LocalDate.of(2025, 9, 10), LocalDate.of(2025, 9, 17), new BigDecimal("1050.00"), 3));
        bookingRepository.save(new Booking(6L, 2L, LocalDate.of(2025, 9, 20), LocalDate.of(2025, 9, 27), new BigDecimal("950.00"), 3));
        bookingRepository.save(new Booking(7L, 3L, LocalDate.of(2025, 10, 1), LocalDate.of(2025, 10, 8), new BigDecimal("1100.00"), 4));
        bookingRepository.save(new Booking(1L, 4L, LocalDate.of(2025, 10, 12), LocalDate.of(2025, 10, 19), new BigDecimal("1000.00"), 3));
        
        bookingRepository.save(new Booking(2L, 5L, LocalDate.of(2025, 10, 22), LocalDate.of(2025, 10, 29), new BigDecimal("950.00"), 2));
        bookingRepository.save(new Booking(3L, 6L, LocalDate.of(2025, 11, 1), LocalDate.of(2025, 11, 7), new BigDecimal("850.00"), 3));
        bookingRepository.save(new Booking(4L, 7L, LocalDate.of(2025, 11, 10), LocalDate.of(2025, 11, 14), new BigDecimal("600.00"), 2));
        bookingRepository.save(new Booking(5L, 8L, LocalDate.of(2025, 11, 20), LocalDate.of(2025, 11, 25), new BigDecimal("700.00"), 2));
        bookingRepository.save(new Booking(6L, 9L, LocalDate.of(2025, 12, 1), LocalDate.of(2025, 12, 7), new BigDecimal("900.00"), 3));
        
        bookingRepository.save(new Booking(7L, 10L, LocalDate.of(2025, 12, 10), LocalDate.of(2025, 12, 17), new BigDecimal("1100.00"), 4));
        bookingRepository.save(new Booking(1L, 1L, LocalDate.of(2025, 12, 20), LocalDate.of(2025, 12, 27), new BigDecimal("1300.00"), 5));
        bookingRepository.save(new Booking(2L, 3L, LocalDate.of(2025, 5, 20), LocalDate.of(2025, 5, 25), new BigDecimal("650.00"), 2));
        bookingRepository.save(new Booking(3L, 7L, LocalDate.of(2025, 6, 5), LocalDate.of(2025, 6, 10), new BigDecimal("700.00"), 3));
        bookingRepository.save(new Booking(4L, 2L, LocalDate.of(2025, 7, 25), LocalDate.of(2025, 7, 31), new BigDecimal("850.00"), 2));
        b1.setState(BookingState.COMPLETED);
        bookingRepository.save(b1);

        // 1. WEEKEND FILTER (+20%)
        Filter weekendFilter = new Filter();
        weekendFilter.setName("Weekend Premium");
        weekendFilter.setDescription("Price increase for Friday, Saturday and Sunday nights");
        weekendFilter.setActivated(true);
        weekendFilter.setIncrement(true);
        weekendFilter.setValue(new BigDecimal("20.00"));
        weekendFilter.setDateType(DateType.WEEK_DAYS);
        weekendFilter.setWeekDays("5,6,7"); // Friday, Saturday, Sunday
        weekendFilter.setConditionType(ConditionType.NONE);
        filterRepository.save(weekendFilter);
        
        // 2. LAST MINUTE DISCOUNT (-15%)
        Filter lastMinuteFilter = new Filter();
        lastMinuteFilter.setName("Last Minute Deal");
        lastMinuteFilter.setDescription("Discount for bookings made within 48 hours of check-in");
        lastMinuteFilter.setActivated(true);
        lastMinuteFilter.setIncrement(false);
        lastMinuteFilter.setValue(new BigDecimal("15.00"));
        lastMinuteFilter.setDateType(DateType.EVERY_DAY);
        lastMinuteFilter.setConditionType(ConditionType.LAST_MINUTE);
        lastMinuteFilter.setAnticipationHours(48);
        filterRepository.save(lastMinuteFilter);
        
        // 3. LONG STAY DISCOUNT (-10%)
        Filter longStayFilter = new Filter();
        longStayFilter.setName("Long Stay Discount");
        longStayFilter.setDescription("Discount for reservations of 7 nights or more");
        longStayFilter.setActivated(true);
        longStayFilter.setIncrement(false);
        longStayFilter.setValue(new BigDecimal("10.00"));
        longStayFilter.setDateType(DateType.EVERY_DAY);
        longStayFilter.setConditionType(ConditionType.LONG_STAY);
        longStayFilter.setMinDays(7);
        filterRepository.save(longStayFilter);
        
        // 4. SUMMER HIGH SEASON (+30%)
        Filter summerSeasonFilter = new Filter();
        summerSeasonFilter.setName("Summer High Season");
        summerSeasonFilter.setDescription("Price increase during summer vacation period");
        summerSeasonFilter.setActivated(true);
        summerSeasonFilter.setIncrement(true);
        summerSeasonFilter.setValue(new BigDecimal("30.00"));
        summerSeasonFilter.setDateType(DateType.DATE_RANGE);
        summerSeasonFilter.setStartDate(LocalDate.of(2025, 7, 1));
        summerSeasonFilter.setEndDate(LocalDate.of(2025, 8, 31));
        summerSeasonFilter.setConditionType(ConditionType.NONE);
        filterRepository.save(summerSeasonFilter);
        
        // 5. CHRISTMAS & NEW YEAR (+40%)
        Filter christmasFilter = new Filter();
        christmasFilter.setName("Christmas & New Year Premium");
        christmasFilter.setDescription("Special pricing for holiday season");
        christmasFilter.setActivated(true);
        christmasFilter.setIncrement(true);
        christmasFilter.setValue(new BigDecimal("40.00"));
        christmasFilter.setDateType(DateType.DATE_RANGE);
        christmasFilter.setStartDate(LocalDate.of(2025, 12, 20));
        christmasFilter.setEndDate(LocalDate.of(2026, 1, 6));
        christmasFilter.setConditionType(ConditionType.NONE);
        filterRepository.save(christmasFilter);
        
        // 6. EASTER WEEK (+25%)
        Filter easterFilter = new Filter();
        easterFilter.setName("Easter Week Premium");
        easterFilter.setDescription("Price increase during Easter week");
        easterFilter.setActivated(true);
        easterFilter.setIncrement(true);
        easterFilter.setValue(new BigDecimal("25.00"));
        easterFilter.setDateType(DateType.DATE_RANGE);
        easterFilter.setStartDate(LocalDate.of(2025, 4, 13));
        easterFilter.setEndDate(LocalDate.of(2025, 4, 20));
        easterFilter.setConditionType(ConditionType.NONE);
        filterRepository.save(easterFilter);
        
        // 7. MIDWEEK DISCOUNT (-5%)
        Filter midweekFilter = new Filter();
        midweekFilter.setName("Midweek Special");
        midweekFilter.setDescription("Small discount for Monday through Thursday stays");
        midweekFilter.setActivated(false); // Disabled by default
        midweekFilter.setIncrement(false);
        midweekFilter.setValue(new BigDecimal("5.00"));
        midweekFilter.setDateType(DateType.WEEK_DAYS);
        midweekFilter.setWeekDays("1,2,3,4"); // Monday to Thursday
        midweekFilter.setConditionType(ConditionType.NONE);
        filterRepository.save(midweekFilter);
        
        // 8. EARLY BIRD DISCOUNT (-12%)
        Filter earlyBirdFilter = new Filter();
        earlyBirdFilter.setName("Early Bird Discount");
        earlyBirdFilter.setDescription("Discount for bookings made 30+ days in advance");
        earlyBirdFilter.setActivated(false); // Disabled by default
        earlyBirdFilter.setIncrement(false);
        earlyBirdFilter.setValue(new BigDecimal("12.00"));
        earlyBirdFilter.setDateType(DateType.EVERY_DAY);
        earlyBirdFilter.setConditionType(ConditionType.LAST_MINUTE);
        earlyBirdFilter.setAnticipationHours(720); // 30 days = 720 hours
        filterRepository.save(earlyBirdFilter);
        
        // 9. LOW SEASON DISCOUNT (-20%)
        Filter lowSeasonFilter = new Filter();
        lowSeasonFilter.setName("Winter Low Season");
        lowSeasonFilter.setDescription("Discount during low season months");
        lowSeasonFilter.setActivated(false); // Disabled by default
        lowSeasonFilter.setIncrement(false);
        lowSeasonFilter.setValue(new BigDecimal("20.00"));
        lowSeasonFilter.setDateType(DateType.DATE_RANGE);
        lowSeasonFilter.setStartDate(LocalDate.of(2026, 1, 7));
        lowSeasonFilter.setEndDate(LocalDate.of(2026, 3, 31));
        lowSeasonFilter.setConditionType(ConditionType.NONE);
        filterRepository.save(lowSeasonFilter);
        
        // 10. EXTENDED STAY DISCOUNT (-18%)
        Filter extendedStayFilter = new Filter();
        extendedStayFilter.setName("Monthly Stay Discount");
        extendedStayFilter.setDescription("Special discount for stays of 30 days or more");
        extendedStayFilter.setActivated(true);
        extendedStayFilter.setIncrement(false);
        extendedStayFilter.setValue(new BigDecimal("18.00"));
        extendedStayFilter.setDateType(DateType.EVERY_DAY);
        extendedStayFilter.setConditionType(ConditionType.LONG_STAY);
        extendedStayFilter.setMinDays(30);
        filterRepository.save(extendedStayFilter);

    }
}

