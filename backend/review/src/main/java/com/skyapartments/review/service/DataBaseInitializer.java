package com.skyapartments.review.service;

import org.springframework.stereotype.Component;

import com.skyapartments.review.model.Review;
import com.skyapartments.review.repository.ReviewRepository;

import jakarta.annotation.PostConstruct;

@Component
public class DataBaseInitializer {
    
    private final ReviewRepository reviewRepository;

    public DataBaseInitializer(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @PostConstruct
    public void initializeDatabase() throws Exception {
        reviewRepository.save(new Review(1L, 1L, "Very cozy and well-located apartment. The cleanliness was impeccable and the host was very attentive. Will definitely come back.", 5));
        reviewRepository.save(new Review(2L, 1L, "Excellent experience. The apartment had all the necessary amenities and was in a quiet but central area.", 5));
        reviewRepository.save(new Review(3L, 3L, "Small but functional apartment. Perfect for a short stay. The wifi worked well.", 4));
        reviewRepository.save(new Review(1L, 4L, "Spacious and bright. Ideal for families. The kitchen was fully equipped. Highly recommended.", 5));
        reviewRepository.save(new Review(1L, 5L, "Good value for money. The apartment was clean although some furniture needs renovation.", 4));

        reviewRepository.save(new Review(3L, 2L, "Modern apartment with spectacular views. Check-in was very easy and communication was excellent.", 5));
        reviewRepository.save(new Review(4L, 6L, "Very comfortable and well situated near public transport. Everything was as shown in the photos.", 4));
        reviewRepository.save(new Review(5L, 7L, "Large apartment perfect for our family. The kids enjoyed it a lot. Very safe area.", 5));
        reviewRepository.save(new Review(6L, 8L, "Clean and functional. Central location ideal for visiting the city. Parking was a plus.", 4));
        reviewRepository.save(new Review(7L, 9L, "Beautiful apartment with modern decoration. The terrace was incredible for evenings. Very satisfied.", 5));
        
        reviewRepository.save(new Review(1L, 10L, "Good experience overall. The apartment is exactly as described. Very professional host.", 4));
        reviewRepository.save(new Review(2L, 2L, "Wonderful stay. The apartment exceeded our expectations. We will definitely return.", 5));
        reviewRepository.save(new Review(3L, 4L, "Comfortable and well-equipped apartment. The location is perfect for exploring the area.", 4));
        reviewRepository.save(new Review(4L, 1L, "Exceptional in every aspect. Impeccable cleanliness, maximum comfort and personalized attention.", 5));
        reviewRepository.save(new Review(5L, 3L, "Very nice and cozy. The bed was very comfortable and the kitchen had everything we needed.", 5));
        
        reviewRepository.save(new Review(6L, 5L, "Spectacular apartment with all amenities. The building pool was a great plus.", 5));
        reviewRepository.save(new Review(7L, 6L, "Pleasant stay. The apartment was clean although the sofa needs renovation. Good location.", 4));
        reviewRepository.save(new Review(1L, 7L, "Perfect for a getaway. Quiet area and very well-maintained apartment. I recommend it.", 5));
        reviewRepository.save(new Review(2L, 8L, "Large and bright apartment. We really enjoyed our stay. Very friendly host.", 5));
        reviewRepository.save(new Review(3L, 9L, "Good value for money. The apartment met our expectations although the wifi was slow.", 4));
        
        reviewRepository.save(new Review(4L, 10L, "Cozy apartment in central area. Everything within reach for walking and visiting. Very satisfied.", 4));
        reviewRepository.save(new Review(5L, 1L, "Excellent apartment. Clean, modern and with excellent location. We will definitely repeat.", 5));
        reviewRepository.save(new Review(6L, 2L, "Very pleasant stay. The apartment had everything we needed. Very quiet area.", 5));
        reviewRepository.save(new Review(7L, 3L, "Spacious and well-distributed apartment. Perfect for groups. The terrace was great.", 5));

        reviewRepository.save(new Review(2L, 5L, "Good overall experience. The apartment was fine although we expected more for the price.", 3));
        reviewRepository.save(new Review(3L, 6L, "Fantastic apartment. The decoration is beautiful and everything was very clean. Perfect location.", 5));
        reviewRepository.save(new Review(4L, 7L, "Decent stay. The apartment is functional but needs some improvements in the furniture.", 3));
        reviewRepository.save(new Review(5L, 8L, "Very good apartment. Comfortable, clean and well located. The only negative was street noise.", 4));
        reviewRepository.save(new Review(6L, 9L, "Beautiful and very cozy apartment. We enjoyed every day of our stay. Highly recommended.", 5));
        
        reviewRepository.save(new Review(7L, 10L, "Excellent choice. The apartment exceeded our expectations in every way.", 5));
        reviewRepository.save(new Review(2L, 3L, "Good stay. The apartment is comfortable although a bit small for 4 people.", 4));
        reviewRepository.save(new Review(3L, 7L, "Very satisfied with our choice. Clean, modern and well-equipped apartment.", 5));
        reviewRepository.save(new Review(4L, 2L, "Cozy apartment with good location. Check-out was flexible, which we really appreciated.", 4));
    }
}

