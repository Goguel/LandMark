package com.landmark.api.security;

import com.landmark.api.entity.Role;
import com.landmark.api.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        String testSecret = "tM/Lavz+teGCpzrPfvjhVK9djZV6tPAoaJaoaGjJkvU=";
        long expirationMs = 3600000; // 1 hour
        tokenProvider = new JwtTokenProvider(testSecret, expirationMs);

        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .name("Test User")
                .email("test@landmark.com")
                .role(Role.ROLE_USER)
                .build();
    }

    @Test
    @DisplayName("Should generate valid token and extract email correctly")
    void shouldGenerateAndExtractEmail() {
        String token = tokenProvider.generateToken(sampleUser);

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals("test@landmark.com", tokenProvider.getEmailFromToken(token));
    }

    @Test
    @DisplayName("Should return false for invalid or malformed token")
    void shouldReturnFalseForInvalidToken() {
        assertFalse(tokenProvider.validateToken("invalid.token.string"));
        assertFalse(tokenProvider.validateToken(""));
    }

    @Test
    @DisplayName("Should return false for expired token")
    void shouldReturnFalseForExpiredToken() {
        JwtTokenProvider expiredProvider = new JwtTokenProvider(
                "tM/Lavz+teGCpzrPfvjhVK9djZV6tPAoaJaoaGjJkvU=",
                -1000 // already expired
        );

        String expiredToken = expiredProvider.generateToken(sampleUser);
        assertFalse(expiredProvider.validateToken(expiredToken));
    }
}
