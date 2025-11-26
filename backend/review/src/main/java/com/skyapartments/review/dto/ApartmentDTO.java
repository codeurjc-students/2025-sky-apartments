package com.skyapartments.review.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;


public class ApartmentDTO {

    private Long id;

    private String name;

    private String description;

    private BigDecimal price;

    private Set<String> services;

    private int capacity;

    private List<String> imageUrls; 

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Set<String> getServices() {
        return services;
    }

    public int getCapacity() {
        return capacity;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    
}
