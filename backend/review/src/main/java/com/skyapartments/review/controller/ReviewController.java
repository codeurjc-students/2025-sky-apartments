package com.skyapartments.review.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.skyapartments.review.dto.ReviewDTO;
import com.skyapartments.review.dto.ReviewRequestDTO;
import com.skyapartments.review.dto.UpdateReviewRequestDTO;
import com.skyapartments.review.model.Review;
import com.skyapartments.review.service.ReviewService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

   
    @PostMapping
    public ResponseEntity<ReviewDTO> createReview(@Valid @RequestBody ReviewRequestDTO review, HttpServletRequest request) {
        String userEmail = request.getUserPrincipal().getName();
        ReviewDTO newReview = reviewService.createReview(review, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(newReview);
    }

    
    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewDTO> updateReview(@PathVariable Long reviewId, @Valid @RequestBody UpdateReviewRequestDTO review, HttpServletRequest request
    ) {
        String userEmail = request.getUserPrincipal().getName();
        ReviewDTO updatedReview = reviewService.updateReview(reviewId, review, userEmail);
        return ResponseEntity.ok(updatedReview);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId, HttpServletRequest request) {
        String userEmail = request.getUserPrincipal().getName();
        reviewService.deleteReview(reviewId, userEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsByApartment(
            @PathVariable Long apartmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<ReviewDTO> reviews = reviewService.getReviewsByApartment(apartmentId, pageable);
        return ResponseEntity.ok(reviews.getContent());
    }

    @GetMapping("/can-review")
    public ResponseEntity<Boolean> canUserReviewApartment(
            @RequestParam Long userId,
            @RequestParam Long apartmentId,
            HttpServletRequest request
    ) {
        String userEmail = request.getUserPrincipal().getName();
        boolean canReview = reviewService.canUserReview(userId, apartmentId, userEmail);
        return ResponseEntity.ok(canReview);
    }

    @GetMapping("/apartment/{apartmentId}/rating")
    public ResponseEntity<Double> getApartmentRating(@PathVariable Long apartmentId) {
        double rating = reviewService.getRatingByApartment(apartmentId);
        return ResponseEntity.ok(rating);
    }
    
}
