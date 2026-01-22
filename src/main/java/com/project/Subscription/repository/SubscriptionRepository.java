package com.project.Subscription.repository;

import com.project.Subscription.entity.Subscription;
import com.project.Subscription.projection.MonthlySpendProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    @Query(
            value = """
            SELECT *
            FROM subscriptions s
            WHERE s.active = true
              AND (:name IS NULL OR s.service_name ILIKE '%' || CAST(:name AS TEXT) || '%')
              AND (:cycle IS NULL OR s.billing_cycle = :cycle)
            ORDER BY s.service_name
        """,
            countQuery = """
            SELECT COUNT(*)
            FROM subscriptions s
            WHERE s.active = true
              AND (:name IS NULL OR s.service_name ILIKE '%' || CAST(:name AS TEXT) || '%')
              AND (:cycle IS NULL OR s.billing_cycle = :cycle)
        """,
            nativeQuery = true
    )
    Page<Subscription> searchSubscriptions(
            @Param("name") String name,
            @Param("cycle") String cycle,
            Pageable pageable
    );

    @Query("""
            SELECT 
                TO_CHAR(s.startDate, 'YYYY-MM') AS month,
                SUM(s.amount) AS total
            FROM Subscription s
            WHERE s.active = true
            GROUP BY TO_CHAR(s.startDate, 'YYYY-MM')
            ORDER BY TO_CHAR(s.startDate, 'YYYY-MM')
           """)
    List<MonthlySpendProjection> getMonthlySpending();

    List<Subscription> findByNextBillingDateBetweenAndActiveTrue(LocalDate start, LocalDate end);

    List<Subscription> findByActiveFalse();
}



