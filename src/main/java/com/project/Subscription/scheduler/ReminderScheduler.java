package com.project.Subscription.scheduler;

import com.project.Subscription.entity.Reminder;
import com.project.Subscription.entity.Subscription;
import com.project.Subscription.repository.ReminderRepository;
import com.project.Subscription.repository.SubscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class ReminderScheduler {

    private final SubscriptionRepository subscriptionRepository;
    private final ReminderRepository reminderRepository;

    public ReminderScheduler(SubscriptionRepository subscriptionRepository,
                             ReminderRepository reminderRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.reminderRepository = reminderRepository;
    }

    @Scheduled(cron = "0 * * * * *")
    public void generateReminders() {

        LocalDate reminderDate = LocalDate.now().plusDays(3);

        List<Subscription> subscriptions = subscriptionRepository.findAll();

        for (Subscription subscription : subscriptions) {
            if (subscription.getNextBillingDate().equals(reminderDate)) {

                String message = "Subscription for " + subscription.getServiceName() +
                        " will renew on " + subscription.getNextBillingDate();

                Reminder reminder = new Reminder(
                        subscription.getId(),
                        message,
                        LocalDate.now()
                );

                reminderRepository.save(reminder);
            }
        }
    }
}

