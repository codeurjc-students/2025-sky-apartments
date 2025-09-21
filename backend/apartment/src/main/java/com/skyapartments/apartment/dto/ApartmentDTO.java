package com.skyapartments.apartment.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import com.skyapartments.apartment.model.Apartment;

public class ApartmentDTO {

    private Long id;

    private String name;

    private String description;

    private BigDecimal price;

    private Set<String> services;

    private int capacity;

    private String imageUrl; 

    public ApartmentDTO(Apartment apartment) {
        this.id = apartment.getId();
        this.name = apartment.getName();
        this.description = apartment.getDescription();
        this.price = apartment.getPrice();
        this.capacity = apartment.getCapacity();
        this.services = apartment.getServices();
        this.imageUrl = apartment.getImageUrl();
    }

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

    public String getImageUrl() {
        return imageUrl;
    }

}
