package com.skyapartments.review.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.skyapartments.review.dto.ApartmentDTO;
import com.skyapartments.review.dto.BookingDTO;
import com.skyapartments.review.dto.ReviewDTO;
import com.skyapartments.review.dto.ReviewRequestDTO;
import com.skyapartments.review.dto.UpdateReviewRequestDTO;
import com.skyapartments.review.dto.UserDTO;
import com.skyapartments.review.exception.BusinessValidationException;
import com.skyapartments.review.exception.ResourceNotFoundException;
import com.skyapartments.review.model.Review;
import com.skyapartments.review.repository.ApartmentClient;
import com.skyapartments.review.repository.BookingClient;
import com.skyapartments.review.repository.ReviewRepository;
import com.skyapartments.review.repository.UserClient;
import com.skyapartments.review.service.ReviewService;

import feign.FeignException;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class ReviewServiceIntegrationTest {
    
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
    private ReviewRepository reviewRepository;

    private ReviewService reviewService;
    private UserClient userClient = mock(UserClient.class);
    private ApartmentClient apartmentClient = mock(ApartmentClient.class);
    private BookingClient bookingClient = mock(BookingClient.class);

    private Review review;

    @BeforeEach
    void setUp() {
        reviewRepository.deleteAll();
        reviewService = new ReviewService(reviewRepository, userClient, apartmentClient, bookingClient);
        
        review = new Review();
        review.setUserId(1L);
        review.setApartmentId(1L);
        review.setRating(5);
        review.setComment("Initial Comment");
    }

    private ReviewRequestDTO buildValidRequest() {
        ReviewRequestDTO request = new ReviewRequestDTO();
        request.setUserId(1L);
        request.setApartmentId(2L);
        request.setRating(5);
        request.setComment("Great stay!");
        return request;
    }

    // ==================== CREATE REVIEW TESTS ====================

    @Test
    public void createReview_ShouldThrowResourceNotFound_WhenUserDoesNotExist() {
        ReviewRequestDTO request = buildValidRequest();
        when(userClient.getUser(request.getUserId())).thenThrow(FeignException.NotFound.class);

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> reviewService.createReview(request, "test@example.com"));

        assertEquals("User not found", exception.getMessage());
        assertEquals(0, reviewRepository.count());
    }

    @Test
    public void createReview_ShouldThrowSecurityException_WhenUserEmailNotFound() {
        ReviewRequestDTO request = buildValidRequest();
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setName("Test User");

        when(userClient.getUser(request.getUserId())).thenReturn(user);
        when(userClient.getUserIdByEmail("test@example.com")).thenThrow(FeignException.NotFound.class);

        SecurityException exception = assertThrows(SecurityException.class,
                () -> reviewService.createReview(request, "test@example.com"));

        assertEquals("User email does not match user ID", exception.getMessage());
        assertEquals(0, reviewRepository.count());
    }

    @Test
    public void createReview_ShouldThrowSecurityException_WhenUserEmailDoesNotMatch() {
        ReviewRequestDTO request = buildValidRequest();
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setName("Test User");

        when(userClient.getUser(request.getUserId())).thenReturn(user);
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(999L);

        SecurityException exception = assertThrows(SecurityException.class,
                () -> reviewService.createReview(request, "test@example.com"));

        assertEquals("User email does not match user ID", exception.getMessage());
        assertEquals(0, reviewRepository.count());
    }

    @Test
    public void createReview_ShouldThrowResourceNotFound_WhenApartmentDoesNotExist() {
        ReviewRequestDTO request = buildValidRequest();
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setName("Test User");

        when(userClient.getUser(request.getUserId())).thenReturn(user);
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(1L);
        when(apartmentClient.getApartment(request.getApartmentId())).thenThrow(FeignException.NotFound.class);

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> reviewService.createReview(request, "test@example.com"));

        assertEquals("Apartment not found", exception.getMessage());
        assertEquals(0, reviewRepository.count());
    }

    @Test
    public void createReview_ShouldThrowBusinessValidationException_WhenNoActiveBookings() {
        ReviewRequestDTO request = buildValidRequest();
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setName("Test User");
        ApartmentDTO apartment = new ApartmentDTO();

        when(userClient.getUser(request.getUserId())).thenReturn(user);
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(1L);
        when(apartmentClient.getApartment(request.getApartmentId())).thenReturn(apartment);
        when(bookingClient.getActiveBookingsByUserAndApartment(request.getUserId(), request.getApartmentId()))
                .thenThrow(FeignException.NotFound.class);

        BusinessValidationException exception = assertThrows(BusinessValidationException.class,
                () -> reviewService.createReview(request, "test@example.com"));

        assertEquals("User has no bookings for this apartment", exception.getMessage());
        assertEquals(0, reviewRepository.count());
    }

    @Test
    public void createReview_ShouldThrowBusinessValidationException_WhenBookingsListIsEmpty() {
        ReviewRequestDTO request = buildValidRequest();
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setName("Test User");
        ApartmentDTO apartment = new ApartmentDTO();

        when(userClient.getUser(request.getUserId())).thenReturn(user);
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(1L);
        when(apartmentClient.getApartment(request.getApartmentId())).thenReturn(apartment);
        when(bookingClient.getActiveBookingsByUserAndApartment(request.getUserId(), request.getApartmentId()))
                .thenReturn(List.of());

        BusinessValidationException exception = assertThrows(BusinessValidationException.class,
                () -> reviewService.createReview(request, "test@example.com"));

        assertEquals("User has no bookings for this apartment", exception.getMessage());
        assertEquals(0, reviewRepository.count());
    }

    @Test
    public void createReview_ShouldThrowBusinessValidationException_WhenReviewAlreadyExists() {
        ReviewRequestDTO request = buildValidRequest();
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setName("Test User");
        ApartmentDTO apartment = new ApartmentDTO();
        
        BookingDTO booking = new BookingDTO();
        booking.setUserId(1L);
        booking.setApartmentId(2L);

        // Crear review existente para el mismo usuario y apartamento
        Review existingReview = new Review();
        existingReview.setUserId(1L);
        existingReview.setApartmentId(2L);
        existingReview.setRating(4);
        existingReview.setComment("Existing review");
        reviewRepository.save(existingReview);

        when(userClient.getUser(request.getUserId())).thenReturn(user);
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(1L);
        when(apartmentClient.getApartment(request.getApartmentId())).thenReturn(apartment);
        when(bookingClient.getActiveBookingsByUserAndApartment(request.getUserId(), request.getApartmentId()))
                .thenReturn(List.of(booking));

        BusinessValidationException exception = assertThrows(BusinessValidationException.class,
                () -> reviewService.createReview(request, "test@example.com"));

        assertEquals("User has already reviewed this apartment", exception.getMessage());
        assertEquals(1, reviewRepository.count());
    }

    @Test
    public void createReview_ShouldReturnReviewDTO_WhenSuccessful() {
        ReviewRequestDTO request = buildValidRequest();
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setName("Test User");
        ApartmentDTO apartment = new ApartmentDTO();
        
        BookingDTO booking = new BookingDTO();
        booking.setUserId(1L);
        booking.setApartmentId(2L);

        when(userClient.getUser(request.getUserId())).thenReturn(user);
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(1L);
        when(apartmentClient.getApartment(request.getApartmentId())).thenReturn(apartment);
        when(bookingClient.getActiveBookingsByUserAndApartment(request.getUserId(), request.getApartmentId()))
                .thenReturn(List.of(booking));

        ReviewDTO result = reviewService.createReview(request, "test@example.com");

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(request.getComment(), result.getComment());
        assertEquals(request.getUserId(), result.getUserId());
        assertEquals(request.getApartmentId(), result.getApartmentId());
        assertEquals("Test User", result.getUserName());

        // Verificar que se guardó en la base de datos
        assertEquals(1, reviewRepository.count());
        Optional<Review> savedReview = reviewRepository.findById(result.getId());
        assertTrue(savedReview.isPresent());
        assertEquals(request.getComment(), savedReview.get().getComment());
        assertEquals(request.getUserId(), savedReview.get().getUserId());
        assertEquals(request.getApartmentId(), savedReview.get().getApartmentId());

        verify(userClient).getUser(request.getUserId());
        verify(userClient).getUserIdByEmail("test@example.com");
        verify(apartmentClient).getApartment(request.getApartmentId());
        verify(bookingClient).getActiveBookingsByUserAndApartment(request.getUserId(), request.getApartmentId());
    }

    // ==================== UPDATE REVIEW TESTS ====================

    @Test
    public void updateReview_ShouldThrowResourceNotFound_WhenReviewDoesNotExist() {
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("New Comment");
        updateRequest.setRating(5);

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> reviewService.updateReview(999L, updateRequest, "test@example.com"));

        assertEquals("Review not found", exception.getMessage());
    }

    @Test
    public void updateReview_ShouldThrowSecurityException_WhenUserIdByEmailReturnsNull() {
        review = reviewRepository.save(review);
        
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("New Comment");
        updateRequest.setRating(5);

        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(null);

        SecurityException exception = assertThrows(SecurityException.class,
                () -> reviewService.updateReview(review.getId(), updateRequest, "test@example.com"));

        assertEquals("User email does not match user ID", exception.getMessage());
        
        // Verificar que el comentario no cambió
        Review unchangedReview = reviewRepository.findById(review.getId()).get();
        assertEquals("Initial Comment", unchangedReview.getComment());
    }

    @Test
    public void updateReview_ShouldThrowSecurityException_WhenUserIsNotOwner() {
        review = reviewRepository.save(review);
        
        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("New Comment");
        updateRequest.setRating(5);
        
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(999L);

        SecurityException exception = assertThrows(SecurityException.class,
                () -> reviewService.updateReview(review.getId(), updateRequest, "test@example.com"));

        assertEquals("You can only update your own reviews", exception.getMessage());
        
        // Verificar que el comentario no cambió
        Review unchangedReview = reviewRepository.findById(review.getId()).get();
        assertEquals("Initial Comment", unchangedReview.getComment());
    }

    @Test
    public void updateReview_ShouldReturnReviewDTO_WhenSuccessful() {
        review = reviewRepository.save(review);

        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("New Comment");
        updateRequest.setRating(5);

        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setName("Test User");
        user.setEmail("test@example.com");

        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(review.getUserId());
        when(userClient.getUser(review.getUserId())).thenReturn(user);

        ReviewDTO result = reviewService.updateReview(review.getId(), updateRequest, "test@example.com");

        assertNotNull(result);
        assertEquals(review.getId(), result.getId());
        assertEquals("New Comment", result.getComment());
        assertEquals(5, result.getRating());
        assertEquals("Test User", result.getUserName());

        // Verificar que se actualizó en la base de datos
        Review updatedReview = reviewRepository.findById(review.getId()).get();
        assertEquals("New Comment", updatedReview.getComment());
        assertEquals(5, updatedReview.getRating());
        assertEquals(LocalDate.now(), updatedReview.getDate());
        assertEquals(review.getUserId(), updatedReview.getUserId());
        assertEquals(review.getApartmentId(), updatedReview.getApartmentId());

        verify(userClient).getUserIdByEmail("test@example.com");
        verify(userClient).getUser(review.getUserId());
    }

    // ==================== DELETE REVIEW TESTS ====================

    @Test
    public void deleteReview_ShouldThrowResourceNotFound_WhenReviewDoesNotExist() {
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> reviewService.deleteReview(999L, "test@example.com"));

        assertEquals("Review not found", exception.getMessage());
    }

    @Test
    public void deleteReview_ShouldThrowSecurityException_WhenUserEmailDoesNotMatch() {
        review = reviewRepository.save(review);
        
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(999L);

        SecurityException exception = assertThrows(SecurityException.class,
                () -> reviewService.deleteReview(review.getId(), "test@example.com"));

        assertEquals("User email does not match user ID", exception.getMessage());
        
        // Verificar que no se eliminó
        assertTrue(reviewRepository.existsById(review.getId()));
        assertEquals(1, reviewRepository.count());
    }

    @Test
    public void deleteReview_ShouldDeleteReview_WhenSuccessful() {
        review = reviewRepository.save(review);
        Long reviewId = review.getId();

        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(1L);

        reviewService.deleteReview(reviewId, "test@example.com");

        // Verificar que se eliminó de la base de datos
        assertFalse(reviewRepository.existsById(reviewId));
        assertEquals(0, reviewRepository.count());
        
        verify(userClient).getUserIdByEmail("test@example.com");
    }

    // ==================== GET REVIEWS BY APARTMENT TESTS ====================

    @Test
    public void getReviewsByApartment_ShouldThrowResourceNotFound_WhenApartmentDoesNotExist() {
        Long apartmentId = 1L;
        Pageable pageable = PageRequest.of(0, 10);

        when(apartmentClient.getApartment(apartmentId)).thenThrow(FeignException.NotFound.class);

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> reviewService.getReviewsByApartment(apartmentId, pageable));

        assertEquals("Apartment not found", exception.getMessage());
    }

    @Test
    public void getReviewsByApartment_ShouldReturnPageOfReviews_WhenApartmentExists() {
        Pageable pageable = PageRequest.of(0, 10);
        review = reviewRepository.save(review);

        when(apartmentClient.getApartment(review.getApartmentId())).thenReturn(new ApartmentDTO());

        Page<ReviewDTO> result = reviewService.getReviewsByApartment(review.getApartmentId(), pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(1, result.getTotalElements());
        assertEquals("Initial Comment", result.getContent().get(0).getComment());
        assertEquals(review.getId(), result.getContent().get(0).getId());

        verify(apartmentClient).getApartment(review.getApartmentId());
    }

    @Test
    public void getReviewsByApartment_ShouldReturnEmptyPage_WhenNoReviewsExist() {
        Long apartmentId = 99L;
        Pageable pageable = PageRequest.of(0, 10);

        when(apartmentClient.getApartment(apartmentId)).thenReturn(new ApartmentDTO());

        Page<ReviewDTO> result = reviewService.getReviewsByApartment(apartmentId, pageable);

        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        assertEquals(0, result.getTotalElements());

        verify(apartmentClient).getApartment(apartmentId);
    }

    @Test
    public void getReviewsByApartment_ShouldReturnOnlyReviewsForSpecificApartment() {
        // Crear reviews para diferentes apartamentos
        Review review1 = new Review();
        review1.setUserId(1L);
        review1.setApartmentId(1L);
        review1.setRating(5);
        review1.setComment("Review for apartment 1");
        reviewRepository.save(review1);

        Review review2 = new Review();
        review2.setUserId(2L);
        review2.setApartmentId(1L);
        review2.setRating(4);
        review2.setComment("Another review for apartment 1");
        reviewRepository.save(review2);

        Review review3 = new Review();
        review3.setUserId(3L);
        review3.setApartmentId(2L);
        review3.setRating(3);
        review3.setComment("Review for apartment 2");
        reviewRepository.save(review3);

        Pageable pageable = PageRequest.of(0, 10);
        when(apartmentClient.getApartment(1L)).thenReturn(new ApartmentDTO());

        Page<ReviewDTO> result = reviewService.getReviewsByApartment(1L, pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream().allMatch(r -> r.getApartmentId().equals(1L)));

        verify(apartmentClient).getApartment(1L);
    }

    @Test
    public void getReviewsByApartment_ShouldRespectPagination() {
        // Crear múltiples reviews para el mismo apartamento
        for (int i = 1; i <= 15; i++) {
            Review r = new Review();
            r.setUserId((long) i);
            r.setApartmentId(1L);
            r.setRating(5);
            r.setComment("Review " + i);
            reviewRepository.save(r);
        }

        Pageable pageable = PageRequest.of(0, 10);
        when(apartmentClient.getApartment(1L)).thenReturn(new ApartmentDTO());

        Page<ReviewDTO> result = reviewService.getReviewsByApartment(1L, pageable);

        assertNotNull(result);
        assertEquals(10, result.getContent().size());
        assertEquals(15, result.getTotalElements());
        assertEquals(2, result.getTotalPages());
        assertTrue(result.hasNext());

        verify(apartmentClient).getApartment(1L);
    }

    @Test
    public void getReviewsByApartment_ShouldReturnSecondPage() {
        // Crear múltiples reviews
        for (int i = 1; i <= 15; i++) {
            Review r = new Review();
            r.setUserId((long) i);
            r.setApartmentId(1L);
            r.setRating(5);
            r.setComment("Review " + i);
            reviewRepository.save(r);
        }

        Pageable pageable = PageRequest.of(1, 10);
        when(apartmentClient.getApartment(1L)).thenReturn(new ApartmentDTO());

        Page<ReviewDTO> result = reviewService.getReviewsByApartment(1L, pageable);

        assertNotNull(result);
        assertEquals(5, result.getContent().size());
        assertEquals(15, result.getTotalElements());
        assertEquals(2, result.getTotalPages());
        assertFalse(result.hasNext());
        assertTrue(result.hasPrevious());

        verify(apartmentClient).getApartment(1L);
    }

    // ==================== CAN USER REVIEW TESTS ====================

    @Test
    public void canUserReview_ShouldReturnTrue_WhenAllConditionsMet() {
        Long userId = 1L;
        Long apartmentId = 2L;
        String userEmail = "test@example.com";
        
        BookingDTO booking = new BookingDTO();
        booking.setUserId(userId);
        booking.setApartmentId(apartmentId);
        
        when(userClient.getUserIdByEmail(userEmail)).thenReturn(userId);
        when(bookingClient.getActiveBookingsByUserAndApartment(userId, apartmentId))
                .thenReturn(List.of(booking));
        
        boolean result = reviewService.canUserReview(userId, apartmentId, userEmail);
        
        assertTrue(result);
        verify(userClient).getUserIdByEmail(userEmail);
        verify(bookingClient).getActiveBookingsByUserAndApartment(userId, apartmentId);
    }

    @Test
    public void canUserReview_ShouldThrowSecurityException_WhenUserEmailDoesNotMatch() {
        Long userId = 1L;
        Long apartmentId = 2L;
        String userEmail = "test@example.com";
        
        when(userClient.getUserIdByEmail(userEmail)).thenReturn(999L);
        
        SecurityException exception = assertThrows(SecurityException.class,
                () -> reviewService.canUserReview(userId, apartmentId, userEmail));
        
        assertEquals("User email does not match user ID", exception.getMessage());
        verify(userClient).getUserIdByEmail(userEmail);
        verifyNoInteractions(bookingClient);
    }

    @Test
    public void canUserReview_ShouldThrowSecurityException_WhenUserEmailNotFound() {
        Long userId = 1L;
        Long apartmentId = 2L;
        String userEmail = "test@example.com";
        
        when(userClient.getUserIdByEmail(userEmail)).thenThrow(FeignException.NotFound.class);
        
        SecurityException exception = assertThrows(SecurityException.class,
                () -> reviewService.canUserReview(userId, apartmentId, userEmail));
        
        assertEquals("User email does not match user ID", exception.getMessage());
        verifyNoInteractions(bookingClient);
    }

    @Test
    public void canUserReview_ShouldReturnFalse_WhenReviewAlreadyExistsInDatabase() {
        Long userId = 1L;
        Long apartmentId = 2L;
        String userEmail = "test@example.com";
        
        // Crear review existente en la base de datos
        Review existingReview = new Review();
        existingReview.setUserId(userId);
        existingReview.setApartmentId(apartmentId);
        existingReview.setRating(5);
        existingReview.setComment("Existing review");
        reviewRepository.save(existingReview);
        
        when(userClient.getUserIdByEmail(userEmail)).thenReturn(userId);
        
        boolean result = reviewService.canUserReview(userId, apartmentId, userEmail);
        
        assertFalse(result);
        verify(userClient).getUserIdByEmail(userEmail);
        verifyNoInteractions(bookingClient);
    }

    @Test
    public void canUserReview_ShouldReturnFalse_WhenNoActiveBookingsExist() {
        Long userId = 1L;
        Long apartmentId = 2L;
        String userEmail = "test@example.com";
        
        when(userClient.getUserIdByEmail(userEmail)).thenReturn(userId);
        when(bookingClient.getActiveBookingsByUserAndApartment(userId, apartmentId))
                .thenThrow(FeignException.NotFound.class);
        
        boolean result = reviewService.canUserReview(userId, apartmentId, userEmail);
        
        assertFalse(result);
        verify(bookingClient).getActiveBookingsByUserAndApartment(userId, apartmentId);
    }

    @Test
    public void canUserReview_ShouldReturnFalse_WhenBookingsListIsEmpty() {
        Long userId = 1L;
        Long apartmentId = 2L;
        String userEmail = "test@example.com";
        
        when(userClient.getUserIdByEmail(userEmail)).thenReturn(userId);
        when(bookingClient.getActiveBookingsByUserAndApartment(userId, apartmentId))
                .thenReturn(List.of());
        
        boolean result = reviewService.canUserReview(userId, apartmentId, userEmail);
        
        assertFalse(result);
    }

    @Test
    public void canUserReview_ShouldReturnFalse_WhenBookingsListIsNull() {
        Long userId = 1L;
        Long apartmentId = 2L;
        String userEmail = "test@example.com";
        
        when(userClient.getUserIdByEmail(userEmail)).thenReturn(userId);
        when(bookingClient.getActiveBookingsByUserAndApartment(userId, apartmentId))
                .thenReturn(null);
        
        boolean result = reviewService.canUserReview(userId, apartmentId, userEmail);
        
        assertFalse(result);
    }

    // ==================== GET RATING BY APARTMENT TESTS ====================

    @Test
    public void getRatingByApartment_ShouldThrowResourceNotFound_WhenApartmentDoesNotExist() {
        Long apartmentId = 1L;

        when(apartmentClient.getApartment(apartmentId)).thenThrow(FeignException.NotFound.class);

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> reviewService.getRatingByApartment(apartmentId));

        assertEquals("Apartment not found", exception.getMessage());
        verify(apartmentClient).getApartment(apartmentId);
    }

    @Test
    public void getRatingByApartment_ShouldReturnAverageRating_WhenReviewsExist() {
        Long apartmentId = 1L;
        
        // Crear varias reviews con diferentes ratings
        Review review1 = new Review();
        review1.setUserId(1L);
        review1.setApartmentId(apartmentId);
        review1.setRating(5);
        review1.setComment("Excellent");
        reviewRepository.save(review1);
        
        Review review2 = new Review();
        review2.setUserId(2L);
        review2.setApartmentId(apartmentId);
        review2.setRating(4);
        review2.setComment("Good");
        reviewRepository.save(review2);
        
        Review review3 = new Review();
        review3.setUserId(3L);
        review3.setApartmentId(apartmentId);
        review3.setRating(3);
        review3.setComment("Average");
        reviewRepository.save(review3);

        when(apartmentClient.getApartment(apartmentId)).thenReturn(new ApartmentDTO());

        double result = reviewService.getRatingByApartment(apartmentId);

        // El promedio de 5, 4, 3 = 4.0
        assertEquals(4.0, result, 0.01);
        verify(apartmentClient).getApartment(apartmentId);
    }

    @Test
    public void getRatingByApartment_ShouldReturnZero_WhenNoReviewsExist() {
        Long apartmentId = 99L;

        when(apartmentClient.getApartment(apartmentId)).thenReturn(new ApartmentDTO());

        double result = reviewService.getRatingByApartment(apartmentId);

        assertEquals(0.0, result, 0.01);
        verify(apartmentClient).getApartment(apartmentId);
    }
}