package com.skyapartments.booking.dto;

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

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setServices(Set<String> services) { this.services = services; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }


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
