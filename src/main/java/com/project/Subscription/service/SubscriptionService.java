package com.project.Subscription.service;

import com.project.Subscription.dto.SubscriptionRequest;
import com.project.Subscription.entity.Subscription;
import com.project.Subscription.projection.MonthlySpendProjection;
import com.project.Subscription.repository.SubscriptionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public Subscription createSubscription(SubscriptionRequest request) {

        LocalDate nextBillingDate;

        if ("YEARLY".equalsIgnoreCase(request.getBillingCycle())) {
            nextBillingDate = request.getStartDate().plusYears(1);
        } else {
            nextBillingDate = request.getStartDate().plusMonths(1);
        }

        Subscription subscription = new Subscription(
                request.getServiceName(),
                request.getAmount(),
                request.getBillingCycle(),
                request.getStartDate(),
                nextBillingDate
        );

        subscription.setActive(true);

        return subscriptionRepository.save(subscription);
    }

    public Page<Subscription> getSubscriptions(
            int page,
            int size,
            String sortBy,
            String name,
            String cycle
    ) {
        // ⚠️ IMPORTANT:
        // Do NOT use Sort.by() with native queries
        // It causes invalid column names in SQL.
        PageRequest pageable = PageRequest.of(page, size);

        return subscriptionRepository.searchSubscriptions(name, cycle, pageable);
    }

    public List<MonthlySpendProjection> getMonthlySpending() {
        return subscriptionRepository.getMonthlySpending();
    }

    public List<Subscription> getUpcomingRenewals(int days) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);
        return subscriptionRepository.findByNextBillingDateBetweenAndActiveTrue(today, endDate);
    }

    public List<Subscription> getArchivedSubscriptions() {
        return subscriptionRepository.findByActiveFalse();
    }

    public Subscription updateSubscription(UUID id, SubscriptionRequest request) {

        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        if (!subscription.isActive()) {
            throw new RuntimeException("Cannot update archived subscription");
        }

        subscription.setServiceName(request.getServiceName());
        subscription.setAmount(request.getAmount());
        subscription.setBillingCycle(request.getBillingCycle());
        subscription.setStartDate(request.getStartDate());

        LocalDate nextBillingDate;
        if ("YEARLY".equalsIgnoreCase(request.getBillingCycle())) {
            nextBillingDate = request.getStartDate().plusYears(1);
        } else {
            nextBillingDate = request.getStartDate().plusMonths(1);
        }
        subscription.setNextBillingDate(nextBillingDate);

        return subscriptionRepository.save(subscription);
    }

    public void archiveSubscription(UUID id) {

        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        subscription.setActive(false);
        subscriptionRepository.save(subscription);
    }

    public void toggleSubscription(UUID id) {

        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        subscription.setActive(!subscription.isActive());
        subscriptionRepository.save(subscription);
    }

}
