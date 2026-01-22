package com.project.Subscription.projection;

import java.math.BigDecimal;

public interface MonthlySpendProjection {

    String getMonth();
    BigDecimal getTotal();
}

