package com.skyapartments.booking.integration;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.skyapartments.booking.dto.ApartmentDTO;
import com.skyapartments.booking.dto.BookingDTO;
import com.skyapartments.booking.dto.BookingRequestDTO;
import com.skyapartments.booking.dto.UserDTO;
import com.skyapartments.booking.exception.BusinessValidationException;
import com.skyapartments.booking.exception.ResourceNotFoundException;
import com.skyapartments.booking.model.Booking;
import com.skyapartments.booking.model.BookingState;
import com.skyapartments.booking.repository.ApartmentClient;
import com.skyapartments.booking.repository.BookingRepository;
import com.skyapartments.booking.repository.UserClient;
import com.skyapartments.booking.service.BookingService;
import com.skyapartments.booking.service.EmailService;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class BookingServiceIntegrationTest {
    @Container
    public static final MySQLContainer<?> mysqlContainer =
            new MySQLContainer<>("mysql:8.0")
                    .withDatabaseName("testdb")
                    .withUsername("testuser")
                    .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // MySQL
        registry.add("spring.datasource.url", mysqlContainer::getJdbcUrl);
        registry.add("spring.datasource.username", mysqlContainer::getUsername);
        registry.add("spring.datasource.password", mysqlContainer::getPassword);
        registry.add("spring.datasource.driver-class-name", mysqlContainer::getDriverClassName);
    }

    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    private UserClient userClient = mock(UserClient.class);
    private ApartmentClient apartmentClient = mock(ApartmentClient.class);
    private EmailService emailService = mock(EmailService.class);

    private Booking booking1;
    private Booking booking2;
    
    @BeforeEach
    void setUp() throws Exception {
        bookingRepository.deleteAll();
        bookingService = new BookingService(bookingRepository, userClient, apartmentClient, emailService);

        booking1 = new Booking(1L, 10L, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), BigDecimal.valueOf(300.0), 2);
        booking2 = new Booking(1L, 20L, LocalDate.now().plusDays(4), LocalDate.now().plusDays(5), BigDecimal.valueOf(200.0), 3);
    }

    @Test
    public void getBookingsByUserId_ShouldReturnBookingDTOList_WhenUserExists() {
        // given
        Long userId = 1L;
        String email = "test@example.com";

        Pageable pageable = PageRequest.of(0, 10);
        bookingRepository.save(booking1);
        when(userClient.getUserIdByEmail(email)).thenReturn(userId);

        // when
        Page<BookingDTO> result = bookingService.getBookingsByUserId(userId, pageable, email);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.getContent().get(0).getApartmentId()).isEqualTo(10L);
        assertThat(result.getContent().get(0).getCost()).isEqualByComparingTo(BigDecimal.valueOf(300.0));
        verify(userClient).getUserIdByEmail(email);
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
        assertThat(ex.getMessage()).contains("User email does not match user ID");
    }

    @Test
    public void getBookingsByApartmentId_ShouldReturnBookingDTOList_WhenApartmentExists() {
        Long apartmentId = 20L;

        bookingRepository.save(booking1);
        bookingRepository.save(booking2);

        Pageable pageable = PageRequest.of(0, 10);

        when(apartmentClient.getApartment(apartmentId)).thenReturn(new ApartmentDTO());

        Page<BookingDTO> result = bookingService.getBookingsByApartmentId(apartmentId, pageable);

        assertThat(result).hasSize(1);
        assertThat(result.getContent().get(0).getApartmentId()).isEqualTo(20L);
        assertThat(result.getContent().get(0).getCost()).isEqualByComparingTo(BigDecimal.valueOf(200.0));

        verify(apartmentClient).getApartment(apartmentId);
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
    }

    @Test
    public void createBooking_ShouldCreateSuccessfully_WhenUserAndApartmentExist() {
        // given
        BookingRequestDTO request = buildValidRequest();
        String email = "test@example.com";
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);
        
        ApartmentDTO apartment = new ApartmentDTO();
        apartment.setId(2L);
        apartment.setPrice(BigDecimal.valueOf(100));

        when(userClient.findByEmail(email)).thenReturn(user);
        when(apartmentClient.getApartment(2L)).thenReturn(apartment);

        // when
        BookingDTO result = bookingService.createBooking(request, email);

        // then
        assertNotNull(result);
        assertEquals(1L, result.getUserId());
        assertEquals(2L, result.getApartmentId());
        assertEquals(BookingState.CONFIRMED.name(), result.getState());
        assertEquals(BigDecimal.valueOf(200), result.getCost()); // 2 days * 100

        verify(userClient).findByEmail(email);
        verify(apartmentClient).getApartment(2L);
        verify(emailService).sendBookingConfirmation(eq(email), any(BookingDTO.class), eq(apartment), eq(user));
    }

    @Test
    public void createBooking_ShouldThrowSecurityException_WhenUserEmailDoesNotMatchId() {
        // given
        BookingRequestDTO request = buildValidRequest();
        String email = "wrong@example.com";
        
        UserDTO user = new UserDTO();
        user.setId(99L);
        user.setEmail(email);

        when(userClient.findByEmail(email)).thenReturn(user);

        // when + then
        SecurityException ex = assertThrows(SecurityException.class, 
                () -> bookingService.createBooking(request, email));

        verify(userClient).findByEmail(email);
        verifyNoInteractions(apartmentClient);
        verifyNoInteractions(emailService);
        assertEquals(ex.getMessage(), "User email does not match user ID");
    }

    @Test
    public void createBooking_ShouldThrowResourceNotFoundException_WhenApartmentDoesNotExist() {
        // given
        BookingRequestDTO request = buildValidRequest();
        String email = "test@example.com";
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);

        when(userClient.findByEmail(email)).thenReturn(user);
        when(apartmentClient.getApartment(2L)).thenReturn(null);

        // when + then
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, 
                () -> bookingService.createBooking(request, email));

        assertThat(ex.getMessage()).contains("Apartment not found");
        verify(userClient).findByEmail(email);
        verify(apartmentClient).getApartment(2L);
        verifyNoInteractions(emailService);
    }

    @Test
    public void createBooking_ShouldThrowBusinessValidationException_WhenEndDateBeforeStartDate() {
        // given
        BookingRequestDTO request = buildValidRequest();
        request.setStartDate(LocalDate.now().plusDays(5));
        request.setEndDate(LocalDate.now().plusDays(2));
        String email = "test@example.com";
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);
        
        ApartmentDTO apartment = new ApartmentDTO();
        apartment.setId(2L);
        apartment.setPrice(BigDecimal.valueOf(100));

        when(userClient.findByEmail(email)).thenReturn(user);
        when(apartmentClient.getApartment(2L)).thenReturn(apartment);

        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.createBooking(request, email)
        );

        assertThat(ex.getMessage()).contains("End date must be after start date");
        verifyNoInteractions(emailService);
    }

    @Test
    public void createBooking_ShouldThrowBusinessValidationException_WhenDatesOverlap() {
        // given
        BookingRequestDTO request = buildValidRequest();
        request.setApartmentId(10L);
        String email = "test@example.com";
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);
        
        ApartmentDTO apartment = new ApartmentDTO();
        apartment.setId(10L);
        apartment.setPrice(BigDecimal.valueOf(100));

        // Save existing booking
        bookingRepository.save(booking1);

        when(userClient.findByEmail(email)).thenReturn(user);
        when(apartmentClient.getApartment(10L)).thenReturn(apartment);

        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.createBooking(request, email)
        );

        assertThat(ex.getMessage()).contains("The apartment is not available for the selected dates");
        verifyNoInteractions(emailService);
    }

    @Test
    public void cancelBooking_ShouldCancelBooking_WhenBookingExistsAndNotCancelled() {
        // given
        String email = "test@example.com";
        booking1 = bookingRepository.save(booking1);
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);
        
        ApartmentDTO apartment = new ApartmentDTO();
        apartment.setId(10L);

        when(userClient.findByEmail(email)).thenReturn(user);
        when(apartmentClient.getApartment(10L)).thenReturn(apartment);

        // when
        BookingDTO result = bookingService.cancelBooking(booking1.getId(), email);

        // then
        assertNotNull(result);
        assertEquals(BookingState.CANCELLED.name(), result.getState());
        verify(userClient).findByEmail(email);
        verify(apartmentClient).getApartment(10L);
        verify(emailService).sendBookingCancellation(eq(email), any(BookingDTO.class), eq(apartment), eq(user));
    }

    @Test
    public void cancelBooking_ShouldThrowResourceNotFoundException_WhenBookingDoesNotExist() {
        // when + then
        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> bookingService.cancelBooking(99L, "test@example.com")
        );

        assertThat(ex.getMessage()).contains("Booking not found");
        verifyNoInteractions(emailService);
    }

    @Test
    public void cancelBooking_ShouldThrowBusinessValidationException_WhenBookingAlreadyCancelled() {
        // given
        String email = "test@example.com";
        booking1.setState(BookingState.CANCELLED);
        booking1 = bookingRepository.save(booking1);
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);

        when(userClient.findByEmail(email)).thenReturn(user);

        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.cancelBooking(booking1.getId(), email)
        );

        assertThat(ex.getMessage()).contains("Booking is already cancelled");
        verify(userClient).findByEmail(email);
        verifyNoInteractions(emailService);
    }

    @Test
    public void cancelBooking_ShouldThrowSecurityException_WhenUserNotOwner() {
        // given
        booking1 = bookingRepository.save(booking1);
        String email = "wrong@example.com";
        
        UserDTO user = new UserDTO();
        user.setId(99L);
        user.setEmail(email);

        when(userClient.findByEmail(email)).thenReturn(user);

        // when + then
        SecurityException ex = assertThrows(SecurityException.class,
                () -> bookingService.cancelBooking(booking1.getId(), email));

        verify(userClient).findByEmail(email);
        assertThat(ex.getMessage()).contains("User email does not match booking owner");
        verifyNoInteractions(emailService);
    }

    @Test
    public void updateBookingDates_ShouldUpdateSuccessfully_WhenValid() {
        // given
        String email = "test@example.com";
        booking1 = bookingRepository.save(booking1);

        LocalDate newStart = LocalDate.now().plusDays(2);
        LocalDate newEnd = LocalDate.now().plusDays(4);
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);
        
        ApartmentDTO apartment = new ApartmentDTO();
        apartment.setId(10L);
        apartment.setPrice(BigDecimal.valueOf(100));

        when(userClient.findByEmail(email)).thenReturn(user);
        when(apartmentClient.getApartment(10L)).thenReturn(apartment);

        // when
        BookingDTO result = bookingService.updateBookingDates(booking1.getId(), newStart, newEnd, email);

        // then
        assertNotNull(result);
        assertEquals(newStart, result.getStartDate());
        assertEquals(newEnd, result.getEndDate());
        assertEquals(BigDecimal.valueOf(200), result.getCost()); // 2 days * 100
        
        verify(userClient).findByEmail(email);
        verify(apartmentClient).getApartment(10L);
        verify(emailService).sendBookingUpdate(eq(email), any(BookingDTO.class), eq(apartment), eq(user));
    }

    @Test
    public void updateBookingDates_ShouldThrowResourceNotFound_WhenBookingDoesNotExist() {
        // when + then
        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> bookingService.updateBookingDates(99L, LocalDate.now(), LocalDate.now().plusDays(1), "test@example.com")
        );

        assertThat(ex.getMessage()).contains("Booking not found");
        verifyNoInteractions(emailService);
    }

    @Test
    public void updateBookingDates_ShouldThrowBusinessValidation_WhenBookingCancelled() {
        // given
        String email = "test@example.com";
        booking1.setState(BookingState.CANCELLED);
        booking1 = bookingRepository.save(booking1);
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);

        when(userClient.findByEmail(email)).thenReturn(user);

        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.updateBookingDates(booking1.getId(), LocalDate.now(), LocalDate.now().plusDays(1), email)
        );

        assertThat(ex.getMessage()).contains("Cannot modify a cancelled booking");
        verify(userClient).findByEmail(email);
        verifyNoInteractions(emailService);
    }

    @Test
    public void updateBookingDates_ShouldThrowBusinessValidation_WhenBookingCompleted() {
        // given
        String email = "test@example.com";
        booking1.setState(BookingState.COMPLETED);
        booking1 = bookingRepository.save(booking1);
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);

        when(userClient.findByEmail(email)).thenReturn(user);

        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.updateBookingDates(booking1.getId(), LocalDate.now(), LocalDate.now().plusDays(1), email)
        );

        assertThat(ex.getMessage()).contains("Cannot modify a completed booking");
        verify(userClient).findByEmail(email);
        verifyNoInteractions(emailService);
    }

    @Test
    public void updateBookingDates_ShouldThrowBusinessValidation_WhenEndBeforeStart() {
        // given
        String email = "test@example.com";
        booking1 = bookingRepository.save(booking1);
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);

        when(userClient.findByEmail(email)).thenReturn(user);

        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = LocalDate.now().plusDays(2);

        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.updateBookingDates(booking1.getId(), start, end, email)
        );

        assertThat(ex.getMessage()).contains("End date must be after start date");
        verify(userClient).findByEmail(email);
        verifyNoInteractions(emailService);
    }

    @Test
    public void updateBookingDates_ShouldThrowBusinessValidation_WhenOverlapsWithAnotherBooking() {
        // given
        String email = "test@example.com";
        booking1.setApartmentId(1L);
        booking2.setApartmentId(1L);
        booking1 = bookingRepository.save(booking1);
        booking2 = bookingRepository.save(booking2);
        
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail(email);
        
        ApartmentDTO apartment = new ApartmentDTO();
        apartment.setId(1L);

        when(userClient.findByEmail(email)).thenReturn(user);
        when(apartmentClient.getApartment(1L)).thenReturn(apartment);

        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.updateBookingDates(booking2.getId(), 
                        booking1.getEndDate().minusDays(1), 
                        booking1.getEndDate().plusDays(1), 
                        email)
        );

        assertThat(ex.getMessage()).contains("The apartment is not available for the selected dates");
        verify(userClient).findByEmail(email);
        verify(apartmentClient).getApartment(1L);
        verifyNoInteractions(emailService);
    }
    
    @Test
    public void updateBookingDates_ShouldThrowSecurityException_WhenUserEmailDoesNotMatchId() {
        // given
        booking1 = bookingRepository.save(booking1);
        String email = "wrong@example.com";
        
        UserDTO user = new UserDTO();
        user.setId(99L);
        user.setEmail(email);

        when(userClient.findByEmail(email)).thenReturn(user);

        // when + then
        SecurityException ex = assertThrows(SecurityException.class, 
                () -> bookingService.updateBookingDates(booking1.getId(), 
                        LocalDate.now().plusDays(1), 
                        LocalDate.now().plusDays(3), 
                        email));

        verify(userClient).findByEmail(email);
        verifyNoInteractions(apartmentClient);
        verifyNoInteractions(emailService);
        assertEquals(ex.getMessage(), "User email does not match booking owner");
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