package com.skyapartments.apartment.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ApartmentRequestDTO {

    @NotBlank(message = "Name cannot be blank")
    private String name;

    @NotBlank(message = "Description cannot be blank")
    private String description;

    @NotNull(message = "Price cannot be null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    private Set<String> services;

    @Min(value = 1, message = "Capacity must be at least 1")
    private int capacity;

    @NotNull(message = "At least one image is required")
    @Size(min = 1, message = "At least one image is required")
    private List<MultipartFile> images;

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

    public List<MultipartFile> getImages() {
        return images;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setServices(Set<String> services) {
        this.services = services;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public void setImages(List<MultipartFile> images) {
        this.images = images;
    }
    
}
