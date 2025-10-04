package com.skyapartments.booking.integration;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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


    private Booking booking1;
    private Booking booking2;
    @BeforeEach
    void setUp() throws Exception {
        bookingRepository.deleteAll();
        bookingService = new BookingService(bookingRepository, userClient, apartmentClient);

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
        BookingRequestDTO request = buildValidRequest();

        String email = "test@example.com";
        ApartmentDTO apartment = new ApartmentDTO();
        apartment.setPrice(BigDecimal.valueOf(100));

        when(userClient.getUserIdByEmail(email)).thenReturn(1L);
        when(apartmentClient.getApartment(2L)).thenReturn(apartment);

        BookingDTO result = bookingService.createBooking(request, email);

        assertNotNull(result);
        assertEquals(1L, result.getUserId());
        assertEquals(2L, result.getApartmentId());
        assertEquals(BookingState.CONFIRMED.name(), result.getState());
        assertEquals(BigDecimal.valueOf(200), result.getCost()); // 2 days * 100

        verify(userClient).getUserIdByEmail(email);
        verify(apartmentClient).getApartment(2L);
    }

    @Test
    public void createBooking_ShouldThrowSecurityException_WhenUserEmailDoesNotMatchId() {
        BookingRequestDTO request = buildValidRequest();
        String email = "wrong@example.com";

        when(userClient.getUserIdByEmail(email)).thenReturn(99L);

        SecurityException ex = assertThrows(SecurityException.class, () -> bookingService.createBooking(request, email));

        verifyNoInteractions(apartmentClient);
        assertEquals(ex.getMessage(), "User email does not match user ID");
    }

    @Test
    public void createBooking_ShouldThrowResourceNotFoundException_WhenApartmentDoesNotExist() {
        BookingRequestDTO request = buildValidRequest();
        String email = "test@example.com";

        when(userClient.getUserIdByEmail(email)).thenReturn(1L);
        when(apartmentClient.getApartment(2L)).thenReturn(null);

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> bookingService.createBooking(request, email));

        assertThat(ex.getMessage()).contains("Apartment not found");
        verify(userClient).getUserIdByEmail(email);
        verify(apartmentClient).getApartment(2L);
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

    @Test
    public void cancelBooking_ShouldCancelBooking_WhenBookingExistsAndNotCancelled() {
        // given
        booking1 = bookingRepository.save(booking1);

        when(userClient.getUserIdByEmail(null)).thenReturn(booking1.getUserId());
        // when
        BookingDTO result = bookingService.cancelBooking(booking1.getId(), null);

        // then
        assertNotNull(result);
        assertEquals(BookingState.CANCELLED.name(), result.getState());
    }

    @Test
    public void cancelBooking_ShouldThrowResourceNotFoundException_WhenBookingDoesNotExist() {

        // when + then
        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> bookingService.cancelBooking(99L, null)
        );

        assertThat(ex.getMessage()).contains("Booking not found");

    }

    @Test
    public void cancelBooking_ShouldThrowBusinessValidationException_WhenBookingAlreadyCancelled() {
        booking1.setState(BookingState.CANCELLED);
        booking1 = bookingRepository.save(booking1);
    
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(1L);
        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.cancelBooking(booking1.getId(), "test@example.com")
        );

        assertThat(ex.getMessage()).contains("Booking is already cancelled");
    }

    @Test
    public void cancelBooking_ShouldThrowSecurityException_WhenUserNotOwner() {
        booking1 = bookingRepository.save(booking1);

        String email = "wrong@example.com";
        when(userClient.getUserIdByEmail(email)).thenReturn(99L);

        SecurityException ex = assertThrows(SecurityException.class,
                () -> bookingService.cancelBooking(booking1.getId(), email));

        verify(userClient).getUserIdByEmail(email);
        assertThat(ex.getMessage()).contains("User email does not match booking owner");
    }

    @Test
    public void updateBookingDates_ShouldUpdateSuccessfully_WhenValid() {
        booking1 = bookingRepository.save(booking1);

        LocalDate newStart = LocalDate.now().plusDays(2);
        LocalDate newEnd = LocalDate.now().plusDays(4);


        when(userClient.getUserIdByEmail(null)).thenReturn(booking1.getUserId());
        when(apartmentClient.getApartment(booking1.getApartmentId())).thenReturn(new ApartmentDTO(){{
            setPrice(BigDecimal.valueOf(100));
        }});
        // when
        BookingDTO result = bookingService.updateBookingDates(booking1.getId(), newStart, newEnd, null);

        // then
        assertNotNull(result);
        assertEquals(newStart, result.getStartDate());
        assertEquals(newEnd, result.getEndDate());

        assertEquals(BigDecimal.valueOf(200), result.getCost()); // 2 days * 100
    }

    @Test
    public void updateBookingDates_ShouldThrowResourceNotFound_WhenBookingDoesNotExist() {
        // given
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
        booking1.setState(BookingState.CANCELLED);
        booking1 = bookingRepository.save(booking1);

        when(userClient.getUserIdByEmail(null)).thenReturn(booking1.getUserId());
        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.updateBookingDates(booking1.getId(), LocalDate.now(), LocalDate.now().plusDays(1), null)
        );

        assertThat(ex.getMessage()).contains("Cannot modify a cancelled booking");
    }

    @Test
    public void updateBookingDates_ShouldThrowBusinessValidation_WhenEndBeforeStart() {
        // given
        booking1 = bookingRepository.save(booking1);

        when(userClient.getUserIdByEmail(null)).thenReturn(booking1.getUserId());

        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = LocalDate.now().plusDays(2);

        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.updateBookingDates(booking1.getId(), start, end, null)
        );

        assertThat(ex.getMessage()).contains("End date must be after start date");
    }

    @Test
    public void updateBookingDates_ShouldThrowBusinessValidation_WhenOverlapsWithAnotherBooking() {
        // given
        booking1.setApartmentId(1L);
        booking2.setApartmentId(1L);
        booking1 = bookingRepository.save(booking1);
        booking2 = bookingRepository.save(booking2);

        when(userClient.getUserIdByEmail(null)).thenReturn(1L);
        when(apartmentClient.getApartment(booking1.getApartmentId())).thenReturn(new ApartmentDTO());
        // when + then
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> bookingService.updateBookingDates(booking2.getId(), booking1.getEndDate().minusDays(1), booking1.getEndDate().plusDays(1), null)
        );

        assertThat(ex.getMessage()).contains("The apartment is not available for the selected dates");
    }
    
    @Test
    public void updateBookingDates_ShouldThrowSecurityException_WhenUserEmailDoesNotMatchId() {
        booking1 = bookingRepository.save(booking1);
        String email = "wrong@example.com";

        when(userClient.getUserIdByEmail(email)).thenReturn(99L);

        SecurityException ex = assertThrows(SecurityException.class, () -> bookingService.updateBookingDates(booking1.getId(), LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), email));

        verifyNoInteractions(apartmentClient);
        assertEquals(ex.getMessage(), "User email does not match booking owner");
    }

}
