package com.landmark.api.config;

import com.landmark.api.security.CustomUserDetailsService;
import com.landmark.api.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class SecurityConfigTest {

    @Mock
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Test
    @DisplayName("Should create PasswordEncoder bean and encode properly")
    void testPasswordEncoderBean() {
        SecurityConfig config = new SecurityConfig(jwtAuthenticationFilter, userDetailsService);
        PasswordEncoder encoder = config.passwordEncoder();

        assertNotNull(encoder);
        String encoded = encoder.encode("TestPassword@123");
        assertTrue(encoder.matches("TestPassword@123", encoded));
        assertFalse(encoder.matches("WrongPassword", encoded));
    }

    @Test
    @DisplayName("Should create AuthenticationProvider bean")
    void testAuthenticationProviderBean() {
        SecurityConfig config = new SecurityConfig(jwtAuthenticationFilter, userDetailsService);
        AuthenticationProvider provider = config.authenticationProvider();

        assertNotNull(provider);
    }

    @Test
    @DisplayName("Should create CorsConfigurationSource bean with permissive settings")
    void testCorsConfigurationSourceBean() {
        SecurityConfig config = new SecurityConfig(jwtAuthenticationFilter, userDetailsService);
        CorsConfigurationSource corsSource = config.corsConfigurationSource();

        assertNotNull(corsSource);
    }
}
