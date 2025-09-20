package com.skyapartments.apartment.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skyapartments.apartment.model.Apartment;


public interface ApartmentRepository extends JpaRepository<Apartment, Long>{

    
}
