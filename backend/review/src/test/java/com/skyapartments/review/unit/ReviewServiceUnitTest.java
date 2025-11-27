package com.skyapartments.review.unit;

import static org.junit.Assert.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
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

public class ReviewServiceUnitTest {
    private ReviewRepository reviewRepository = mock(ReviewRepository.class);
    private UserClient userClient = mock(UserClient.class);
    private ApartmentClient apartmentClient = mock(ApartmentClient.class);
    private BookingClient bookingClient = mock(BookingClient.class);
    private ReviewService reviewService;

    public ReviewServiceUnitTest() {
        this.reviewService = new ReviewService(reviewRepository, userClient, apartmentClient, bookingClient);
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
        verify(userClient).getUser(request.getUserId());
        verifyNoInteractions(apartmentClient, bookingClient, reviewRepository);
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
        verify(userClient).getUser(request.getUserId());
        verify(userClient).getUserIdByEmail("test@example.com");
        verifyNoInteractions(apartmentClient, bookingClient, reviewRepository);
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
        verify(userClient).getUser(request.getUserId());
        verify(userClient).getUserIdByEmail("test@example.com");
        verifyNoInteractions(apartmentClient, bookingClient, reviewRepository);
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
        verify(apartmentClient).getApartment(request.getApartmentId());
        verifyNoInteractions(reviewRepository);
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
        verify(bookingClient).getActiveBookingsByUserAndApartment(request.getUserId(), request.getApartmentId());
        verify(reviewRepository, never()).existsByUserIdAndApartmentId(any(), any());
        verify(reviewRepository, never()).save(any());
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
        verify(reviewRepository, never()).save(any());
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

        when(userClient.getUser(request.getUserId())).thenReturn(user);
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(1L);
        when(apartmentClient.getApartment(request.getApartmentId())).thenReturn(apartment);
        when(bookingClient.getActiveBookingsByUserAndApartment(request.getUserId(), request.getApartmentId()))
                .thenReturn(List.of(booking));
        when(reviewRepository.existsByUserIdAndApartmentId(request.getUserId(), request.getApartmentId()))
                .thenReturn(true);

        BusinessValidationException exception = assertThrows(BusinessValidationException.class,
                () -> reviewService.createReview(request, "test@example.com"));

        assertEquals("User has already reviewed this apartment", exception.getMessage());
        verify(reviewRepository).existsByUserIdAndApartmentId(request.getUserId(), request.getApartmentId());
        verify(reviewRepository, never()).save(any());
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

        Review savedReview = new Review(request);
        savedReview.setId(100L);

        when(userClient.getUser(request.getUserId())).thenReturn(user);
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(1L);
        when(apartmentClient.getApartment(request.getApartmentId())).thenReturn(apartment);
        when(bookingClient.getActiveBookingsByUserAndApartment(request.getUserId(), request.getApartmentId()))
                .thenReturn(List.of(booking));
        when(reviewRepository.existsByUserIdAndApartmentId(request.getUserId(), request.getApartmentId()))
                .thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);

        ReviewDTO result = reviewService.createReview(request, "test@example.com");

        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals(request.getComment(), result.getComment());
        assertEquals("Test User", result.getUserName());

