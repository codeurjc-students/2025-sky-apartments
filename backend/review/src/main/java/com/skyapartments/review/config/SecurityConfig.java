package com.skyapartments.review.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.skyapartments.review.security.jwt.JwtRequestFilter;
import com.skyapartments.review.security.jwt.UnauthorizedHandlerJwt;

@Configuration
public class SecurityConfig {

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Autowired
    private UnauthorizedHandlerJwt unauthorizedHandlerJwt;

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandlerJwt))
            .authorizeHttpRequests(auth -> auth
                // PRIVATE ENDPOINTS
                .requestMatchers(HttpMethod.POST, "/api/v1/reviews").hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/reviews/*").hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/reviews/*").hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/reviews/can-review").hasAnyRole("USER")
                // PUBLIC ENDPOINTS
                .anyRequest().permitAll()
            )

            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}