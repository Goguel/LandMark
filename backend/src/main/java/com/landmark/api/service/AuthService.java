package com.landmark.api.service;

import com.landmark.api.dto.AuthResponseDTO;
import com.landmark.api.dto.LoginRequestDTO;
import com.landmark.api.dto.RegisterRequestDTO;
import com.landmark.api.entity.User;

public interface AuthService {

    AuthResponseDTO register(RegisterRequestDTO request);

    AuthResponseDTO login(LoginRequestDTO request);

    User getCurrentAuthenticatedUser();
}
