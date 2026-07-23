package com.tasksmanager.backend.feature.auth.service;


import com.tasksmanager.backend.feature.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/*
 * Creates, reads, and validates access tokens.
 *
 * The token contains the username as its subject
 * and the user's role as an additional claim.
 */
@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;

    @Autowired
    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration
    ) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.accessTokenExpiration = accessTokenExpiration;
    }

    /*
     * Creates a signed access token after successful login.
     */
    public String generateAccessToken(User user) {

        Date issuedAt = new Date();
        Date expiration = new Date(
                issuedAt.getTime() + accessTokenExpiration
        );

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(secretKey)
                .compact();
    }

    /*
     * Reads the username stored inside the token.
     */
    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    /*
     * Confirms that the token belongs to the expected user
     * and has not expired.
     */
    public boolean isTokenValid(String token, String username) {

        String tokenUsername = extractUsername(token);

        return tokenUsername.equals(username)
                && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaims(token)
                .getExpiration()
                .before(new Date());
    }

    /*
     * Verifies the signature before returning the token data.
     * Invalid or modified tokens will cause an exception.
     */
    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