        ArgumentCaptor<Review> reviewCaptor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).save(reviewCaptor.capture());
        Review capturedReview = reviewCaptor.getValue();
        assertEquals(request.getUserId(), capturedReview.getUserId());
        assertEquals(request.getApartmentId(), capturedReview.getApartmentId());
        assertEquals(request.getComment(), capturedReview.getComment());

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
        
        when(reviewRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> reviewService.updateReview(1L, updateRequest, "test@example.com"));

        assertEquals("Review not found", exception.getMessage());
        verify(reviewRepository).findById(1L);
        verifyNoInteractions(userClient);
    }

    @Test
    public void updateReview_ShouldThrowSecurityException_WhenUserIdByEmailReturnsNull() {
        Review review = new Review();
        review.setId(1L);
        review.setUserId(10L);
        review.setComment("Old Comment");
        review.setRating(3);

        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("New Comment");
        updateRequest.setRating(5);

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(null);

        SecurityException exception = assertThrows(SecurityException.class,
                () -> reviewService.updateReview(1L, updateRequest, "test@example.com"));

        assertEquals("User email does not match user ID", exception.getMessage());
        verify(userClient).getUserIdByEmail("test@example.com");
        verify(reviewRepository, never()).save(any());
    }

    @Test
    public void updateReview_ShouldThrowSecurityException_WhenUserIsNotOwner() {
        Review review = new Review();
        review.setId(1L);
        review.setUserId(10L);
        review.setComment("Old Comment");
        review.setRating(3);

        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("New Comment");
        updateRequest.setRating(5);

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(999L);

        SecurityException exception = assertThrows(SecurityException.class,
                () -> reviewService.updateReview(1L, updateRequest, "test@example.com"));

        assertEquals("You can only update your own reviews", exception.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    public void updateReview_ShouldReturnReviewDTO_WhenSuccessful() {
        Review review = new Review();
        review.setId(1L);
        review.setUserId(10L);
        review.setComment("Old Comment");
        review.setRating(3);

        UpdateReviewRequestDTO updateRequest = new UpdateReviewRequestDTO();
        updateRequest.setComment("New Comment");
        updateRequest.setRating(5);

        UserDTO user = new UserDTO();
        user.setId(10L);
        user.setName("Test User");

        Review savedReview = new Review();
        savedReview.setId(1L);
        savedReview.setUserId(10L);
        savedReview.setComment("New Comment");
        savedReview.setRating(5);
        savedReview.setDate(LocalDate.now());

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(10L);
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(userClient.getUser(10L)).thenReturn(user);

        ReviewDTO result = reviewService.updateReview(1L, updateRequest, "test@example.com");
        
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("New Comment", result.getComment());
        assertEquals(5, result.getRating());
        assertEquals("Test User", result.getUserName());

        ArgumentCaptor<Review> reviewCaptor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).save(reviewCaptor.capture());
        Review capturedReview = reviewCaptor.getValue();
        assertEquals("New Comment", capturedReview.getComment());
        assertEquals(5, capturedReview.getRating());
        assertEquals(LocalDate.now(), capturedReview.getDate());
        
        verify(userClient).getUserIdByEmail("test@example.com");
        verify(userClient).getUser(10L);
    }

    // ==================== DELETE REVIEW TESTS ====================

    @Test
    public void deleteReview_ShouldThrowResourceNotFound_WhenReviewDoesNotExist() {
        when(reviewRepository.existsById(1L)).thenReturn(false);

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> reviewService.deleteReview(1L, "test@example.com"));

        assertEquals("Review not found", exception.getMessage());
        verify(reviewRepository).existsById(1L);
        verify(reviewRepository, never()).deleteById(any());
    }

    @Test
    public void deleteReview_ShouldThrowSecurityException_WhenUserEmailDoesNotMatch() {
        Review review = new Review();
        review.setId(1L);
        review.setUserId(10L);
        review.setComment("Some comment");

        when(reviewRepository.existsById(1L)).thenReturn(true);
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(999L);

        SecurityException exception = assertThrows(SecurityException.class,
                () -> reviewService.deleteReview(1L, "test@example.com"));

        assertEquals("User email does not match user ID", exception.getMessage());
        verify(reviewRepository, never()).deleteById(any());
    }

    @Test
    public void deleteReview_ShouldCallDeleteById_WhenSuccessful() {
        Review review = new Review();
        review.setId(1L);
        review.setUserId(10L);
        review.setComment("Some comment");

        when(reviewRepository.existsById(1L)).thenReturn(true);
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(userClient.getUserIdByEmail("test@example.com")).thenReturn(10L);

        reviewService.deleteReview(1L, "test@example.com");

        verify(reviewRepository).deleteById(1L);
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
        verify(apartmentClient).getApartment(apartmentId);
        verifyNoInteractions(reviewRepository);
    }

    @Test
    public void getReviewsByApartment_ShouldReturnPageOfReviews_WhenApartmentExists() {
        Long apartmentId = 1L;
        Pageable pageable = PageRequest.of(0, 10);

        Review review1 = new Review();
        review1.setId(1L);
        review1.setUserId(10L);
        review1.setApartmentId(1L);
        review1.setComment("Great stay!");

        Review review2 = new Review();
        review2.setId(2L);
        review2.setUserId(11L);
        review2.setApartmentId(1L);
        review2.setComment("Nice place");

        Page<Review> reviewPage = new PageImpl<>(List.of(review1, review2), pageable, 2);

        when(apartmentClient.getApartment(apartmentId)).thenReturn(new ApartmentDTO());
        when(reviewRepository.findByApartmentId(apartmentId, pageable)).thenReturn(reviewPage);

        Page<ReviewDTO> result = reviewService.getReviewsByApartment(apartmentId, pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals("Great stay!", result.getContent().get(0).getComment());
        assertEquals("Nice place", result.getContent().get(1).getComment());
        assertEquals(2, result.getTotalElements());

        verify(apartmentClient).getApartment(apartmentId);
        verify(reviewRepository).findByApartmentId(apartmentId, pageable);
    }

    @Test
    public void getReviewsByApartment_ShouldReturnEmptyPage_WhenNoReviewsExist() {
        Long apartmentId = 1L;
        Pageable pageable = PageRequest.of(0, 10);

        Page<Review> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(apartmentClient.getApartment(apartmentId)).thenReturn(new ApartmentDTO());
        when(reviewRepository.findByApartmentId(apartmentId, pageable)).thenReturn(emptyPage);

        Page<ReviewDTO> result = reviewService.getReviewsByApartment(apartmentId, pageable);

        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        assertEquals(0, result.getTotalElements());

        verify(apartmentClient).getApartment(apartmentId);
        verify(reviewRepository).findByApartmentId(apartmentId, pageable);
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
        when(reviewRepository.existsByUserIdAndApartmentId(userId, apartmentId)).thenReturn(false);
        when(bookingClient.getActiveBookingsByUserAndApartment(userId, apartmentId))
                .thenReturn(List.of(booking));
        
        boolean result = reviewService.canUserReview(userId, apartmentId, userEmail);
        
        assertTrue(result);
        verify(userClient).getUserIdByEmail(userEmail);
        verify(reviewRepository).existsByUserIdAndApartmentId(userId, apartmentId);
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
        verifyNoInteractions(bookingClient, reviewRepository);
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
        verifyNoInteractions(bookingClient, reviewRepository);
    }

    @Test
    public void canUserReview_ShouldReturnFalse_WhenReviewAlreadyExists() {
        Long userId = 1L;
        Long apartmentId = 2L;
        String userEmail = "test@example.com";
        
        when(userClient.getUserIdByEmail(userEmail)).thenReturn(userId);
        when(reviewRepository.existsByUserIdAndApartmentId(userId, apartmentId)).thenReturn(true);
        
        boolean result = reviewService.canUserReview(userId, apartmentId, userEmail);
        
        assertFalse(result);
        verify(reviewRepository).existsByUserIdAndApartmentId(userId, apartmentId);
        verifyNoInteractions(bookingClient);
    }

    @Test
    public void canUserReview_ShouldReturnFalse_WhenNoActiveBookingsExist() {
        Long userId = 1L;
        Long apartmentId = 2L;
        String userEmail = "test@example.com";
        
        when(userClient.getUserIdByEmail(userEmail)).thenReturn(userId);
        when(reviewRepository.existsByUserIdAndApartmentId(userId, apartmentId)).thenReturn(false);
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
        when(reviewRepository.existsByUserIdAndApartmentId(userId, apartmentId)).thenReturn(false);
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
        when(reviewRepository.existsByUserIdAndApartmentId(userId, apartmentId)).thenReturn(false);
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
        verifyNoInteractions(reviewRepository);
    }

    @Test
    public void getRatingByApartment_ShouldReturnAverageRating_WhenApartmentExists() {
        Long apartmentId = 1L;
        double expectedRating = 4.5;

        when(apartmentClient.getApartment(apartmentId)).thenReturn(new ApartmentDTO());
        when(reviewRepository.getAverageRatingByApartmentId(apartmentId)).thenReturn(expectedRating);

        double result = reviewService.getRatingByApartment(apartmentId);

        assertEquals(expectedRating, result);
        verify(apartmentClient).getApartment(apartmentId);
        verify(reviewRepository).getAverageRatingByApartmentId(apartmentId);
    }
}