package com.skyapartments.user.dto;

import java.util.List;

import com.skyapartments.user.model.User;

public class UserDTO {

    private Long id;
    private String name;
    private String surname;
    private String email;
    private String phoneNumber;
    private List<String> roles;

    public UserDTO(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.surname = user.getSurname();
        this.email = user.getEmail();
        this.phoneNumber = user.getPhoneNumber();
        this.roles = user.getRoles();
    }

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

