package com.skyapartments.booking.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.skyapartments.booking.model.Booking;
import com.skyapartments.booking.model.BookingState;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByUserIdOrderByStartDateDesc(Long userId, Pageable pageable);

    Page<Booking> findByApartmentIdOrderByStartDateDesc(Long apartmentId, Pageable pageable);

    List<Booking> findByApartmentIdAndStateNot(Long apartmentId, BookingState state);

    @Query("""
        SELECT b.apartmentId
        FROM Booking b
        WHERE b.state <> 'CANCELED'
        AND b.startDate < :endDate
        AND b.endDate > :startDate
    """)
    Set<Long> findUnavailableApartments(@Param("startDate") LocalDate startDate,
                                        @Param("endDate") LocalDate endDate);

    List<Booking> findByEndDateBeforeAndState(LocalDate today, BookingState state);

}