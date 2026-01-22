package com.project.Subscription.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI subscriptionApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Smart Subscription API")
                        .description("Backend API for managing subscriptions")
                        .version("1.0.0"));
    }
}

