package com.project.Subscription.controller;

import com.project.Subscription.service.ForgotPasswordService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/password")
@CrossOrigin
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    public ForgotPasswordController(ForgotPasswordService forgotPasswordService) {
        this.forgotPasswordService = forgotPasswordService;
    }

    // ✅ Step 1 — Check email
    @GetMapping("/check")
    public boolean checkEmail(@RequestParam String email) {
        return forgotPasswordService.checkEmail(email);
    }

    // ✅ Step 2 — Reset password
    @PostMapping("/reset")
    public String resetPassword(
            @RequestParam String email,
            @RequestParam String newPassword) {

        forgotPasswordService.resetPassword(email, newPassword);
        return "Password updated successfully";
    }
}

