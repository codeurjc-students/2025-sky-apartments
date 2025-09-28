package com.skyapartments.user.security.jwt;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

	@NotBlank(message = "Email is required")
	private String username;

	@NotBlank(message = "Password is required")
	private String password;

	public LoginRequest() {
	}

	public LoginRequest(String username, String password) {
		this.username = username;
		this.password = password;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	@Override
	public String toString() {
		return "LoginRequest [username=" + username + ", password=" + password + "]";
	}
}
