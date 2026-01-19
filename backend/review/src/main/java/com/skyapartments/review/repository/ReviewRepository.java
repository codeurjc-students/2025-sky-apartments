package com.skyapartments.review.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.skyapartments.review.model.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByApartmentId(Long apartmentId, Pageable pageable);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.apartmentId = :apartmentId")
    Double getAverageRatingByApartmentId(@Param("apartmentId") Long apartmentId);

    boolean existsByUserIdAndApartmentId(Long userId, Long apartmentId);

}
