package com.skyapartments.booking.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.skyapartments.booking.dto.ApartmentDTO;
import com.skyapartments.booking.dto.BookingDTO;
import com.skyapartments.booking.dto.BookingRequestDTO;
import com.skyapartments.booking.dto.UserDTO;
import com.skyapartments.booking.exception.BusinessValidationException;
import com.skyapartments.booking.exception.ResourceNotFoundException;
import com.skyapartments.booking.model.Booking;
import com.skyapartments.booking.model.BookingState;
import com.skyapartments.booking.model.Filter;
import com.skyapartments.booking.repository.ApartmentClient;
import com.skyapartments.booking.repository.BookingRepository;
import com.skyapartments.booking.repository.FilterRepository;
import com.skyapartments.booking.repository.UserClient;

import jakarta.transaction.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserClient userClient;
    private final ApartmentClient apartmentClient;
    private final EmailService emailService;
    private final FilterRepository filterRepository;

    public BookingService(BookingRepository bookingRepository, UserClient userClient, ApartmentClient apartmentClient, EmailService emailService, FilterRepository filterRepository) {
        this.bookingRepository = bookingRepository;
        this.userClient = userClient;
        this.apartmentClient = apartmentClient;
        this.emailService = emailService;
        this.filterRepository = filterRepository;
    } 

    public Page<BookingDTO> getBookingsByUserId(Long userId, Pageable pageable, String userEmail) {
        Long userIdFromEmail = userClient.getUserIdByEmail(userEmail);
        if (!userIdFromEmail.equals(userId)) {
            throw new SecurityException("User email does not match user ID");
        }
        return bookingRepository.findByUserIdOrderByStartDateDesc(userId, pageable).map(booking -> new BookingDTO(booking));
    }

    public Page<BookingDTO> getBookingsByApartmentId(Long apartmentId, Pageable pageable) {
        if (apartmentClient.getApartment(apartmentId) == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return bookingRepository.findByApartmentIdOrderByStartDateDesc(apartmentId, pageable).map(booking -> new BookingDTO(booking));
    }

    @Transactional
    public BookingDTO createBooking(BookingRequestDTO request, String userEmail) {
        UserDTO user = userClient.findByEmail(userEmail);
        if (!request.getUserId().equals(user.getId())) {
            throw new SecurityException("User email does not match user ID");
        }
        
        ApartmentDTO apartment = apartmentClient.getApartment(request.getApartmentId());
        if (apartment == null) {
            throw new ResourceNotFoundException("Apartment not found");
        }
        
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessValidationException("End date must be after start date");
        }
        
        if (request.getEndDate().isBefore(LocalDate.now())) {
            throw new BusinessValidationException("End date must be after today");
        }
        
        // Check for overlapping bookings
        boolean overlaps = bookingRepository.findByApartmentIdAndStateNot(
                        request.getApartmentId(), BookingState.CANCELLED)
                .stream()
                .anyMatch(b -> !request.getStartDate().isAfter(b.getEndDate()) && 
                            !request.getEndDate().isBefore(b.getStartDate()));
        if (overlaps) {
            throw new BusinessValidationException("The apartment is not available for the selected dates");
        }

        Booking booking = new Booking();
        booking.setUserId(request.getUserId());
        booking.setApartmentId(request.getApartmentId());
        booking.setStartDate(request.getStartDate());
        booking.setEndDate(request.getEndDate());
        booking.setState(BookingState.CONFIRMED);
        booking.setCost(calculateCost(apartment, request.getStartDate(), request.getEndDate()));
        booking.setGuests(request.getGuests());
        
        BookingDTO savedBooking = new BookingDTO(bookingRepository.save(booking));
        
        emailService.sendBookingConfirmation(user.getEmail(), savedBooking, apartment, user);
        
        return savedBooking;
    }

    @Transactional
    public BookingDTO cancelBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        UserDTO user = userClient.findByEmail(userEmail);
        if (!booking.getUserId().equals(user.getId())) {
            throw new SecurityException("User email does not match booking owner");
        }

        if (booking.getState() == BookingState.CANCELLED) {
            throw new BusinessValidationException("Booking is already cancelled");
        }

        ApartmentDTO apartment = apartmentClient.getApartment(booking.getApartmentId());
        if (apartment == null) {
            throw new ResourceNotFoundException("Apartment not found");
        }

        booking.setState(BookingState.CANCELLED);
        bookingRepository.save(booking);

        emailService.sendBookingCancellation(user.getEmail(),new BookingDTO(booking), apartment, user);

        return new BookingDTO(booking);
    }

    private BigDecimal calculateCost(ApartmentDTO apartment, LocalDate startDate, LocalDate endDate) {
        // Get all active filters
        List<Filter> activeFilters = filterRepository.findByActivatedTrueOrderByIdAsc();
        
        BigDecimal totalCost = BigDecimal.ZERO;
        
        // Calculate price for each night
        LocalDate currentDate = startDate;
        while (currentDate.isBefore(endDate)) {
            BigDecimal nightPrice = calculateNightPrice(
                apartment.getPrice(), 
                activeFilters, 
                currentDate,
                startDate,
                endDate
            );
            totalCost = totalCost.add(nightPrice);
            currentDate = currentDate.plusDays(1);
        }
        
        return totalCost.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateNightPrice(BigDecimal basePrice,
                                      List<Filter> filters,
                                      LocalDate date,
                                      LocalDate checkInDate,
                                      LocalDate checkOutDate) {

        BigDecimal totalAdjustment = BigDecimal.ZERO;

        for (Filter filter : filters) {

            if (!filter.isApplicableOnDate(date)) {
                continue;
            }

            if (!filter.meetsCondition(checkInDate, checkOutDate)) {
                continue;
            }

            BigDecimal adjustment = calculateAdjustment(basePrice, filter);
            totalAdjustment = totalAdjustment.add(adjustment);
        }

        BigDecimal finalPrice = basePrice.add(totalAdjustment);
        return finalPrice.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateAdjustment(BigDecimal basePrice, Filter filter) {

        BigDecimal percentage = filter.getValue().divide(
            BigDecimal.valueOf(100),
            4,
            RoundingMode.HALF_UP
        );

        BigDecimal adjustment = basePrice.multiply(percentage);

        return filter.getIncrement()
                ? adjustment
                : adjustment.negate();
    }

    @Transactional
    public BookingDTO updateBookingDates(Long bookingId, LocalDate newStartDate, LocalDate newEndDate, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        UserDTO user = userClient.findByEmail(userEmail);
        if (!booking.getUserId().equals(user.getId())) {
            throw new SecurityException("User email does not match booking owner");
        }
        if (booking.getState() == BookingState.CANCELLED) {
            throw new BusinessValidationException("Cannot modify a cancelled booking");
        }

        if (booking.getState() == BookingState.COMPLETED) {
            throw new BusinessValidationException("Cannot modify a completed booking");
        }

        if (newEndDate.isBefore(newStartDate)) {
            throw new BusinessValidationException("End date must be after start date");
        }

        ApartmentDTO apartment = apartmentClient.getApartment(booking.getApartmentId());
        if (apartment == null) {
            throw new ResourceNotFoundException("Apartment not found");
        }

        // Check availability for the apartment again before updating
        boolean overlaps = bookingRepository.findByApartmentIdAndStateNot(
                        booking.getApartmentId(), BookingState.CANCELLED)
                .stream()
                .filter(b -> !b.getId().equals(bookingId)) // ignore current booking
                .anyMatch(b -> !newStartDate.isAfter(b.getEndDate()) && !newEndDate.isBefore(b.getStartDate()));

        if (overlaps) {
            throw new BusinessValidationException("The apartment is not available for the selected dates");
        }

        booking.setStartDate(newStartDate);
        booking.setEndDate(newEndDate);
        booking.setCost(calculateCost(apartment, newStartDate, newEndDate));
        bookingRepository.save(booking);

        emailService.sendBookingUpdate(userEmail,new BookingDTO(booking), apartment, user);


        return new BookingDTO(booking);
    }

    public Set<Long> getUnavailableApartments(LocalDate startDate, LocalDate endDate) {
        return bookingRepository.findUnavailableApartments(startDate, endDate);
    }

    @Scheduled(cron = "0 0 0 * * *") //Everyday at midnight
    //@Scheduled(fixedRate = 60000)
    @Transactional
    public void markCompletedBookings() {
        LocalDate today = LocalDate.now();
        List<Booking> pastBookings = bookingRepository.findByEndDateBeforeAndState(today, BookingState.CONFIRMED);
        for (Booking booking : pastBookings) {
            booking.setState(BookingState.COMPLETED);
        }
        bookingRepository.saveAll(pastBookings);
    }

    @Scheduled(cron = "0 0 9 * * *") // Everyday at 9 AM
    //@Scheduled(fixedRate = 60000)
    @Transactional
    public void sendCheckInReminders() {
        LocalDate nextWeek = LocalDate.now().plusDays(7);
        List<Booking> upcomingBookings = bookingRepository.findByStartDateAndState(nextWeek, BookingState.CONFIRMED);
        
        for (Booking booking : upcomingBookings) {
            try {
                
                BookingDTO bookingDTO = new BookingDTO(booking);
                UserDTO userDTO = userClient.getUser(booking.getUserId());
                ApartmentDTO apartmentDTO = apartmentClient.getApartment(booking.getApartmentId());
                
                // Send the reminder email
                emailService.sendCheckInReminder(userDTO.getEmail(), bookingDTO, apartmentDTO, userDTO);
                
                
            } catch (Exception e) {
                System.err.println("Error sending check-in reminder for booking " + booking.getId() + ": " + e.getMessage());
            }
        }
    }

    public List<BookingDTO> getActiveBookingsByUserAndApartment(Long userId, Long apartmentId) {
        List<Booking> bookings = bookingRepository.findByUserIdAndApartmentIdAndState(
                userId, apartmentId, BookingState.COMPLETED);
        return bookings.stream().map(booking -> new BookingDTO(booking)).toList();
    }

    public Boolean hasBookings(Long apartmentId) {
        return bookingRepository.existsByApartmentId(apartmentId);
    }
}
