package com.skyapartments.booking.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.skyapartments.booking.dto.ApartmentDTO;
import com.skyapartments.booking.dto.BookingDTO;
import com.skyapartments.booking.dto.BookingRequestDTO;
import com.skyapartments.booking.exception.BusinessValidationException;
import com.skyapartments.booking.exception.ResourceNotFoundException;
import com.skyapartments.booking.model.Booking;
import com.skyapartments.booking.model.BookingState;
import com.skyapartments.booking.repository.ApartmentClient;
import com.skyapartments.booking.repository.BookingRepository;
import com.skyapartments.booking.repository.UserClient;
import com.skyapartments.booking.service.BookingService;

public class BookingServiceUnitTest {

    private BookingService bookingService;
    private BookingRepository bookingRepository = mock(BookingRepository.class);
    private UserClient userClient = mock(UserClient.class);
    private ApartmentClient apartmentClient = mock(ApartmentClient.class);

    public BookingServiceUnitTest () {
        bookingService = new BookingService(bookingRepository, userClient, apartmentClient);
    }

    @Test
    public void getBookingsByUserId_ShouldReturnBookingDTOList_WhenUserExists() {
        // given
        Long userId = 1L;
        String email = "test@example.com";

        Booking booking1 = new Booking();
        booking1.setId(101L);
        booking1.setUserId(userId);
        booking1.setApartmentId(10L);
        booking1.setStartDate(LocalDate.now().plusDays(1));
        booking1.setEndDate(LocalDate.now().plusDays(3));
        booking1.setCost(BigDecimal.valueOf(300));
        booking1.setState(BookingState.CONFIRMED);

        Booking booking2 = new Booking();
        booking2.setId(102L);
        booking2.setUserId(userId);
        booking2.setApartmentId(20L);
        booking2.setStartDate(LocalDate.now().plusDays(4));
        booking2.setEndDate(LocalDate.now().plusDays(5));
        booking2.setCost(BigDecimal.valueOf(200));
        booking2.setState(BookingState.CONFIRMED);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Booking> bookingPage = new PageImpl<>(List.of(booking1, booking2), pageable, 2);

        when(userClient.getUserIdByEmail(email)).thenReturn(userId);
        when(bookingRepository.findByUserIdOrderByStartDateDesc(userId, pageable))
                .thenReturn(bookingPage);

        // when
        Page<BookingDTO> result = bookingService.getBookingsByUserId(userId, pageable, email);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.getContent().get(0).getId()).isEqualTo(101L);
        assertThat(result.getContent().get(1).getId()).isEqualTo(102L);

