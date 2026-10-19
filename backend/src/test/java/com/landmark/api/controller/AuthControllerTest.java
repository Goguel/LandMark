package com.landmark.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.landmark.api.dto.AuthResponseDTO;
import com.landmark.api.dto.LoginRequestDTO;
import com.landmark.api.dto.RegisterRequestDTO;
import com.landmark.api.entity.Role;
import com.landmark.api.entity.User;
import com.landmark.api.exception.EmailAlreadyExistsException;
import com.landmark.api.exception.GlobalExceptionHandler;
import com.landmark.api.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private AuthResponseDTO sampleAuthResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();

        sampleAuthResponse = new AuthResponseDTO(
                "mock-jwt-token",
                UUID.randomUUID(),
                "Maria Silva",
                "maria@landmark.com",
                "ROLE_USER"
        );
    }

    @Test
    @DisplayName("POST /api/auth/register should return 201 Created on valid registration")
    void shouldReturn201OnRegister() throws Exception {
        RegisterRequestDTO request = new RegisterRequestDTO("Maria Silva", "maria@landmark.com", "Password123");

        when(authService.register(any(RegisterRequestDTO.class))).thenReturn(sampleAuthResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.email").value("maria@landmark.com"))
                .andExpect(jsonPath("$.role").value("ROLE_USER"));
    }

    @Test
    @DisplayName("POST /api/auth/register should return 400 Bad Request on invalid fields")
    void shouldReturn400OnInvalidRegister() throws Exception {
        RegisterRequestDTO invalidRequest = new RegisterRequestDTO("", "not-an-email", "123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors").exists());
    }

    @Test
    @DisplayName("POST /api/auth/register should return 409 Conflict when email already exists")
    void shouldReturn409OnDuplicateEmail() throws Exception {
        RegisterRequestDTO request = new RegisterRequestDTO("Maria Silva", "maria@landmark.com", "Password123");

        when(authService.register(any(RegisterRequestDTO.class)))
                .thenThrow(new EmailAlreadyExistsException("Email already exists"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already exists"));
    }

    @Test
    @DisplayName("POST /api/auth/login should return 200 OK on valid credentials")
    void shouldReturn200OnLogin() throws Exception {
        LoginRequestDTO request = new LoginRequestDTO("maria@landmark.com", "Password123");

        when(authService.login(any(LoginRequestDTO.class))).thenReturn(sampleAuthResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.email").value("maria@landmark.com"));
    }

    @Test
    @DisplayName("POST /api/auth/login should return 401 Unauthorized on bad credentials")
    void shouldReturn401OnBadCredentials() throws Exception {
        LoginRequestDTO request = new LoginRequestDTO("maria@landmark.com", "WrongPassword");

        when(authService.login(any(LoginRequestDTO.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("GET /api/auth/me should return 200 OK when user is authenticated")
    void shouldReturn200OnMeWhenAuthenticated() throws Exception {
        User user = User.builder()
                .id(UUID.randomUUID())
                .name("Maria Silva")
                .email("maria@landmark.com")
                .role(Role.ROLE_USER)
                .build();

        when(authService.getCurrentAuthenticatedUser()).thenReturn(user);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("maria@landmark.com"))
                .andExpect(jsonPath("$.name").value("Maria Silva"));
    }

    @Test
    @DisplayName("GET /api/auth/me should return 401 Unauthorized when user is null")
    void shouldReturn401OnMeWhenNotAuthenticated() throws Exception {
        when(authService.getCurrentAuthenticatedUser()).thenReturn(null);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
