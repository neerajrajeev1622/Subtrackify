package com.project.Subscription.controller;

import com.project.Subscription.dto.SubscriptionRequest;
import com.project.Subscription.entity.Subscription;
import com.project.Subscription.projection.MonthlySpendProjection;
import com.project.Subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public Page<Subscription> getSubscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "serviceName") String sortBy,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String cycle
    ) {
        return subscriptionService.getSubscriptions(page, size, sortBy, name, cycle);
    }

    @GetMapping("/analytics/monthly")
    public List<MonthlySpendProjection> getMonthlySpending() {
        return subscriptionService.getMonthlySpending();
    }

    // ✅ Reminders API (NO other change)
    @GetMapping("/upcoming")
    public List<Subscription> getUpcomingRenewals(
            @RequestParam(defaultValue = "7") int days
    ) {
        return subscriptionService.getUpcomingRenewals(days);
    }

    @GetMapping("/archived")
    public List<Subscription> getArchivedSubscriptions() {
        return subscriptionService.getArchivedSubscriptions();
    }

    @PostMapping
    public Subscription createSubscription(@Valid @RequestBody SubscriptionRequest request) {
        return subscriptionService.createSubscription(request);
    }

    @PutMapping("/{id}")
    public Subscription updateSubscription(@PathVariable UUID id,
                                           @Valid @RequestBody SubscriptionRequest request) {
        return subscriptionService.updateSubscription(id, request);
    }

    @DeleteMapping("/{id}")
    public void archiveSubscription(@PathVariable UUID id) {
        subscriptionService.archiveSubscription(id);
    }

    // ✅ Toggle endpoint preserved exactly as you added
    @PatchMapping("/{id}/toggle")
    public void toggleSubscription(@PathVariable UUID id) {
        subscriptionService.toggleSubscription(id);
    }
}

