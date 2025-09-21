package com.skyapartments.apartment.repository;

import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.skyapartments.apartment.model.Apartment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ApartmentRepository extends JpaRepository<Apartment, Long>{

    @Query("""
        SELECT a
        FROM Apartment a
        WHERE (:minGuests IS NULL OR a.capacity >= :minGuests)
        AND (:requiredServices IS NULL OR :servicesCount = (
            SELECT COUNT(s)
            FROM a.services s
            WHERE s IN :requiredServices
        ))
        AND (:excludedIds IS NULL OR a.id NOT IN :excludedIds)
        ORDER BY a.price ASC
        """)
    Page<Apartment> findAvailableWithOptionalFilters(
        @Param("requiredServices") Set<String> requiredServices,
        @Param("servicesCount") Integer servicesCount,
        @Param("minGuests") Integer minGuests,
        @Param("excludedIds") Set<Long> excludedIds,
        Pageable pageable
    );


    @Query("SELECT DISTINCT s FROM Apartment a JOIN a.services s")
    Set<String> findDistinctServices();

    Page<Apartment> findAll (Pageable pageable);

    boolean existsByName(String name);
}
