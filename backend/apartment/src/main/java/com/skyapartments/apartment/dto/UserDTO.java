package com.skyapartments.apartment.dto;

import java.util.List;

public class UserDTO {

    private Long id;
    private String name;
    private String surname;
    private String email;
    private String phoneNumber;
    private List<String> roles;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSurname() {
        return surname;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public List<String> getRoles() {
        return roles;
    }

}

