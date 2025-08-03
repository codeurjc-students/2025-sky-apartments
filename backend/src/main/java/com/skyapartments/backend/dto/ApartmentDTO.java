package com.skyapartments.backend.dto;

import com.skyapartments.backend.model.Apartment;

public class ApartmentDTO {
    
    private Long id;
    
    private String name;

    private String description;

    private String address;

    public ApartmentDTO () {

    }

    public ApartmentDTO(Long id, String name, String description, String address) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.address = address;
    }

    public ApartmentDTO(Apartment apto) {
        this.id = apto.getId();
        this.name = apto.getName();
        this.description = apto.getDescription();
        this.address = apto.getAddress();
    }
}
