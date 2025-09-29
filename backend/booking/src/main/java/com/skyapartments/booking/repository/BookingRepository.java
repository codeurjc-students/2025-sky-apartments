package com.skyapartments.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.skyapartments.booking.model.Booking;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
}