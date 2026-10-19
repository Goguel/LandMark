package com.landmark.api.dto;

import java.util.UUID;

public record AuthResponseDTO(
        String token,
        String type,
        UUID id,
        String name,
        String email,
        String role
) {
    public AuthResponseDTO(String token, UUID id, String name, String email, String role) {
        this(token, "Bearer", id, name, email, role);
    }
}
