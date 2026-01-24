package com.skyapartments.booking.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.skyapartments.booking.model.Filter;
import java.util.List;


@Repository
public interface FilterRepository extends JpaRepository<Filter, Long>{
    List<Filter> findByActivatedTrue();
    
    Page<Filter> findAllByOrderByIdAsc(Pageable pageable);
    
    List<Filter> findByActivatedTrueOrderByIdAsc();

}
