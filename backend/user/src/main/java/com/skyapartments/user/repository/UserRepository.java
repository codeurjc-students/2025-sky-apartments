package com.skyapartments.user.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.skyapartments.user.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
}
