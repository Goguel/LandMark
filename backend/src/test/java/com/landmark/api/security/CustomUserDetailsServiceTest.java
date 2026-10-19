package com.landmark.api.security;

import com.landmark.api.entity.Role;
import com.landmark.api.entity.User;
import com.landmark.api.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    @Test
    @DisplayName("Should return UserDetails when email exists")
    void shouldReturnUserDetailsWhenUserExists() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .name("Alice")
                .email("alice@landmark.com")
                .password("hash")
                .role(Role.ROLE_USER)
                .build();

        when(userRepository.findByEmail("alice@landmark.com")).thenReturn(Optional.of(user));

        UserDetails userDetails = userDetailsService.loadUserByUsername("alice@landmark.com");

        assertNotNull(userDetails);
        assertEquals("alice@landmark.com", userDetails.getUsername());
        verify(userRepository, times(1)).findByEmail("alice@landmark.com");
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when email does not exist")
    void shouldThrowWhenUserNotFound() {
        when(userRepository.findByEmail("unknown@landmark.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () ->
                userDetailsService.loadUserByUsername("unknown@landmark.com")
        );
    }
}
