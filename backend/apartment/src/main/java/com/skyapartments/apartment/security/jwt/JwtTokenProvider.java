package com.skyapartments.apartment.security.jwt;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class JwtTokenProvider {

	private final SecretKey jwtSecret;
    private final JwtParser jwtParser;

    public JwtTokenProvider(@Value("${jwt.secret}") String secret) {
        this.jwtSecret = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
        this.jwtParser = Jwts.parser().verifyWith(jwtSecret).build();
    }

	public String tokenStringFromHeaders(HttpServletRequest req){
		String bearerToken = req.getHeader(HttpHeaders.AUTHORIZATION);
		if (bearerToken == null) {
			throw new IllegalArgumentException("Missing Authorization header");
		}
		if(!bearerToken.startsWith("Bearer ")){
			throw new IllegalArgumentException("Authorization header does not start with Bearer: " + bearerToken);
		}
		return bearerToken.substring(7);
	}

	private String tokenStringFromCookies(HttpServletRequest request) {
		var cookies = request.getCookies();
		if (cookies == null) {
			throw new IllegalArgumentException("No cookies found in request");
		}

		for (Cookie cookie : cookies) {
			if (TokenType.ACCESS.cookieName.equals(cookie.getName())) {
				String accessToken = cookie.getValue();
				if (accessToken == null) {
					throw new IllegalArgumentException("Cookie %s has null value".formatted(TokenType.ACCESS.cookieName));
				}

				return accessToken;
			}
		}
		throw new IllegalArgumentException("No access token cookie found in request");
	}

	public Claims validateToken(HttpServletRequest req, boolean fromCookie){
		var token = fromCookie?
				tokenStringFromCookies(req):
				tokenStringFromHeaders(req);
		return validateToken(token);
	}

	public Claims validateToken(String token) {
		return jwtParser.parseSignedClaims(token).getPayload();
	}
}