        verify(userClient).getUserIdByEmail(email);
        verify(bookingRepository).findByUserIdOrderByStartDateDesc(userId, pageable);
    }

    @Test
    public void getBookingsByUserId_ShouldThrowSecurityException_WhenEmailDoesNotMatchUserId() {
        Long userId = 1L;
        String email = "wrong@example.com";

        when(userClient.getUserIdByEmail(email)).thenReturn(99L);

        Pageable pageable = PageRequest.of(0, 10);

        SecurityException ex = assertThrows(SecurityException.class,
                () -> bookingService.getBookingsByUserId(userId, pageable, email));

        verify(userClient).getUserIdByEmail(email);
        verifyNoInteractions(bookingRepository);
        assertThat(ex.getMessage()).contains("User email does not match user ID");
    }

    @Test
    public void getBookingsByApartmentId_ShouldReturnBookingDTOList_WhenApartmentExists() {
        Long apartmentId = 1L;

        Booking booking1 = new Booking();
        booking1.setId(101L);
        booking1.setApartmentId(apartmentId);
        booking1.setUserId(10L);
        booking1.setState(BookingState.CONFIRMED);
        Booking booking2 = new Booking();
        booking2.setId(102L);
        booking2.setApartmentId(apartmentId);
        booking2.setUserId(11L);
        booking2.setState(BookingState.CONFIRMED);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Booking> bookingPage = new PageImpl<>(List.of(booking1, booking2), pageable, 2);

        when(apartmentClient.getApartment(apartmentId)).thenReturn(new ApartmentDTO());
        when(bookingRepository.findByApartmentIdOrderByStartDateDesc(apartmentId, pageable))
                .thenReturn(bookingPage);

        Page<BookingDTO> result = bookingService.getBookingsByApartmentId(apartmentId, pageable);

        assertThat(result).hasSize(2);
        assertThat(result.getContent().get(0).getId()).isEqualTo(101L);
        assertThat(result.getContent().get(1).getId()).isEqualTo(102L);

        verify(apartmentClient).getApartment(apartmentId);
        verify(bookingRepository).findByApartmentIdOrderByStartDateDesc(apartmentId, pageable);
    }

    @Test
    public void getBookingsByApartmentId_ShouldThrowResourceNotFoundException_WhenApartmentDoesNotExist() {
        Long apartmentId = 99L;
        Pageable pageable = PageRequest.of(0, 10);

        when(apartmentClient.getApartment(apartmentId)).thenReturn(null);

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> bookingService.getBookingsByApartmentId(apartmentId, pageable)
        );

        assertThat(ex.getMessage()).contains("User not found");
        verify(apartmentClient).getApartment(apartmentId);
        verifyNoInteractions(bookingRepository);
    }

    @Test
    public void createBooking_ShouldCreateSuccessfully_WhenUserAndApartmentExist() {
        BookingRequestDTO request = buildValidRequest();

        String email = "test@example.com";
        ApartmentDTO apartment = new ApartmentDTO();
        apartment.setPrice(BigDecimal.valueOf(100));

        when(userClient.getUserIdByEmail(email)).thenReturn(1L);
        when(apartmentClient.getApartment(2L)).thenReturn(apartment);

        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> {
            Booking b = i.getArgument(0);
            b.setId(100L);
            return b;
        });

        BookingDTO result = bookingService.createBooking(request, email);

        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals(1L, result.getUserId());
        assertEquals(2L, result.getApartmentId());
        assertEquals(BookingState.CONFIRMED.name(), result.getState());
        assertEquals(BigDecimal.valueOf(200), result.getCost());

        verify(userClient).getUserIdByEmail(email);
        verify(apartmentClient).getApartment(2L);
        verify(bookingRepository).save(any(Booking.class));
    }



    @Test
    public void createBooking_ShouldThrowSecurityException_WhenUserEmailDoesNotMatchId() {
        BookingRequestDTO request = buildValidRequest();
        String email = "wrong@example.com";

        when(userClient.getUserIdByEmail(email)).thenReturn(99L);

        assertThrows(SecurityException.class, () -> bookingService.createBooking(request, email));

        verifyNoInteractions(apartmentClient);
        verify(bookingRepository, never()).save(any());
    }


    @Test
    public void createBooking_ShouldThrowResourceNotFoundException_WhenApartmentDoesNotExist() {
        BookingRequestDTO request = buildValidRequest();
        String email = "test@example.com";

        when(userClient.getUserIdByEmail(email)).thenReturn(1L);
        when(apartmentClient.getApartment(2L)).thenReturn(null);

        assertThrows(ResourceNotFoundException.class, () -> bookingService.createBooking(request, email));

        verify(userClient).getUserIdByEmail(email);

        verify(apartmentClient).getApartment(2L);
        verify(bookingRepository, never()).save(any());
    }

    @Test
    public void cancelBooking_ShouldCancelBooking_WhenBookingExistsAndNotCancelled() {
        // given
        Booking booking = new Booking();
        booking.setId(100L);
        booking.setState(BookingState.CONFIRMED);
        booking.setUserId(1L);
        booking.setApartmentId(2L);
        booking.setStartDate(LocalDate.now().plusDays(1));
        booking.setEndDate(LocalDate.now().plusDays(2));
        booking.setCost(BigDecimal.valueOf(200));
        booking.setGuests(2);
        booking.setCreatedDate(LocalDateTime.now());

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));
        when(userClient.getUserIdByEmail(null)).thenReturn(1L);
        // when
        BookingDTO result = bookingService.cancelBooking(100L, null);

        // then
        assertNotNull(result);
        assertEquals(BookingState.CANCELLED.name(), result.getState());
        verify(bookingRepository, times(1)).findById(100L);
        verify(bookingRepository, times(1)).save(booking);
    }

    @Test
    public void cancelBooking_ShouldThrowResourceNotFoundException_WhenBookingDoesNotExist() {
        // given
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());

        // when + then
        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> bookingService.cancelBooking(99L, null)
        );

        assertThat(ex.getMessage()).contains("Booking not found");
        verify(bookingRepository, times(1)).findById(99L);
        verify(bookingRepository, never()).save(any());
    }

    @Test
    public void cancelBooking_ShouldThrowSecurityException_WhenUserNotOwner() {
        Booking booking = new Booking();
        booking.setId(100L);
        booking.setState(BookingState.CONFIRMED);
        booking.setUserId(1L);
        booking.setApartmentId(2L);
        booking.setStartDate(LocalDate.now().plusDays(1));
        booking.setEndDate(LocalDate.now().plusDays(2));
        booking.setCost(BigDecimal.valueOf(200));
        booking.setGuests(2);
        booking.setCreatedDate(LocalDateTime.now());

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        String email = "wrong@example.com";
        when(userClient.getUserIdByEmail(email)).thenReturn(99L);

        SecurityException ex = assertThrows(SecurityException.class,
                () -> bookingService.cancelBooking(100L, email));

        verify(userClient).getUserIdByEmail(email);
        verify(bookingRepository, times(1)).findById(100L);
        assertThat(ex.getMessage()).contains("User email does not match booking owner");
    }

    @Test
    public void cancelBooking_ShouldThrowBusinessValidationException_WhenBookingAlreadyCancelled() {
        // given
        Booking booking = new Booking();
        booking.setId(101L);
        booking.setState(BookingState.CANCELLED);
        booking.setUserId(1L);

        when(bookingRepository.findById(101L)).thenReturn(Optional.of(booking));
        when(userClient.getUserIdByEmail(null)).thenReturn(1L);
        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.cancelBooking(101L, null)
        );

        assertThat(ex.getMessage()).contains("Booking is already cancelled");
        verify(bookingRepository, times(1)).findById(101L);
        verify(bookingRepository, never()).save(any());
    }

    @Test
    public void updateBookingDates_ShouldUpdateSuccessfully_WhenValid() {
        // given
        Long bookingId = 1L;

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setState(BookingState.CONFIRMED);
        booking.setApartmentId(1L);
        booking.setUserId(1L);

        LocalDate newStart = LocalDate.now().plusDays(2);
        LocalDate newEnd = LocalDate.now().plusDays(4);

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(bookingRepository.findByApartmentIdAndStateNot(booking.getApartmentId(), BookingState.CANCELLED))
                .thenReturn(List.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));
        when(userClient.getUserIdByEmail(null)).thenReturn(1L);
        ApartmentDTO apartment = new ApartmentDTO();
        apartment.setPrice(BigDecimal.valueOf(100));

        when(apartmentClient.getApartment(booking.getApartmentId())).thenReturn(apartment);

        // when
        BookingDTO result = bookingService.updateBookingDates(bookingId, newStart, newEnd, null);

        // then
        assertNotNull(result);
        assertEquals(newStart, result.getStartDate());
        assertEquals(newEnd, result.getEndDate());
        verify(bookingRepository, times(1)).save(booking);
    }

    @Test
    public void updateBookingDates_ShouldThrowResourceNotFound_WhenBookingDoesNotExist() {
        // given
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());
        when(userClient.getUserIdByEmail(null)).thenReturn(1L);
        // when + then
        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> bookingService.updateBookingDates(99L, LocalDate.now(), LocalDate.now().plusDays(1), null)
        );

        assertThat(ex.getMessage()).contains("Booking not found");
    }

    @Test
    public void updateBookingDates_ShouldThrowBusinessValidation_WhenBookingCancelled() {
        // given
        Booking booking = new Booking();
        booking.setId(2L);
        booking.setState(BookingState.CANCELLED);
        booking.setUserId(1L);

        when(bookingRepository.findById(2L)).thenReturn(Optional.of(booking));
        when(userClient.getUserIdByEmail(null)).thenReturn(1L);
        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.updateBookingDates(2L, LocalDate.now(), LocalDate.now().plusDays(1), null)
        );

        assertThat(ex.getMessage()).contains("Cannot modify a cancelled booking");
    }

    @Test
    public void updateBookingDates_ShouldThrowBusinessValidation_WhenEndBeforeStart() {
        // given
        Booking booking = new Booking();
        booking.setId(3L);
        booking.setState(BookingState.CONFIRMED);
        booking.setApartmentId(1L);
        booking.setUserId(1L);
        booking.setStartDate(LocalDate.now().plusDays(1)); 
        booking.setEndDate(LocalDate.now().plusDays(4));   

        when(bookingRepository.findById(3L)).thenReturn(Optional.of(booking));
        when(userClient.getUserIdByEmail(null)).thenReturn(1L);

        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = LocalDate.now().plusDays(2);
        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.updateBookingDates(3L, start, end, null)
        );

        assertThat(ex.getMessage()).contains("End date must be after start date");
    }

    @Test
    public void updateBookingDates_ShouldThrowBusinessValidation_WhenOverlapsWithAnotherBooking() {
        // given
        Booking booking1 = new Booking();
        booking1.setId(1L);
        booking1.setState(BookingState.CONFIRMED);
        booking1.setApartmentId(1L);
        booking1.setUserId(1L);
        booking1.setStartDate(LocalDate.now().plusDays(1));
        booking1.setEndDate(LocalDate.now().plusDays(2));

        Booking booking2 = new Booking();
        booking2.setId(2L);
        booking2.setState(BookingState.CONFIRMED);
        booking2.setApartmentId(1L);
        booking2.setStartDate(LocalDate.now().plusDays(2));
        booking2.setEndDate(LocalDate.now().plusDays(4));

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking1));
        when(bookingRepository.findByApartmentIdAndStateNot(1L, BookingState.CANCELLED))
                .thenReturn(List.of(booking2));
        when(userClient.getUserIdByEmail(null)).thenReturn(1L);
        when(apartmentClient.getApartment(1L)).thenReturn(new ApartmentDTO());
        LocalDate newStart = LocalDate.now().plusDays(3);
        LocalDate newEnd = LocalDate.now().plusDays(5);

        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.updateBookingDates(1L, newStart, newEnd, null)
        );

        assertThat(ex.getMessage()).contains("The apartment is not available for the selected dates");
    }

    @Test
    public void updateBookingDates_ShouldThrowSecurityException_WhenUserEmailDoesNotMatchId() {
        // given
        Long bookingId = 1L;

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setState(BookingState.CONFIRMED);
        booking.setApartmentId(1L);
        booking.setUserId(1L);

        LocalDate newStart = LocalDate.now().plusDays(2);
        LocalDate newEnd = LocalDate.now().plusDays(4);

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(bookingRepository.findByApartmentIdAndStateNot(booking.getApartmentId(), BookingState.CANCELLED))
                .thenReturn(List.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));
        when(userClient.getUserIdByEmail(null)).thenReturn(99L);
        // when
        SecurityException ex = assertThrows(SecurityException.class, () -> bookingService.updateBookingDates(bookingId, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), null));

        verifyNoInteractions(apartmentClient);
        assertEquals(ex.getMessage(), "User email does not match booking owner");
        verify(bookingRepository, never()).save(any());
        
    }

    private BookingRequestDTO buildValidRequest() {
        BookingRequestDTO dto = new BookingRequestDTO();
        dto.setUserId(1L);
        dto.setApartmentId(2L);
        dto.setStartDate(LocalDate.now().plusDays(1));
        dto.setEndDate(LocalDate.now().plusDays(3));
        dto.setGuests(2);
        return dto;
    }
}
