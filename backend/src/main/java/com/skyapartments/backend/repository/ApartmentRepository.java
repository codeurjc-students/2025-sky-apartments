package com.skyapartments.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skyapartments.backend.model.Apartment;

public interface ApartmentRepository extends JpaRepository<Apartment, Long>{

    
}
