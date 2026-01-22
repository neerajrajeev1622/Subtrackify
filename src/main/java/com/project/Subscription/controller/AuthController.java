package com.project.Subscription.controller;

import com.project.Subscription.dto.LoginRequest;
import com.project.Subscription.dto.RegisterRequest;
import com.project.Subscription.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Object register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public String login(@Valid @RequestBody LoginRequest request) {

        boolean success = authService.login(
                request.getEmail(),
                request.getPassword()
        );

        if (success) {
            return "Login successful";
        } else {
            return "Invalid credentials";
        }
    }
}


