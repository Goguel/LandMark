package com.landmark.api.service;

import com.landmark.api.dto.AuthResponseDTO;
import com.landmark.api.dto.LoginRequestDTO;
import com.landmark.api.dto.RegisterRequestDTO;
import com.landmark.api.entity.Role;
import com.landmark.api.entity.User;
import com.landmark.api.exception.EmailAlreadyExistsException;
import com.landmark.api.repository.UserRepository;
import com.landmark.api.security.JwtTokenProvider;
import com.landmark.api.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .name("Carlos Santos")
                .email("carlos@landmark.com")
                .password("hashed_password")
                .role(Role.ROLE_USER)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should successfully register new user")
    void shouldRegisterNewUser() {
        RegisterRequestDTO request = new RegisterRequestDTO("Carlos Santos", "carlos@landmark.com", "Secret123");

        when(userRepository.existsByEmail("carlos@landmark.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret123")).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateToken(sampleUser)).thenReturn("jwt-token-123");

        AuthResponseDTO response = authService.register(request);

        assertNotNull(response);
        assertEquals("jwt-token-123", response.token());
        assertEquals("carlos@landmark.com", response.email());
        assertEquals("Carlos Santos", response.name());
        assertEquals("ROLE_USER", response.role());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw EmailAlreadyExistsException when registering duplicate email")
    void shouldThrowWhenRegisteringDuplicateEmail() {
        RegisterRequestDTO request = new RegisterRequestDTO("Carlos Santos", "carlos@landmark.com", "Secret123");

        when(userRepository.existsByEmail("carlos@landmark.com")).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should successfully authenticate user with valid credentials")
    void shouldLoginWithValidCredentials() {
        LoginRequestDTO request = new LoginRequestDTO("carlos@landmark.com", "Secret123");

        when(userRepository.findByEmail("carlos@landmark.com")).thenReturn(Optional.of(sampleUser));
        when(tokenProvider.generateToken(sampleUser)).thenReturn("jwt-token-123");

        AuthResponseDTO response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token-123", response.token());
        assertEquals(sampleUser.getId(), response.id());
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Should throw BadCredentialsException when password authentication fails")
    void shouldThrowWhenAuthenticationFails() {
        LoginRequestDTO request = new LoginRequestDTO("carlos@landmark.com", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should return current authenticated user from SecurityContext")
    void shouldReturnCurrentAuthenticatedUser() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(sampleUser.getEmail(), null, sampleUser.getAuthorities())
        );

        when(userRepository.findByEmail(sampleUser.getEmail())).thenReturn(Optional.of(sampleUser));

        User current = authService.getCurrentAuthenticatedUser();

        assertNotNull(current);
        assertEquals(sampleUser.getEmail(), current.getEmail());
    }

    @Test
    @DisplayName("Should return null when no authenticated user in SecurityContext")
    void shouldReturnNullWhenNoAuthenticatedUser() {
        SecurityContextHolder.clearContext();

        User current = authService.getCurrentAuthenticatedUser();

        assertNull(current);
    }
}
