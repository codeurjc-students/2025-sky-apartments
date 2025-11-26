package com.skyapartments.review.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

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

import feign.FeignException;


@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final UserClient userClient;
    private final ApartmentClient apartmentClient;
    private final BookingClient bookingClient;

    public ReviewService(ReviewRepository reviewRepository, UserClient userClient, ApartmentClient apartmentClient, BookingClient bookingClient) {
        this.reviewRepository = reviewRepository;
        this.userClient = userClient;
        this.apartmentClient = apartmentClient;
        this.bookingClient = bookingClient;
    }

    public ReviewDTO createReview(ReviewRequestDTO request, String userEmail) {
        UserDTO user;
        try {
            user = userClient.getUser(request.getUserId());
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("User not found");
        }
        
        Long userIdFromEmail;
        try {
            userIdFromEmail = userClient.getUserIdByEmail(userEmail);
        } catch (FeignException.NotFound e) {
            throw new SecurityException("User email does not match user ID");
        }
        
        if (userIdFromEmail == null || !userIdFromEmail.equals(request.getUserId())) {
            throw new SecurityException("User email does not match user ID");
        }
        
        try {
            apartmentClient.getApartment(request.getApartmentId());
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Apartment not found");
        }

        List<BookingDTO> bookings;
        try {
            bookings = bookingClient.getActiveBookingsByUserAndApartment(request.getUserId(), request.getApartmentId());
        } catch (FeignException.NotFound e) {
            throw new BusinessValidationException("User has no bookings for this apartment");
        }

        if (bookings == null || bookings.isEmpty()) {
            throw new BusinessValidationException("User has no bookings for this apartment");
        }

        if (reviewRepository.existsByUserIdAndApartmentId(request.getUserId(), request.getApartmentId())) {
            throw new BusinessValidationException("User has already reviewed this apartment");
        } 
        
        Review review = new Review(request);
        review = reviewRepository.save(review);
        return new ReviewDTO(review, user.getName());
    }

    public ReviewDTO updateReview(Long reviewId, UpdateReviewRequestDTO oldReview, String userEmail) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        Long userIdFromEmail = userClient.getUserIdByEmail(userEmail);
        if (userIdFromEmail == null) {
            throw new SecurityException("User email does not match user ID");
        }

        if (!review.getUserId().equals(userIdFromEmail)) {
            throw new SecurityException("You can only update your own reviews");
        }

        review.setComment(oldReview.getComment());
        review.setRating(oldReview.getRating());
        review.setDate(LocalDate.now());
        return new ReviewDTO(reviewRepository.save(review), userClient.getUser(review.getUserId()).getName());
    }

    public void deleteReview(Long reviewId, String userEmail) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new ResourceNotFoundException("Review not found");
        }
        Review review = reviewRepository.findById(reviewId).get();
        Long userIdFromEmail = userClient.getUserIdByEmail(userEmail);
        if (userIdFromEmail == null || !userIdFromEmail.equals(review.getUserId())) {
            throw new SecurityException("User email does not match user ID");
        }
        reviewRepository.deleteById(reviewId);
    }

    public Page<ReviewDTO> getReviewsByApartment(Long apartmentId, Pageable pageable) {
        try {
            apartmentClient.getApartment(apartmentId);
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Apartment not found");
        }
        return reviewRepository.findByApartmentId(apartmentId, pageable)
                .map(review -> {
                    UserDTO user = userClient.getUser(review.getUserId());
                    String userName = (user != null) ? user.getName() : "Unknown";
                    return new ReviewDTO(review, userName);
                });
    }

    public boolean canUserReview(Long userId, Long apartmentId, String userEmail) {
        Long userIdFromEmail;
        try {
            userIdFromEmail = userClient.getUserIdByEmail(userEmail);
        } catch (FeignException.NotFound e) {
            throw new SecurityException("User email does not match user ID");
        }

        if (userIdFromEmail == null || !userIdFromEmail.equals(userId)) {
            throw new SecurityException("User email does not match user ID");
        }

        if (reviewRepository.existsByUserIdAndApartmentId(userId, apartmentId)) {
            return false;
        } 

        List<BookingDTO> bookings;
        try {
            bookings = bookingClient.getActiveBookingsByUserAndApartment(userId, apartmentId);
        } catch (FeignException.NotFound e) {
            return false; // No hay reservas
        }

        if (bookings == null || bookings.isEmpty()) {
            return false;
        }
  
        return true;
    }

    public double getRatingByApartment(Long apartmentId) {
        try {
            apartmentClient.getApartment(apartmentId);
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Apartment not found");
        }
        return reviewRepository.getAverageRatingByApartmentId(apartmentId);
    }
}
