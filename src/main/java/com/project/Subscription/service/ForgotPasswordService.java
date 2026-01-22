package com.project.Subscription.service;

import com.project.Subscription.entity.User;
import com.project.Subscription.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class ForgotPasswordService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public ForgotPasswordService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ✅ Check if email exists
    public boolean checkEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // ✅ Reset password
    public void resetPassword(String email, String newPassword) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
    }
}

