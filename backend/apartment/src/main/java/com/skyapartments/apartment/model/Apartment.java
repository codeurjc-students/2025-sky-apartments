package com.skyapartments.apartment.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.skyapartments.apartment.dto.ApartmentRequestDTO;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "apartments", uniqueConstraints = {
        @UniqueConstraint(columnNames = "name")
})
public class Apartment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;

    private String description;

    private BigDecimal price;

    @Column(name = "image_url")
    private String imageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    private Set<String> services;

    private int capacity;

    public Apartment() {
    }

    public Apartment(String name, String description, BigDecimal price, Set<String> services, int capacity) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.services = services;
        this.capacity = capacity;
    }

    public Apartment (ApartmentRequestDTO apartmentRequestDTO) {
        this.name = apartmentRequestDTO.getName();
        this.description = apartmentRequestDTO.getDescription();
        this.price = apartmentRequestDTO.getPrice();
        this.services = apartmentRequestDTO.getServices();
        this.capacity = apartmentRequestDTO.getCapacity();
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl (String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Set<String> getServices() {
        return services;
    }

    public void setServices(Set<String> services) {
        this.services = services;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

}

